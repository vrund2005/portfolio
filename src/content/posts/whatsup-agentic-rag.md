---
title: WhatsUp Agentic RAG
subtitle: How an agentic RAG pipeline answers questions about a WhatsApp group chat written in English and romanized Gujarati — chunking, glossing, hybrid retrieval, and the choices behind each.
date: 2026-08-11
tags: ["Agentic AI", "RAG", "LangGraph", "ChromaDB", "BM25", "Whisper"]
art: retrieval
accent: emerald
project: https://github.com/vrund2005/WhatsUp-GenAI
---
# Building a RAG system over a WhatsApp group chat that speaks two languages at once

*Retrieval over 15 months of a group chat written in English, Gujarati, and a
third thing that is neither.*

---

## 1. The problem

I exported a WhatsApp group chat — 11,699 lines, 8,820 real messages, four
people, April 2025 to July 2026 — and wanted to ask questions about it in plain
English:

> *when did we plan the trip ?*\
> *who created this group and when ?*\
> *what did Vansh say about the bus tickets ?*

This sounds like a solved problem. Chunk the text, embed it, store the vectors,
retrieve top-k, feed it to an LLM. Every RAG tutorial ends there.

It does not work here, for three reasons that have nothing to do with the model
you pick.

**The chat is code-switched.** Most messages are romanized Gujarati — Gujarati
written in English letters:

```
Vrund Patel: Aaje ramvanu chhe mitro !?
Vansh™: Hu to extreme level kau chu 🤣
Parth™: Avta Friday raja che tamre ?
```

This is not English and it is not Gujarati script. It sits in a sparse,
under-trained region of every multilingual embedding space, and it has **no
standard spelling** — the same word appears as `ramva`, `ramvanu`, `ramvama`
depending on who typed it and how fast.

**"When" questions need exact dates.** If someone asks when a trip was planned,
an answer that is off by a month is worse than no answer. LLMs are famously bad
at arithmetic on dates, and will happily invent a plausible one.

**Chat isn't prose.** There are no paragraphs or sections to split on. A
"document" in a group chat is a burst of conversation bounded by silence, and a
naive fixed-size splitter will cut straight through the middle of a decision.

Everything interesting in this project is a response to one of those three facts.

---

## 2. The stack, and why each piece is there

| Layer | Choice | Why this one |
|---|---|---|
| Parsing | Hand-written regex (`parser.py`) | WhatsApp exports vary by locale/OS. A library would hide the format quirks I needed to see. |
| Chunking | Time-gap sessions (`chunker.py`) | In chat, silence *is* the topic boundary. Token-count splitters have no idea where a conversation ended. |
| Embeddings | **bge-m3** via Ollama | Genuinely multilingual, handles mixed scripts, runs locally so private data never leaves the machine. |
| Vector store | **ChromaDB** (persistent, cosine) | Zero-config, on-disk, supports scalar metadata filters. No server to run for a single-user tool. |
| Lexical search | **BM25** (`rank_bm25`) | Exact-token matching. The one thing dense retrieval is worst at, and exactly what romanized Gujarati needs. |
| Fusion | **Reciprocal Rank Fusion** | Combines two rankers whose scores are on incomparable scales. |
| Reranking | **bge-reranker-v2-m3** cross-encoder | Reads (query, chunk) *together* instead of comparing two independent vectors. |
| Orchestration | **LangGraph** | Makes the branch structure explicit and inspectable, instead of hiding it in if-statements. |
| Generation | **Ollama** (local) / **Groq** (cloud) | Same code path; local by default for privacy, cloud when speed matters. |
| Speech-to-text | **Whisper large-v3-turbo** (Groq) / faster-whisper (local) | Handles code-switched speech; local option keeps audio offline. |
| API | **FastAPI** + Server-Sent Events | Streaming without WebSocket ceremony. |
| UI | One HTML file, no framework | No build step, no `node_modules`, opens in any browser. |

---

## 3. The data pipeline

```
_chat.txt (686 KB, 11,699 lines)
     │
     ▼
┌──────────────┐
│  parser.py   │  regex line matcher + multi-line message assembly
└──────────────┘
     │
     ├──▶ 8,820 conversational messages ──▶ chunker ──▶ embeddings
     ├──▶ 83 chat events                 ──▶ events.json (exact facts)
     └──▶ noise (media placeholders, encryption notice) ──▶ dropped
```

