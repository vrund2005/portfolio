---
title: LLM Inference — From Prompt to Next Token
subtitle: What actually happens between hitting enter and reading a reply — tokenization, prefill, causal attention, the KV cache, logits, and why the first token is always the slowest.
date: 2026-08-18
tags: ["LLM", "Transformers", "Attention", "KV Cache", "Inference", "Tokenization", "MoE"]
art: pipeline
accent: amber
# project: 
---

> A practical AI-engineer-oriented guide covering the concepts discussed in this conversation: parameters vs active parameters, MoE, tokenization, embeddings, Transformer processing, causal self-attention, prefill vs decode, KV cache, logits, softmax, autoregressive generation, error propagation, and decoding.

---

## 1. The Core Mental Model

The most important idea is:

> **An autoregressive LLM repeatedly computes a probability distribution over the next token, conditioned on the tokens already in the context.**

Mathematically:

\[
**P(xₜ | x₁, …, xₜ₋₁)**
\]

The model selects a token from that distribution, appends it to the context, and repeats.

So generation is approximately:

```text
Current context
      ↓
Transformer
      ↓
Logits
      ↓
Softmax / decoding
      ↓
Next token
      ↓
Append token
      ↓
New context
      ↓
Repeat
```

The model does **not** generate the entire answer in one forward pass.

---

## 2. What Does "2B Total Parameters, 90M Active Parameters" Mean?

This terminology usually refers to a **Mixture-of-Experts (MoE)** model.

If a company says:

```text
2B total parameters
90M active parameters
```

it generally means:

- **2B total parameters**: approximately 2 billion learned weights exist in the model.
- **90M active parameters**: approximately 90 million parameters participate in the computation for a particular token/forward pass.

The remaining parameters are present in the model but are not necessarily used for that token.

### Dense model

A dense Transformer uses essentially the same large computational pathway for every token:

```text
Token
  ↓
Transformer
  ↓
Most/all model weights participate
```

For a simplified dense model:

```text
2B total
≈
2B active
```

### MoE model

An MoE model contains multiple expert networks and a router:

```text
                    ┌── Expert 1 ──┐
                    │              │
Token ──► Router ───┼── Expert 2 ──┼──► Output
                    │              │
                    ├── Expert 3 ──┤
                    │              │
                    ├── ... ───────┤
                    │              │
                    └── Expert N ──┘
```

The router chooses a subset of experts, often using a **Top-K** routing mechanism.

For example:

```text
64 experts
Top-K = 2
```

A token might be routed to:

```text
Expert 17
Expert 42
```

instead of all 64.

Therefore, the model can have:

```text
Large total parameter capacity
+
Small active compute per token
```

This is called **conditional computation**.

---

## 3. Total Parameters vs Active Parameters

These are not the same thing as memory usage and compute.

Suppose:

```text
2B total parameters
90M active parameters
```

The model still contains roughly 2B parameters.

If weights are FP16:

\[
2B × 2 bytes ≈ 4 GB
\]

So the model can require memory closer to the **total parameter count**, while computation per token is more closely related to the **active parameter count**.

A useful comparison:

| Property | 2B total / 90M active |
|---|---:|
| Parameters stored | ~2B |
| Parameters participating per token | ~90M |
| Weight memory | Mostly based on ~2B |
| Compute/token | More closely related to active parameters |
| Model capacity | Related to total parameters |
| Routing | Dynamic |

Important: active parameters are not literally the same thing as FLOPs. Actual compute depends on attention, MLP architecture, routing, sequence length, hardware, batching, etc.

---

## 4. MoE Experts Are Usually Part of the FFN/MLP

A Transformer block commonly contains:

```text
Input
  ↓
Attention
  ↓
FFN / MLP
  ↓
Output
```

In an MoE architecture, the FFN can become:

```text
Input
  ↓
Attention
  ↓
Router
  ↓
┌───────────────┐
│ Expert 1      │
│ Expert 2      │
│ ...           │
│ Expert N      │
└───────────────┘
  ↓
Selected experts
  ↓
Output
```

Experts may statistically specialize in different patterns, but it is an oversimplification to assume that one expert is strictly "the medical expert" or "the coding expert."

Routing can differ:

- token to token
- layer to layer
- depending on the model architecture

---

## 5. Tokenization

When a user sends:

```text
Hello, how was your day?
```

the LLM does not directly operate on the raw string.

A tokenizer converts it into tokens.

A simplified example:

```text
"Hello" → token ID 15496
","     → token ID 11
" how"  → token ID 703
" was"  → token ID 574
" your" → token ID 701
" day"  → token ID 1645
"?"     → token ID 30
```

The exact tokens and IDs depend on the tokenizer/model.

So the model receives something conceptually like:

```text
[15496, 11, 703, 574, 701, 1645, 30]
```

Tokens are not necessarily complete words.

A word can be:

- one token
- multiple tokens
- combined with punctuation
- combined with spaces depending on tokenizer design

Therefore, LLMs technically perform **token-level generation**, not word-level generation.

---

## 6. Token IDs Become Embeddings

The token IDs are just indices.

The model has an embedding matrix:

\[
E ∈ R^(V × d)
\]

where:

- \(V\) = vocabulary size
- \(d\) = hidden dimension

For example:

```text
Vocabulary = 50,000 tokens
Hidden dimension = 4096
```

Then:

```text
Token ID
   ↓
Embedding lookup
   ↓
4096-dimensional vector
```

For example:

```text
"Hello"
   ↓
[0.12, -0.43, 0.87, ..., 0.21]
```

For a 7-token input:

\[
X ∈ R^(7 × 4096)
\]

Conceptually:

```text
Hello → [4096 values]
,     → [4096 values]
how   → [4096 values]
was   → [4096 values]
your  → [4096 values]
day   → [4096 values]
?     → [4096 values]
```

---

## 7. Positional Information

Transformers need information about token positions.

For example:

```text
Dog bites man
```

and:

```text
Man bites dog
```

contain similar tokens but have different meanings because the order differs.

Modern LLMs often use **RoPE (Rotary Positional Embeddings)**.

Conceptually:

```text
Token embeddings
       +
Position-dependent transformation
       ↓
Transformer input
```

RoPE is more precisely applied to the attention Query and Key representations rather than simply adding a position vector to the embedding.

---

## 8. The Important Correction: The Model Does NOT Predict the Prompt Token by Token

A common first mental model is:

```text
Hello
 ↓
embedding
 ↓
predict ","
 ↓
embedding of ","
 ↓
predict "how"
 ↓
...
```

That is not how an LLM handles a user prompt during inference.

The user's prompt is already known.

For:

```text
Hello, how was your day?
```

the model receives all of those input tokens during the **prefill** phase.

The model's job is to predict what comes **after** the prompt.

So:

```text
USER PROMPT
Hello, how was your day?
                    ↓
                    ?
                    ↓
          predict first response token
```

---

## 9. Prefill

**Prefill** is the phase where the model processes the existing prompt.

Suppose:

```text
Hello, how was your day?
```

becomes:

```text
[t1, t2, t3, t4, t5, t6, t7]
```

The model processes those tokens through the Transformer.

Conceptually:

```text
Tokens
  ↓
Embeddings + positional information
  ↓
Transformer Layer 1
  ↓
Transformer Layer 2
  ↓
...
Transformer Layer N
```

During this process, the model computes attention Key/Value states and stores them in the **KV cache**.

At the final prompt position, the resulting hidden state is used to predict the first response token.

For example:

```text
Prompt:
Hello, how was your day?

Possible next tokens:

"I"      35%
"I'm"    20%
"Hi"     15%
"Doing"   5%
...
```

The selected token becomes the first generated token.

---

## 10. Causal Self-Attention

Self-attention allows tokens to use information from other tokens in the context.

The basic attention operation is:

\[ 
  Attention (Q,K,V) = softmax ( (QKᵀ) / √dₖ ) V
\]

The model creates:

\[
Q = XW_Q
\]

\[
K = XW_K
\]

\[
V = XW_V
\]

where:

- Q = Query
- K = Key
- V = Value

A useful intuition:

- **Query**: What information am I looking for?
- **Key**: What information do I contain?
- **Value**: What information should be retrieved?

---

## 11. Causal Masking

When generating autoregressively, a token cannot see future tokens.

For:

