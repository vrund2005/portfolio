---
title: RoastForge — MCP
subtitle: Resume Roaster & Rebuilder - A plain-English deep dive into the three ideas powering my resume agent — Agentic AI, LangGraph, and the Model Context Protocol — and why I chose each one.
date: 2026-08-06
tags: ["Agentic AI", "LangGraph", "MCP", "FastMCP", "Python"]
art: graph
accent: fuchsia
project: https://github.com/vrund2005/roastforge
---

Every time I post a project on LinkedIn, the same thing happens: people like it, a few comment "great work!", and almost nobody asks *how it actually works*. Which is fair — a LinkedIn post is 3 lines and a demo video. There's no room to explain what an "8-node LangGraph workflow" even means.

So this is the first post of a new habit: after every project, I'll write the deep dive here. Not to show off the code — that's on GitHub — but to explain the **concepts** behind it, in the plain English I wish someone had used when I was learning them.

Let's start with RoastForge.

## The problem RoastForge solves

Before a human recruiter ever reads your resume, a piece of software called an **ATS** (Applicant Tracking System) usually scans it first. It parses your PDF, extracts skills and keywords, compares them against the job description, and assigns a score. Score too low? A human never sees you.

Most people polish their resume for human eyes and never think about the machine reading it first. RoastForge flips that:

1. It **parses** your resume like an ATS would.
2. It **roasts** it — brutally and specifically pointing out weak bullet points, vague claims, and missing numbers.
3. It **scores** your ATS fit from 0–100.
4. If the score is below 90, it **rewrites the weak sections and scores again** — looping until it crosses 90.
5. Finally, it generates **likely interview questions** from your resume and exports a clean **PDF**.

The interesting part isn't any single step. It's that no human sits between the steps. The system decides *on its own* whether the resume is good enough or needs another rewrite pass. That decision-making is what makes it **agentic** — and that word gets thrown around so much that it's worth defining properly.

## What "Agentic AI" actually means

A normal LLM call is a vending machine: one prompt in, one answer out. Ask ChatGPT to "improve my resume" and you get one rewrite — it might be great, it might be worse, but either way the interaction is over.

An **agent** is different in three specific ways:

- **It has tools.** It can *do* things — parse a PDF, call a scoring function, write a file — not just generate text.
- **It has a loop.** It looks at the result of its own work and decides what to do next.
- **It has a goal, not a script.** I never tell RoastForge "rewrite the resume twice." I tell it "get the score above 90," and *it* figures out how many passes that takes.

> A chatbot answers you. An agent works for you until the job is done.

That third point is the key mental shift. In traditional programming, *I* write the control flow. In an agentic system, I define the **states** and the **rules for moving between them**, and the LLM's own judgment drives the transitions.

Which raises an engineering question: if the AI decides where to go next, how do you stop it from wandering off forever? That's exactly the problem LangGraph exists to solve.

## LangGraph: giving the agent a map