### 3.1 Parsing: system lines are not garbage

The obvious move is to throw away every line WhatsApp generated itself. That
would be a mistake. `"Pankilll created this group"` is not noise — it is a
**fact**, and it answers a question that semantic search answers badly.

So the parser sorts every line into three buckets:

- **messages** — real conversation, gets embedded
- **events** — 83 of them (`created`, `added`, `removed`), stored as structured
  JSON with actor and timestamp
- **noise** — `<Media omitted>`, the end-to-end-encryption notice, deleted
  messages — dropped entirely

Text is normalized before it ever reaches the embedder: invisible
bidirectional control characters stripped, `<This message was edited>` removed,
and URLs collapsed to `[instagram link]` / `[youtube link]` / `[link]` so that
a wall of tracking parameters doesn't dominate a chunk's embedding.

### 3.2 Chunking: silence is the delimiter

```
GAP_MINUTES        = 30    # >30 min of silence starts a new session
MAX_MESSAGES       = 40    # cap so one embedding stays focused
OVERLAP            = 5     # messages repeated across a split
MIN_MESSAGES       = 4     # smaller than this gets merged into a neighbour
MERGE_WINDOW_HOURS = 6     # ...but only if the neighbour is this close
```

Three passes: group by time gap, merge fragments that are too small to stand
alone, split sessions that are too large (with overlap, so an idea spanning the
boundary survives in at least one chunk).

The merge step exists because WhatsApp is bursty: `kal plan che` at 11pm, reply
at 8am — same topic, nine hours apart. Raising the gap threshold enough to
catch that would also glue together genuinely unrelated conversations, so
instead only *small* fragments get merged, and only when a neighbour is close.

`GAP_MINUTES = 30` wasn't a guess. `chunker.py --sweep` prints chunk-size
statistics across thresholds from 15 to 240 minutes; 30 gave a median of 14
messages per chunk without a long tail of one-message fragments.

**Result: 502 chunks**, median 14 messages, mean 18.4, max 40, ~790 characters
each.

One deliberate omission: precise timestamps stay **out** of the chunk text.
Only a single date header goes in (`Conversation on 13 Mar 2026:`). Exact times
live in metadata, where they can be filtered on — putting them in the text adds
noise to the embedding and gives the LLM numbers to hallucinate with.

### 3.3 Glossing: the trick that makes Gujlish searchable

This is the most important idea in the project.

Romanized Gujarati embeds badly. You cannot fix that by choosing a better
embedding model — the text genuinely is rare on the internet. So instead of
fighting the embedding space, **change what gets embedded**.

Before indexing, every chunk gets one English sentence written by an LLM
describing what happened in it, prepended to the text:

```
Context: Vansh, Parth and Vrund arranging a BGMI session for 9pm.
Conversation on 08 Jul 2026:
Vrund Patel: Aaje ramvanu chhe mitro !?
...
```

Now the chunk's embedding carries **English semantics** — a query like *"gaming
plans"* can find it — while the original Gujlish text stays in the document, so
BM25 still matches the literal tokens and the generator still reads the real
messages.

502 glosses, averaging 18.6 words. Generation is resumable: glosses are cached
by `chunk_id`, so a crash or Ctrl-C costs nothing and re-running continues where
it stopped. This matters — it's 502 sequential LLM calls.

This technique is Anthropic's *contextual retrieval* idea, applied to a language
problem instead of a document-fragmentation one.

### 3.4 Storage

Chroma metadata only accepts scalars, which shapes the schema:

| Field | Type | Purpose |
|---|---|---|
| `start_ts`, `end_ts` | int (unix) | range filters — `$gte` / `$lte` |
| `start_iso`, `end_iso` | str | display |
| `date_str` | str | pre-formatted, e.g. `13 Mar 2026, 08:22 AM` |
| `senders` | str | `"|Vansh|Parth|"` — pipe-wrapped |
| `n_messages`, `year`, `month` | int | display / coarse filtering |