```text
Hello , how was your day ?
```

the attention visibility is conceptually:

```text
             Hello  ,  how  was  your  day  ?
Hello         ✓
,             ✓      ✓
how           ✓      ✓   ✓
was           ✓      ✓   ✓    ✓
your          ✓      ✓   ✓    ✓    ✓
day           ✓      ✓   ✓    ✓    ✓     ✓
?             ✓      ✓   ✓    ✓    ✓     ✓    ✓
```

So when predicting a future token, the model cannot use information from tokens that occur later in the sequence.

This prevents the model from cheating during training.

---

## 12. Transformer Layers

A simplified Transformer block looks like:

```text
Input
  │
  ▼
Normalization
  │
  ▼
Self-Attention
  │
  ▼
Residual connection
  │
  ▼
Normalization
  │
  ▼
FFN / MLP / MoE
  │
  ▼
Residual connection
  │
  ▼
Output
```

A modern architecture can include:

- RMSNorm
- RoPE
- Multi-Head Attention
- Grouped Query Attention
- SwiGLU
- MoE
- residual connections

The exact architecture differs between models.

---

## 13. Multi-Head Attention

Transformers use multiple attention heads.

Conceptually:

```text
                    Input
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       Head 1       Head 2      Head 3
          │           │           │
       Q K V        Q K V       Q K V
          │           │           │
          └───────────┼───────────┘
                      ▼
                  Concatenate
                      │
                      ▼
                    W_O
```

Different heads can learn different relationships and patterns.

Do not assume that each head has one fixed human-interpretable purpose.

---

## 14. FFN / MLP

After attention, the representation typically passes through an MLP/FFN.

A simplified FFN:

```text
x
 ↓
Linear
 ↓
Activation
 ↓
Linear
 ↓
output
```

Llama-style architectures commonly use a gated MLP such as SwiGLU.

The FFN/MLP contains a large portion of the model's learned parameters.

In an MoE model, this area can be replaced or augmented by multiple experts.

---

## 15. Final Hidden State

After passing through all Transformer layers, we have contextual hidden states.

For a 7-token prompt:

\[
H = [h₁, h₂, …, h₇]
\]

where each:

\[
hᵢ ∈ R⁴⁰⁹⁶
\]

for a model with hidden size 4096.

The final position is particularly important for predicting the next token:

```text
Hello , how was your day ?
                           ↑
                           │
                     final hidden state
```

This hidden state represents the model's learned transformation of the available context.

It is not a human-readable sentence or explicit database record.

---

## 16. What Is a Logit?

A **logit is the raw score produced by the model for a possible next token before converting the scores into probabilities.**

Suppose the vocabulary has 50,000 tokens.

The LM head converts the final hidden state into approximately 50,000 numbers:

```text
Token       Logit
-------------------
"I"          8.2
"I'm"        7.5
"Hi"         6.1
"Doing"      4.8
"My"         3.2
"The"        2.7
"Hope"       1.9
"Great"      1.2
...
```

These are **not probabilities**.

They can be:

- positive
- negative
- large
- small

The important point is their relative values.

A higher logit means the model currently gives that token a stronger score.

---

## 17. Logits → Probabilities

The logits are converted to probabilities using softmax:

\[
**Pᵢ = eᶻⁱ / Σⱼ eᶻʲ**
\]

where \(ᶻⁱ\) is the logit for token \(i\).

For example:

```text
Token       Probability
-------------------------
"I"           48%
"I'm"         23%
"Hi"          11%
"Doing"        4%
"My"           2%
"The"          1%
...
```

The probabilities sum to 1.

So the final stage is:

```text
Final hidden state
       ↓
LM Head
       ↓
Logits
       ↓
Softmax
       ↓
Probability distribution
       ↓
Decoding
       ↓
Next token
```

---

## 18. LM Head

The language-model head is commonly a linear projection from hidden dimension to vocabulary dimension.

Simplified:

\[
logits = hW_{LM}
\]

For:

```text
hidden size = 4096
vocabulary = 50,000
```

the projection is conceptually:

\[
4096 -> 50000
\]

So one hidden state produces one score for every vocabulary token.

---

## 19. The First Generated Token

Suppose the prompt is:

```text
Hello, how was your day?
```