[LangGraph](https://www.langchain.com/langgraph) is a framework from the LangChain team for building agents as **state machines** — a graph of nodes, where each node is one unit of work and the edges define which steps can follow which.

Why not just chain the steps in plain Python? Because of the loop. "Rebuild until the score is above 90" is a *cycle*, and cycles are where naive agent code turns into spaghetti: retry counters, while-loops with LLM calls inside, state passed around in dicts that mutate in six places. LangGraph makes the cycle a first-class citizen.

RoastForge is 8 nodes. Simplified, the shape looks like this:

```text
start → pdf_parser
          ├──→ roast → end
          │
          └──→ ats ──(good)────────────→ questions → end
                    │
                    ├──(download_pdf)→ download_pdf → questions
                    │
                    └──(not_good)→ research → new_resume
                                             │
                                             └────────→ ats
```

Every node reads and writes one shared, typed **state** object:

```python
from typing import TypedDict

class ResumeState(TypedDict):
    raw_text: str          # extracted from the uploaded PDF
    roast: str             # the brutal feedback
    ats_score: int         # 0–100
    rebuilt_resume: str    # latest rewrite
    iterations: int        # safety counter
    questions: list[str]   # generated interview questions
```

And the "keep rebuilding until it's good enough" behaviour — the entire agentic heart of the project — is just one **conditional edge**:

```python
def should_continue(state: ResumeState) -> str:
    if state["ats_score"] >= 90:
        return "generate_questions"      # good enough, move on
    if state["iterations"] >= 5:
        return "generate_questions"      # safety valve: never loop forever
    return "rebuild"                     # rewrite again

graph.add_conditional_edges("ats_score", should_continue)
```

Three things I learned building this that no tutorial told me:

- **Always add a safety valve.** My first version had no `iterations` cap. One stubborn resume oscillated between 87 and 89 forever, happily burning API credits. Agents need a budget, not just a goal.
- **Typed state is not optional.** When six nodes write to the same object, a `TypedDict` (or Pydantic model) is the difference between debugging in minutes and debugging in hours.
- **Keep nodes boring.** Each node should do *one* thing. The intelligence lives in the edges — the decisions — not in giant do-everything prompts.

## MCP: giving the agent hands

So LangGraph is the brain and the map. But the agent still needs to touch the outside world: read a PDF, render a new one, check formatting. That's where **MCP — the Model Context Protocol** — comes in.

MCP is an open standard (introduced by Anthropic) for connecting AI models to tools and data. The easiest way to understand it:

> MCP is a USB-C port for AI. Any model can plug into any tool, as long as both speak the protocol.

Before MCP, every AI app wired up its tools in its own custom way — your PDF parser was glued to *this* agent, in *this* codebase, and reusable nowhere. With MCP, tools live in a **server**, the agent is a **client**, and the protocol between them is standard. My resume-parsing and PDF-export tools are now a standalone MCP server. Claude Desktop can use them. Cursor can use them. My next project can use them. Write once, plug in anywhere.

**FastMCP** is the Python framework that makes building such a server almost embarrassingly easy — decorate a function, and it becomes a tool any MCP client can discover and call:

```python
from fastmcp import FastMCP

mcp = FastMCP("roastforge-tools")

@mcp.tool()
def export_pdf(resume_markdown: str, template: str = "modern") -> str:
    """Render the rebuilt resume to a professional PDF."""
    path = render_template(resume_markdown, template)
    return f"PDF written to {path}"
```

No route definitions, no request parsing, no schema files. The function signature *is* the contract — FastMCP reads the type hints and the docstring, and the model on the other side knows exactly how to call it.

## The stack, and why each piece

| Layer | Choice | Why this and not something else |
| --- | --- | --- |
| Agent orchestration | LangGraph | Cycles + conditional edges as first-class citizens; plain chains can't loop cleanly |
| Tool protocol | MCP via FastMCP | Tools become reusable across every MCP client, not welded to one app |
| Language | Python | The entire AI tooling ecosystem lives here |
| Resume parsing | PDF text extraction | An ATS sees text, not layout — so the agent must too |
| Output | Programmatic PDF export | The final artifact must look human-made, not model-made |

## What I'd tell past-me

If you're starting your first agentic project, the roadmap that would have saved me weeks:

1. **Write the workflow on paper first.** Nodes and arrows, before any code. If you can't draw the loop, you can't build it.
2. **Build the tools as plain functions first.** Get parsing and scoring working in a notebook. Wrap them in FastMCP *after* they work.
3. **Add the graph last.** LangGraph is the skeleton you hang working pieces on — it can't fix pieces that don't work.
4. **Log every state transition.** When an agent misbehaves, the bug is almost always in an edge condition, not in a prompt.

The deeper lesson: **agentic AI is mostly software engineering.** The LLM writes the roast, but everything that makes RoastForge *reliable* — the typed state, the iteration cap, the clean tool boundaries — is classic engineering discipline applied to a new kind of program.

---

The full code is on [GitHub](https://github.com/vrund2005/roastforge), and I post every new build on [LinkedIn](https://www.linkedin.com/in/patel-vrund/). And if agents give a model *hands*, RAG gives it *knowledge* — the deep dive on my WhatsApp chat based Agentic RAG is right below.