Dates are stored as **unix integers** because that's the only type Chroma can
do range comparisons on. `date_str` is pre-formatted at index time so the
generator can quote a date verbatim rather than format one itself.

Senders are wrapped in pipes (`|Vansh™|`) so a substring check can't match
`Van` inside `Vansh`. Chroma can't substring-match metadata anyway, so sender
filtering happens in Python after retrieval — which is why the retriever
over-fetches 4× whenever a sender filter is active.

---

## 4. Retrieval: three techniques, each covering the others' blind spot

```
query
  ├──────────────┬──────────────┐
  ▼              ▼              │
dense          BM25             │  each returns ~30 candidates
(bge-m3)     (rank_bm25)        │
  └──────┬───────┘              │
         ▼                      │
   RRF fusion                   │
         ▼                      │
  cross-encoder rerank ◀────────┘
         ▼
      top-k (5)
```

**Dense (bge-m3).** Understands meaning. Finds *"gaming plans"* → a chunk about
BGMI. Weak on romanized Gujarati, which is exactly why the glosses exist.

**BM25.** Pure lexical matching, no semantics at all. `BGMI`, `goa`,
`ramva`, and people's names are literal tokens it nails. Deliberately **no
stemming** — there is no stemmer for romanized Gujarati, and stemming would only
destroy the exact-match property that makes BM25 useful here. The tokenizer
keeps `[a-z0-9]` plus the Gujarati Unicode block, so native-script text still
tokenizes if it appears.

**RRF fusion.** A BM25 score of 14.2 and a cosine similarity of 0.83 are not
comparable — adding or averaging them is meaningless. RRF throws the scores away
and uses only **rank**:

```
score(doc) = Σ  1 / (k + rank_in_that_list)      k = 60
```

Ranks are always comparable. `k = 60` is the value from the original paper; it
damps the difference between rank 1 and rank 2 so a single ranker can't
completely dominate.

**Cross-encoder reranking.** The bi-encoder (bge-m3) embeds query and chunk
*separately* and compares vectors — fast, and inherently lossy, because the two
were encoded without knowledge of each other. A cross-encoder feeds
`[query, chunk]` through the model **together**, so attention runs across both.
Far more accurate, and far too slow to run over 502 chunks — so it only sees the
~30 candidates the first two stages surfaced. Same `bge` family as the embedder,
so it handles the mixed script consistently.

All four modes (`dense`, `bm25`, `hybrid`, `hybrid_rerank`) are switchable at
runtime, and `compare.py` runs one query through all four side by side. That
was a deliberate choice: **I wanted to be able to check whether any of this
actually helped**, rather than assuming it did.

> **Honest caveat:** there is no labelled eval set and no accuracy number. I
> can show that reranking reorders results; I can't prove by how much it
> improves them. Building that eval set is the most valuable thing left to do.

---

## 5. The LangGraph pipeline

```
             question
                │
           ┌────▼────┐
           │ classify│   ← the ONLY LLM call that affects retrieval
           └────┬────┘
                │  emits JSON, not an answer
        route_by_intent   ← plain Python. deterministic. no model.
        ┌───────┼───────┐
        ▼       ▼       ▼
    semantic temporal  event
        └───────┼───────┘
                ▼
           ┌─────────┐
           │ generate│   ← writes the answer from retrieved context
           └────┬────┘
                ▼
             answer
```

### The design rule

> **The LLM never searches and never computes dates. It only emits a
> structured filter. Code applies it.**

`classify` is the single model call that influences retrieval, and it returns
JSON — never prose:

```json
{"intent":"semantic","semantic_query":"BGMI",
 "date_from":"2026-03-01","date_to":"2026-03-31","sender":null}
```

Python turns those ISO dates into unix-integer range filters and hands them to
Chroma. The model proposes; deterministic code disposes. That is why timestamps
in answers are exact rather than plausible.

### Why three routes

- **semantic** — "what was said about X". Straight hybrid retrieval.
- **temporal** — "when did X happen". Same retrieval, but results are re-sorted
  **chronologically** before generation, so "the first time" means the earliest
  chunk rather than the highest-scoring one.
- **event** — "who created this group", "who was added". No embeddings, no
  vector search at all: a direct lookup in `events.json`, keyword-mapped to an
  event type and sorted by timestamp.