The model processes the entire prompt during prefill.

It then produces:

```text
"I"      → 35%
"I'm"    → 20%
"Hi"     → 15%
"Hope"   → 7%
...
```

Suppose decoding chooses:

```text
"I"
```

The new effective sequence becomes:

```text
Hello, how was your day? I
```

Now the model needs to predict the next token.

---

## 20. Decode Phase

This is where autoregressive generation begins.

Conceptually:

```text
Prompt
  ↓
"I"
  ↓
"am"
  ↓
"doing"
  ↓
"well"
  ↓
...
```

At every step:

\[
**P(xₜ | x₁, …, xₜ₋₁)**
\]

is recalculated for the next token.

For example:

```text
Context:
Hello, how was your day?

→ "I"

Context:
Hello, how was your day? I

→ "am"

Context:
Hello, how was your day? I am

→ "doing"

Context:
Hello, how was your day? I am doing

→ "well"
```

Each generated token changes the context and therefore changes the next probability distribution.

---

## 21. Do We Reprocess the Whole Prompt After Generating "I"?

### Conceptually: Yes.

After generating:

```text
I
```

the model needs to behave as though the context is:

```text
Hello, how was your day? I
```

because the next token depends on all available context.

### Computationally: No.

We do not recompute all previous tokens from scratch.

This is where the **KV cache** is critical.

---

## 22. KV Cache

During prefill, the Transformer computes Key and Value states for the prompt.

Conceptually:

```text
Hello → K1,V1
,     → K2,V2
how   → K3,V3
was   → K4,V4
your  → K5,V5
day   → K6,V6
?     → K7,V7
```

These are stored.

After generating:

```text
I
```

we compute only the new token's states:

```text
I → K8,V8
```

Then the new query \(Q_8\) can attend to:

```text
K1,V1
K2,V2
K3,V3
K4,V4
K5,V5
K6,V6
K7,V7
K8,V8
```

Conceptually:

```text
                 Cached K/V
        ┌──────────────────────────┐
        │ K1,V1                    │
        │ K2,V2                    │
        │ K3,V3                    │
        │ K4,V4                    │
        │ K5,V5                    │
        │ K6,V6                    │
        │ K7,V7                    │
        └───────────┬──────────────┘
                    │
                 New token
                    │
                  Q8,K8,V8
                    │
                    ▼
                Attention
                    │
                    ▼
                 Logits
                    │
                    ▼
                Next token
```

The KV cache therefore does **not directly produce the answer**.

It stores previously computed attention information so that the model can efficiently process the new token.

---

## 23. KV Cache Growth

The cache grows as generation proceeds.

After prompt:

```text
K1 ... K7
V1 ... V7
```

After generating `I`:

```text
K1 ... K8
V1 ... V8
```

After generating `am`:

```text
K1 ... K9
V1 ... V9
```

After generating `doing`:

```text
K1 ... K10
V1 ... V10
```

This is why long contexts can require substantial memory.

---

## 24. Prefill vs Decode

This distinction is extremely important in real LLM serving.

### Prefill

Process the existing prompt:

```text
"Hello, how was your day?"
        ↓
All prompt tokens
        ↓
Transformer
        ↓
KV cache
        ↓
First next-token distribution
```

Prefill is highly parallelizable because the input tokens are already known.

### Decode

Generate one new token at a time:

```text
"I"
 ↓
"am"
 ↓
"doing"
 ↓
"well"
 ↓
...
```

Each newly generated token depends on the previous generated tokens.

Decode is therefore much more sequential.

---

## 25. Why the First Token Often Takes Longer

This connects to the common observation:

> "The first word takes time, then tokens stream very quickly."

The first generated token requires **prefill**:

```text
Entire user prompt
       ↓
Tokenizer
       ↓
Embedding
       ↓
All Transformer layers
       ↓
KV cache construction
       ↓
Logits
       ↓
First token
```

This creates the initial **time to first token (TTFT)**.

After that, decode can reuse the KV cache:

```text
New token
   ↓
Read KV cache
   ↓
Transformer
   ↓
Logits
   ↓
Next token
```

Therefore:

- **TTFT** is strongly influenced by prompt processing/prefill.
- **Inter-token latency / token generation speed** is strongly influenced by decode performance.

---

## 26. Does the Model Predict the User's "How"?

No.

This is a crucial distinction.

If the user sends:

```text
Hello, how was your day?
```

the model already knows:

```text
Hello
how
was
your
day
```

Those are input tokens.

It is not trying to guess:

```text
Hello → how → was → your → day
```

Instead, it is trying to predict:

```text
Hello, how was your day?
                     ↓
               next response token
```

For example:

```text
"I"
```

or:

```text
"Hi"
```

or:

```text
"I'm"
```

depending on the model and decoding.

---

## 27. What Happens During Training?

The autoregressive objective becomes very clear during training.

Given:

```text
Hello, how was your day?
```

the model can be trained with shifted inputs and targets.

Conceptually:

```text
Input token              Target next token
-------------------------------------------
Hello                     ,
Hello ,                   how
Hello , how               was
Hello , how was           your
Hello , how was your      day
Hello , how was your day  ?
```

The causal mask prevents each position from seeing future target tokens.

The model produces logits.

Then cross-entropy loss compares the predicted distribution with the correct next token.

Conceptually:

```text
Prediction
   ↓
Cross-entropy loss
   ↓
Backpropagation
   ↓
Gradients
   ↓
Weight updates
```

This happens over enormous amounts of training data.

---

## 28. Teacher Forcing and Exposure Bias

During training, the model generally sees the correct previous tokens.

Example:

```text
Input:
The capital of France is

Target:
Paris
```

During inference, however, the model feeds its own generated tokens back into the context.

```text
Model output
    ↓
becomes input
    ↓
Model output
    ↓
becomes input
    ↓
...
```

This creates a training/inference difference often discussed as **exposure bias**.

---

## 29. Can an Early Wrong Token Cause the Whole Answer to Be Wrong?

Yes, it can influence everything after it.

If the model generates:

```text
A → X
```

instead of:

```text
A → B
```

then the next probability distribution is conditioned on `X`:

\[
**P(x₃ | A, X)**
\]

rather than:

\[
**P(x₃ | A, B)**
\]

Therefore, an early incorrect token can move generation onto a different trajectory.

However, this does not guarantee the rest of the answer will be wrong.

The model can sometimes:

- correct itself
- encounter strong contextual constraints
- generate a different trajectory that remains valid
- revise a previous statement later
- use reasoning tokens to detect inconsistencies

---

## 30. Why Multiple Correct Answers Exist

A prompt does not usually have exactly one valid token sequence.

For:

```text
Explain why the sky appears blue.
```

valid continuations might begin with:

```text
"The"
"Sunlight"
"Earth's"
"Blue"
"The reason"
```

So generation is better understood as navigating a probability landscape:

```text
                    ┌── Correct trajectory A
                    │
Prompt ─────────────┼── Correct trajectory B
                    │
                    ├── Correct trajectory C
                    │
                    └── Incorrect trajectory
```

The model doesn't need to find one predetermined sentence.

It generates a statistically plausible continuation.

---

## 31. Temperature and Decoding

The model outputs a probability distribution, but we still need a **decoding strategy** to select the next token.

Common approaches include:

- Greedy decoding
- Temperature sampling
- Top-K sampling
- Top-P / nucleus sampling
- Beam search (more common in some other sequence-generation settings)

### Low temperature

Makes the distribution sharper and generation more deterministic.

### Higher temperature

Makes less-probable tokens more likely and can increase diversity.

This can improve creativity but can also increase error probability.

---

## 32. Hallucinations and Self-Reinforcing Errors

Suppose a model incorrectly generates:

```text
John Smith invented X.
```

The next token prediction is now conditioned on that statement.

The model may generate:

```text
John Smith invented X.
He was a scientist...
He developed...
His work...
```

This can create a coherent but false narrative.

The model is not necessarily performing a database lookup that verifies the original claim.

It is generating likely continuations based on its learned representations and current context.

This is one reason hallucinations can be internally coherent.

---

## 33. Is an LLM Just a Database?

Not in the ordinary sense.

For a traditional database:

```text
Question
   ↓
Lookup
   ↓
Record
   ↓
Answer
```

For an LLM:

```text
Context
   ↓
Neural network computation
   ↓
Hidden representation
   ↓
Probability distribution
   ↓
Next token
```

The model's learned information is distributed across its parameters rather than being stored as simple human-readable records.

---

## 34. Complete End-to-End Inference Pipeline

Here is the complete mental model:

```text
                       USER
                        │
                        ▼
              "Hello, how was your day?"
                        │
                        ▼
                    TOKENIZER
                        │
                        ▼
                 TOKEN IDs
                        │
                        ▼
                   EMBEDDINGS
                        │
                        ▼
              POSITION / RoPE
                        │
                        ▼
              ┌──────────────────┐
              │ TRANSFORMER      │
              │                  │
              │ Attention        │
              │      ↓           │
              │ FFN / MoE        │
              │      ↓           │
              │ Residual + Norm  │
              └────────┬─────────┘
                       │
                     repeat
                       │
                       ▼
              FINAL HIDDEN STATE
                       │
                       ▼
                    LM HEAD
                       │
                       ▼
                     LOGITS
                       │
                       ▼
                    SOFTMAX
                       │
                       ▼
             PROBABILITY DISTRIBUTION
                       │
                       ▼
                 DECODING
                       │
                       ▼
                  FIRST TOKEN
                       │
                       ▼
                  UPDATE KV CACHE
                       │
                       ▼
                 NEXT DECODE STEP
                       │
                       ▼
                    LOGITS
                       │
                       ▼
                 NEXT TOKEN
                       │
                       ▼
                     repeat
                       │
                       ▼
                 EOS / STOP
```

---

## 35. The Most Important Five Concepts

If you revisit this document later, remember these five:

## 1. Tokenization

Text becomes token IDs.

```text
Text → Tokens → IDs
```

## 2. Embeddings

Token IDs become vectors.

```text
ID → embedding vector
```

## 3. Transformer

Attention + MLP/FFN transform the token representations using context.

```text
Embeddings → contextual hidden states
```

## 4. Logits

The final hidden state is projected to one raw score for every possible vocabulary token.

```text
Hidden state → logits
```

## 5. Autoregressive decoding

The model converts logits into a distribution, chooses one token, appends it, and repeats.

```text
Context
  ↓
Logits
  ↓
Probability
  ↓
Token
  ↓
New context
  ↓
Repeat
```

---

## 36. One Compact Example

For:

```text
User:
Hello, how was your day?
```

the actual high-level process is:

```text
1. Tokenize
   ↓
   [Hello, ,, how, was, your, day, ?]

2. Embedding
   ↓
   7 vectors

3. Prefill
   ↓
   Transformer processes the prompt

4. Build KV cache
   ↓
   K/V for all prompt tokens

5. Final prompt hidden state
   ↓

6. LM head
   ↓

7. Logits
   ↓
   ["I": 8.2, "Hi": 6.1, ...]

8. Softmax
   ↓
   ["I": 48%, "Hi": 11%, ...]

9. Decode
   ↓
   "I"

10. Add "I" to context
    ↓
    Compute new token using new Q/K/V
    + cached K/V

11. New logits
    ↓

12. Choose "am"

13. Repeat
    ↓
    "doing"
    ↓
    "well"
    ↓
    ...

14. Stop when an EOS/stop condition is reached.
```

---

## 37. Final AI-Engineer Mental Model

The cleanest way to think about an LLM is:

> **A Transformer is a neural network that maps a sequence of tokens into contextual hidden representations. A language-model head maps the relevant hidden representation into logits over the vocabulary. A decoding algorithm converts those logits into the next token. That token becomes part of the context, and the process repeats.**

The performance architecture then adds:

```text
                LLM Inference
                     │
          ┌──────────┴──────────┐
          │                     │
       PREFILL                 DECODE
          │                     │
   Process prompt        Generate tokens
   in parallel           sequentially
          │                     │
          └──────────┬──────────┘
                     │
                 KV CACHE
                     │
                     ▼
               Faster decode
```

And for MoE models:

```text
Each token
    ↓
Transformer layer
    ↓
MoE router
    ↓
Selected experts
    ↓
Only a subset of expert parameters are active
```

These concepts together explain most of the basic mechanics behind modern LLM inference systems.