The event route is the clearest example of the whole philosophy. *"Who created
this group"* has exactly one correct answer sitting in a JSON file. Retrieving
it semantically would be slower, less reliable, and occasionally wrong. **Not
every question in a RAG system deserves retrieval.**

The generator is then told, explicitly: use only these excerpts; every excerpt
carries a date in brackets; when asked *when*, quote that date exactly; if the
excerpts don't contain the answer, say so.

---

## 6. Provider-agnostic model layer

`llm.py` is one interface with several transports behind it:

```
LLM_PROVIDER=ollama    →  localhost:11434        (default)
LLM_PROVIDER=groq      →  api.groq.com
LLM_PROVIDER=openrouter / together / openai
```

Groq, OpenRouter, Together and OpenAI are all OpenAI-compatible, so one code
path covers them all — only the base URL and key name change.

**Local is the default** because the chat is private data. Cloud is opt-in, for
when speed matters. The difference is not subtle: classification takes ~4–13
seconds on local `gemma3:4b` and **0.5 seconds** on Groq's
`llama-3.1-8b-instant`.

That leads to the second idea here — **per-task models**:

```
LLM_MODEL_CLASSIFY = llama-3.1-8b-instant      # emits {"intent":"semantic"}
LLM_MODEL_GENERATE = llama-3.3-70b-versatile   # writes the actual answer
```

Classification is trivial structured extraction; a small fast model does it
perfectly. Generation is where quality shows. Running a 70B model to produce a
five-field JSON object is a waste of both budget and latency. The UI exposes
this — you can classify on Groq and generate locally, or any mix.

---

## 7. Voice input

Ask out loud, then **confirm before anything runs**:

```
mic ──▶ record ──▶ Whisper ──▶ ┌──────────────────────┐
                               │ "I heard this — ask  │
                               │  it, or try again?"  │  ← editable
                               └──────────┬───────────┘
                                          │ only on confirm
                                          ▼
                                    the RAG pipeline
```

The confirmation gate is the point. `/api/transcribe` deliberately returns
**only text** — it never calls the graph. A misheard question would otherwise
become a confidently wrong answer about a question you never asked, and you'd
have no way to tell. The transcript is editable, so one wrong word costs an edit
rather than a re-record.

Two details, both forced by the same code-switching problem as everything else:

**Language is forced to `en`, not auto-detect.** On auto-detect, Whisper
correctly identifies Gujlish speech as Gujarati and transcribes it in **Gujarati
script** — which the index does not contain, so BM25 matches nothing and the
dense vectors land somewhere unrelated. Forcing `en` makes Whisper write the
sounds in Latin letters, which is the spelling the corpus actually uses.

**Whisper gets the group's names as a spelling hint**, pulled from Chroma
metadata and cached. Without it, "Vansh" comes back as "Vaansh" and misses every
BM25 token.

---

## 8. Streaming the pipeline, not just the answer

The backend translates each LangGraph node update into a Server-Sent Event:

```
event: step    {"node":"classify","status":"running"}
event: plan    {"intent":"temporal","semantic_query":"goa trip plan", ...}
event: chunks  {"chunks":[{date_str, senders, score, text}, ...]}
event: token   {"t":"The"}      ← answer streams word by word
event: done    {"answer":"...","elapsed":7.89}
```

So the UI shows the route, the extracted filter, and the retrieved source chunks
**while the answer is still being written**, instead of a spinner followed by a
wall of text. Every answer is auditable: which route fired, what filter was
extracted, which chunks were retrieved and at what score.

The UI is a single HTML file — no build step, no dependencies, no framework.
It's a local tool; `npm install` would have been the heaviest thing in the
repository.

---

## 9. Four bugs worth writing down

The interesting part of any project is where it broke.

### Mojibake from the cloud provider

Answers came back as `10â€¯Julâ€¯2026` and `Parthâ¢`. The cause was neither the
model nor the data — the indexed text was clean:

Groq streams as `Content-Type: text/event-stream` with **no charset**. Python's
`requests`, asked to decode a `text/*` response without a charset, falls back to
**ISO-8859-1**. Every multi-byte UTF-8 character came apart into individual
Latin-1 characters:

```
r.encoding   : ISO-8859-1
streamed     : '10 Jul 2026, 08:50 PM â\x80\x94 â\x80\x98helloâ\x80\x99 ð\x9f\x98\x81'
```

Fix: decode the byte stream explicitly as UTF-8 rather than trusting the header.
Splitting on `\n` first is safe — no UTF-8 continuation byte can be `0x0A`.

### A closed browser tab deadlocked the server

The config lock was held *inside* the streaming generator. When a browser hung
up mid-answer, Starlette abandoned the generator without closing it — so the
lock was never released and **every subsequent question hung forever**.

Fix: run the pipeline in a plain worker thread that owns the lock in
`try/finally` and feeds an **unbounded** queue. Unbounded matters — a bounded
queue would let the worker block forever on a reader that already left, which is
the same deadlock wearing a different hat.

### One missing element killed the entire UI

A commented-out sidebar section left `$("#examples")` returning `null`. The
resulting `TypeError` aborted the rest of the script — including the calls that
load health, models and settings. The whole sidebar silently showed HTML
defaults, and nothing indicated why.

Fix: every optional element now goes through a `wire(selector, fn)` helper that
no-ops when the element is absent. Comment out any section; the rest still works.

### `hidden` lost to `display: flex`

Panels marked `hidden` still rendered as empty strips, because an explicit
`display:flex` in CSS beats the `hidden` attribute. One line fixed it:

```css
[hidden]{display:none !important}
```

---

## 10. A privacy lesson

`.gitignore` had `_chat.txt` in it. That was not enough.

**`chroma_db/chroma.sqlite3` and `bm25_index.pkl` contain the chat verbatim.**
Chroma stores the document text alongside the vectors; the BM25 index pickles
all 502 raw documents. Both had been committed. I confirmed it by opening the
committed database straight out of git history and reading real messages from it.

Two things follow:

1. **Ignoring a file does not untrack it.** Files already tracked stay tracked;
   `.gitignore` only affects untracked files.
2. **Derived artifacts leak as much as the source.** A vector store is not an
   opaque blob — it's your text plus some floats.

The fix was `git filter-repo` over every private path — the export, the vector
store, the BM25 index, the glosses, the events — followed by a force push.

---

## 11. What I'd do next

- **An eval set.** 30–50 questions with known-correct chunks, so "hybrid +
  rerank is better" becomes a number instead of an intuition. This is the
  biggest gap.
- **HyDE** — generate a hypothetical answer, embed *that* instead of the
  question. Should help, because a written-out answer looks more like a chunk
  than a short question does.
- **Multi-hop questions.** "Did we ever go on the trip we planned in March?"
  needs two retrievals and a comparison. The current graph is single-shot.
- **Conversation memory.** Every question is currently independent; follow-ups
  like "what about Parth?" don't work.
- **Incremental indexing.** Re-exporting the chat today means re-embedding all
  502 chunks. Only new sessions need it.

---

## 12. Numbers

| | |
|---|---|
| Raw export | 686 KB, 11,699 lines |
| Conversational messages | 8,820 |
| Chat events (created/added/removed) | 83 |
| Participants | 4 |
| Date range | Apr 2025 → Jul 2026 (15 months) |
| Chunks indexed | 502 (median 14 msgs, mean 18.4, max 40) |
| Glosses | 502 (avg 18.6 words) |
| Retrieval candidates before rerank | 30 |
| Chunks passed to the generator | 5 (configurable 1–12) |
| Python source | 2,233 lines across 12 modules |
| UI | 1 file, 1,014 lines, 0 dependencies |
| Classification latency | ~0.5s (Groq) vs ~4–13s (local gemma3:4b) |
| Transcription latency | ~0.3s (Groq whisper-large-v3-turbo) |

---

## Closing thought

Most of the engineering here isn't about the LLM. It's about deciding what the
LLM should never be trusted to do — search, compute dates, or recall facts — and
building deterministic machinery around that boundary. The model classifies and
it writes. Everything in between is code you can read, test, and blame.

The code-switching problem forced that discipline. A cleaner corpus would have
let a naive pipeline look like it worked, and I'd have learned much less.
