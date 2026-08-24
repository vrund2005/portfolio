---
title: Vector Databases — A Deep Dive
subtitle: Why embeddings need their own database — ANN indexes like HNSW and IVF, hybrid search, reranking, quantization, and how to pick between pgvector, Pinecone, Qdrant, Weaviate and Milvus.
date: 2026-08-24
tags: ["Vector", "Embeddings", "RAG", "Retrieval", "HNSW", "pgvector", "LangChain", "LangGraph"]
art: vector
accent: sky
# project: 
---

> A practical reference for understanding vector databases, vector search, ANN indexes, retrieval architectures, RAG, LangChain/LangGraph integration, and choosing the right vector database.

---

## 1. What Is a Vector Database?

A **vector database** is a database optimized for storing, indexing, and searching high-dimensional vectors.

A vector is a numerical representation of some data:

```text
Text / Image / Audio
        ↓
   Embedding Model
        ↓
      Vector
```

Example:

```text
"Insulin is commonly used to control blood glucose."

                ↓

[0.12, -0.42, 0.91, 0.07, ...]
```

The vector database stores these vectors and allows you to find vectors that are most similar to a query vector.

The core operation is:

```text
Query Vector
      ↓
Vector Database
      ↓
Nearest / Most Similar Vectors
      ↓
Top-K Results
```

---

## 2. What Problem Does It Solve?

Traditional databases are excellent at exact and structured queries:

```sql
SELECT *
FROM documents
WHERE department = 'cardiology';
```

But semantic queries are different.

Suppose your database contains:

```text
"Insulin is commonly used to control blood glucose."
```

and the user asks:

```text
"How do I control high blood sugar?"
```

The words are different, but the meanings are related.

An embedding model converts both into vectors:

```text
Document
   ↓
Embedding
   ↓
Vector A

Query
   ↓
Embedding
   ↓
Vector B
```

If Vector A and Vector B are close in vector space, the database can retrieve the document.

Therefore:

> **A vector database allows retrieval based on semantic similarity instead of only exact keyword matching.**

---

## 3. Embedding Model vs Vector Database

This is one of the most important distinctions.

### Embedding Model

An embedding model converts data into vectors.

Examples:

- OpenAI embedding models
- Cohere embedding models
- BGE
- E5
- Nomic
- Jina embeddings
- Voyage embeddings

```text
Raw Data
   ↓
Embedding Model
   ↓
Vector
```

### Vector Database

The vector database stores and searches the vectors.

```text
Vector
   ↓
Vector Database
   ↓
Similarity Search
   ↓
Relevant Results
```

### Mental Model

> **Embedding model = converts meaning into numbers.**

> **Vector database = stores, indexes, filters, and retrieves those numbers efficiently.**

The vector database does not create semantic meaning by itself. The embedding model determines how the semantic information is represented.

---

## 4. What Does a Vector Database Store?

A typical record can conceptually look like:

```json
{
  "id": "doc_123_chunk_4",

  "vector": [
    0.12,
    -0.82,
    0.44
  ],

  "text": "Insulin is commonly used to control blood glucose.",

  "metadata": {
    "document_id": "doc_123",
    "department": "endocrinology",
    "year": 2025,
    "document_type": "guideline"
  }
}
```

A vector database generally stores:

### 4.1 Vector

The embedding:

```text
[0.12, -0.82, 0.44, ...]
```

### 4.2 Metadata

Structured information:

```text
department = cardiology
year = 2025
document_type = guideline
tenant_id = customer_123
language = en
```

### 4.3 Payload / Original Data

Information used to identify or reconstruct the source:

```text
document_id
chunk_id
text
source_url
page_number
timestamp
image_path
tenant_id
```

---

## 5. Why Not Just Use NumPy?

For a small dataset, you can perform similarity search yourself:

```python
query_vector = [...]
database_vectors = [...]

# Compare query against every stored vector
```

For:

```text
1,000 vectors
```

this is easy.

But consider:

```text
100,000,000 vectors
×
1536 dimensions
```

Comparing against every vector becomes expensive.

A production vector database provides infrastructure such as:

- indexing
- approximate nearest-neighbor search
- persistence
- metadata filtering
- updates
- deletes
- replication
- sharding
- distributed execution
- APIs
- access control
- multi-tenancy
- monitoring
- quantization

The key benefit is not simply "storing vectors."

It is:

> **Efficiently retrieving relevant vectors at scale.**

---

## 6. Similarity Search

The central operation of a vector database is nearest-neighbor search.

Example:

```text
User Query
    ↓
Embedding Model
    ↓
Query Vector
    ↓
Vector Database
    ↓
Similarity Search
    ↓
Top-K Documents
```

Suppose:

```text
Query:
"What PPE should a surgeon wear?"
```

The vector database may return:

```text
1. Surgical PPE requirements
2. Operating-room protective equipment
3. Surgeon infection-control guidelines
4. Medical masks and respirators
5. Surgical gloves
```

The database determines relevance using a distance/similarity metric.

---

## 7. Exact Nearest Neighbor vs ANN

There are two major approaches.

### 7.1 Exact Nearest Neighbor Search

Compare the query with every stored vector.

```text
Query
 ↓
Compare with Vector 1
Compare with Vector 2
Compare with Vector 3
...
Compare with Vector N
 ↓
Select closest vectors
```

#### Advantage

- Exact result
- Maximum possible recall

#### Disadvantage

- Expensive at large scale

This is also called:

**Brute-force / exact search**

---

## 8. Approximate Nearest Neighbor (ANN)

ANN avoids comparing against every vector.

Instead, the database builds an index that helps it quickly find likely neighbors.

```text
Query
  ↓
ANN Index
  ↓
Likely Candidate Vectors
  ↓
Similarity Calculation
  ↓
Top-K
```

The result is usually:

```text
Much faster
     +
Slight approximation
```

The engineering trade-off is:

```text
Speed
  ↕
Recall / Accuracy
```

This is one of the most important concepts in vector databases.

---

## 9. Important ANN Indexes

### 9.1 HNSW

**HNSW = Hierarchical Navigable Small World**

HNSW represents vectors as a graph.

Conceptually:

```text
                  A
                 / \
                B   C
               /     \
              D       E
             / \       \
            F   G       H
```

Instead of checking every vector, the search navigates through the graph toward increasingly similar vectors.

#### HNSW strengths

- Excellent search performance
- Strong recall
- Popular in modern vector databases
- Good general-purpose ANN algorithm

#### HNSW trade-offs

- Higher memory usage
- Index construction can be expensive
- Updates can be more expensive than simple brute-force approaches

---

### 9.2 IVF

**IVF = Inverted File Index**

The idea is to cluster vectors.

Example:

```text
1,000,000 vectors

        ↓

    Clustering

 ┌────┬────┬────┬────┐
 C1   C2   C3   C4
```

If the query appears to belong to C3, the database searches C3 and possibly nearby clusters instead of all vectors.

```text
Query
 ↓
Find relevant clusters
 ↓
Search only candidate clusters
 ↓
Top-K
```

#### IVF strengths

- Lower search cost
- Can use less memory than HNSW in some configurations
- Useful for large datasets

#### Trade-offs

- Requires tuning
- Approximation can reduce recall
- Index training/building is important

---

## 10. Similarity / Distance Metrics

The vector database needs a way to determine how close two vectors are.

The common metrics are:

### 10.1 Cosine Similarity

Measures the angle between vectors.

```text
        A
       /
      / θ
     /
    B
```

If the angle is small, the vectors are considered more similar.

Common for text embeddings.

---

### 10.2 Euclidean / L2 Distance

Measures physical distance:

```text
A ●────────────● B
```

Smaller distance means greater similarity.

---

### 10.3 Dot Product / Inner Product

Computes the dot product between vectors.

Often useful with normalized embeddings.

---

#### Metric Selection

You should understand the embedding model's assumptions before selecting the metric.

Typical relationship:

```text
Embedding Model
      ↓
Vector Properties
      ↓
Similarity Metric
      ↓
Vector Index
```

Do not blindly select cosine similarity for every possible model.

---

## 11. What a Vector Database Actually Provides

A modern vector database may provide much more than:

```text
vector → nearest vector
```

Important capabilities include:

```text
Vector storage
Vector indexing
ANN search
Metadata filtering
Dense search
Sparse search
Hybrid search
Multiple vectors
Multimodal vectors
Reranking integration
Quantization
Persistence
Replication
Sharding
Multi-tenancy
Access control
APIs
Monitoring
```

This is why vector databases are better thought of as **retrieval infrastructure**.

---

## 12. Metadata Filtering

Metadata filtering is extremely important in production RAG.

Imagine your database contains:

```text
Cardiology
Neurology
Oncology
Pediatrics
```

A user asks:

```text
"What are the latest hypertension guidelines?"
```

Instead of searching everything:

```text
Vector similarity
```

you can combine:

```text
Vector similarity
+
department = cardiology
+
year >= 2024
```

Conceptually:

```python
search(
    vector=query_vector,
    filter={
        "department": "cardiology",
        "year": {"$gte": 2024}
    }
)
```

This allows semantic retrieval within a constrained subset.

---

### Why Metadata Filtering Matters

Metadata can represent:

```text
tenant
department
user
permissions
date
document type
language
source
region
product
version
```

For example, in a multi-tenant SaaS application:

```text
Customer A
    ↓
tenant_id = A

Customer B
    ↓
tenant_id = B
```

Customer A's retrieval should never return Customer B's documents.

Therefore:

```text
Semantic Search
+
Access / Tenant Filter
```

is often required.

---

## 13. Dense vs Sparse Vectors

There are two important retrieval representations.

### 13.1 Dense Vectors

Example:

```text
[0.14, -0.82, 0.31, 0.92, ...]
```

Dense embeddings represent semantic information.

They are excellent for:

```text
meaning
context
semantic similarity
paraphrases
conceptual relationships
```

Example:

```text
Query:
"How do I control blood sugar?"

Document:
"Insulin therapy can help regulate blood glucose."
```

Dense semantic retrieval can identify their relationship.

---

### 13.2 Sparse Vectors

Sparse vectors contain mostly zero values.

Conceptually:

```text
[0, 0, 0, 0, 0.8, 0, 0, 1.2, 0, ...]
```

They are closely related to lexical/token-based matching.

They are useful for:

```text
exact terminology
product IDs
drug names
SKUs
error codes
rare technical terms
```

---

## 14. Hybrid Search

Dense and sparse retrieval have different strengths.

Therefore, production retrieval often combines them.

```text
                    Query
                      │
             ┌────────┴────────┐
             ↓                 ↓
        Dense Search       Sparse Search
             ↓                 ↓
        Semantic Match     Keyword Match
             │                 │
             └────────┬────────┘
                      ↓
                   Fusion
                      ↓
                  Candidates
                      ↓
                   Reranker
                      ↓
                   Top-K
```

Example:

```text
Query:
"Side effects of metformin XR 500mg"
```

Dense search understands:

```text
metformin
diabetes
blood glucose
medication
```

Sparse search is useful for exact terms:

```text
metformin
XR
500mg
```

Combining both can improve retrieval quality.

---

## 15. Reranking

Vector retrieval is often only the first retrieval stage.

A production system may do:

```text
100,000 documents
       ↓
Vector / Hybrid Search
       ↓
100 candidates
       ↓
Reranker
       ↓
10 highly relevant documents
       ↓
LLM
```

Why?

Because embedding similarity is not always the perfect ranking function.

A reranker can inspect:

```text
Query
+
Candidate Document
```

and produce a more accurate relevance score.

This creates a common two-stage retrieval architecture:

### Stage 1 — Retrieval

Fast and broad.

```text
1,000,000 documents
        ↓
Top 100
```

### Stage 2 — Reranking

Slower but more precise.

```text
100 candidates
      ↓
Top 10
```

---

## 16. Vector Database vs Traditional Database

| Feature | Traditional DB | Vector DB |
|---|---|---|
| Structured data | Excellent | Good |
| SQL | Excellent | Usually limited |
| Transactions | Excellent | Varies |
| Exact lookup | Excellent | Good |
| Semantic search | Not core | Core |
| Vector search | Usually not native | Core |
| ANN indexes | Limited / extension | Core |
| Metadata filtering | Excellent | Good–Excellent |
| Hybrid retrieval | Possible | Often supported |
| Large vector workloads | Depends | Designed for it |
| AI retrieval features | Limited | Strong |

However, PostgreSQL + pgvector changes this comparison because PostgreSQL can directly support vector search.

---

## 17. Major Vector Database Families

Vector databases can be grouped into several families.

### Family 1 — Managed Dedicated Vector Databases

Examples:

- Pinecone

Main advantage:

```text
You manage the application.
The provider manages the infrastructure.
```

---

### Family 2 — Open-Source AI-Native Vector Databases

Examples:

- Qdrant
- Weaviate
- Milvus

Useful when you want:

- self-hosting
- infrastructure control
- AI-specific retrieval features
- flexible deployment

---

### Family 3 — Relational Database + Vector Extension

Example:

- PostgreSQL + pgvector

Useful when:

```text
You already use PostgreSQL
+
you need vector search
```

---

### Family 4 — Search Engines with Vector Search

Examples:

- Elasticsearch
- OpenSearch

Useful when you need:

```text
keyword search
+
BM25
+
filters
+
facets
+
aggregations
+
vector search
```

---

### Family 5 — Embedded / Local Vector Databases

Examples include:

- Chroma
- LanceDB
- Qdrant Edge

Useful for:

- prototypes
- local development
- offline applications
- desktop applications
- smaller workloads

---

## 18. Pinecone

Pinecone is a managed vector database.

Conceptually:

```text
Your Application
      ↓
     API
      ↓
Pinecone Cloud
      ↓
Vector Storage
+
Indexing
+
Retrieval
```

### Pinecone — strong use cases

- Production RAG
- AI SaaS
- Agent memory
- Semantic search
- Large-scale retrieval
- Teams that do not want to manage vector infrastructure

### Strengths

- Managed infrastructure
- Easy deployment
- Scaling handled by provider
- Metadata filtering
- Namespaces / tenant isolation concepts
- Dense and sparse retrieval capabilities
- Hybrid retrieval
- AI-oriented ecosystem

### Trade-off

You depend on an external managed service and have less infrastructure control than a self-hosted solution.

---

## 19. Qdrant

Qdrant is an open-source, AI-native vector database.

Important capabilities include:

```text
Dense vectors
Sparse vectors
Metadata filtering
Hybrid search
Named / multiple vectors
Multivectors
Quantization
Multitenancy
Self-hosting
```

### Qdrant — strong use cases

- RAG
- Semantic search
- Agent memory
- Multimodal retrieval
- Advanced retrieval pipelines
- Self-hosted AI systems

### Why Qdrant is valuable to learn

Qdrant exposes many important modern vector-search concepts without requiring you to operate a massive distributed system from day one.

For learning vector databases deeply, Qdrant is an excellent choice.

---

## 20. Weaviate

Weaviate is another AI-focused vector database.

It supports:

```text
Vector search
Hybrid search
Filtering
Semantic retrieval
AI application functionality
```

### Weaviate — strong use cases

- Enterprise search
- RAG
- Semantic search
- Hybrid search
- AI applications

Weaviate is attractive when you want a feature-rich AI search platform rather than assembling every retrieval component yourself.

---

## 21. Milvus

Milvus is designed for large-scale vector retrieval.

Think:

```text
Millions
Tens of millions
Hundreds of millions
Billions of vectors
```

Milvus supports concepts such as:

```text
Vector fields
Scalar fields
Filtering
Multiple vector fields
Hybrid retrieval
Partitioning
Reranking
Full-text retrieval
```

### Milvus — strong use cases

- Very large vector datasets
- Industrial AI systems
- High-volume retrieval
- Multimodal systems
- Distributed vector search

Milvus becomes particularly interesting when the scale and distributed architecture become major concerns.

---

## 22. PostgreSQL + pgvector

This is one of the most important real-world options.

Suppose your application already uses PostgreSQL:

```text
PostgreSQL
├── users
├── products
├── orders
├── permissions
├── documents
└── embeddings
```

With pgvector, you can add vector search directly.

You can combine:

```text
SQL
+
metadata filtering
+
vector similarity
```

### Strong use case

```text
Existing PostgreSQL application
+
Moderate vector workload
+
Strong relational data requirements
```

### Why this can be excellent

Instead of:

```text
PostgreSQL
+
Separate Vector DB
+
Synchronization
```

you may use:

```text
PostgreSQL + pgvector
```

and keep relational and vector data together.

### Important capabilities

Depending on version/configuration, pgvector supports:

- exact vector search
- HNSW
- IVFFlat
- cosine distance
- L2 distance
- inner product
- vector filtering through PostgreSQL
- additional vector data types / compression options

---

## 23. Elasticsearch / OpenSearch

Elasticsearch and OpenSearch are primarily search engines, but they also support vector search.

Their major strength is combining:

```text
Keyword Search
+
BM25
+
Vector Search
+
Filters
+
Facets
+
Aggregations
```

This is extremely useful for search-heavy applications.

Example:

```text
"red running shoes under ₹5000"
```

You may want:

```text
Semantic similarity
+
Keyword matching
+
Price filter
+
Brand filter
+
Category filter
+
Facets
```

A full search engine can be a better fit than a pure vector database.

---

## 24. Embedded / Local Vector Databases

Embedded/local systems are useful for:

```text
Local development
Prototypes
Offline AI
Desktop applications
Small RAG systems
Local experimentation
```

Examples:

- Chroma
- LanceDB
- Qdrant Edge

They are useful when you do not need a large distributed vector-search cluster.

---

## 25. How to Choose a Vector Database

Do not start with:

> "Which vector database is the fastest?"

Start with:

> **"What retrieval problem am I solving?"**

Ask:

```text
1. How many vectors will I store?
2. What query rate do I need?
3. What latency do I need?
4. Do I need metadata filtering?
5. Do I need hybrid search?
6. Do I need sparse vectors?
7. Do I need multiple vectors per object?
8. Do I need multimodal retrieval?
9. Do I need reranking?
10. Do I need multi-tenancy?
11. Do I need self-hosting?
12. Do I already use PostgreSQL?
13. Do I need strong SQL / transactions?
14. Do I need distributed scaling?
15. Do I need full-text search?
16. What is my budget?
17. What operational complexity can my team handle?
```

---

## 26. Quick Database Selection Guide

### Choose pgvector when

```text
Already using PostgreSQL
+
Moderate vector scale
+
Need relational queries
+
Want operational simplicity
```

Example:

```text
SaaS application
10M documents
RAG
Users
Permissions
Orders
Relational data
```

---

### Choose Pinecone when

```text
Want managed infrastructure
+
Want to focus on AI application development
```

Example:

```text
Production AI SaaS
RAG
Agent memory
Multiple tenants
Fast deployment
```

---

### Choose Qdrant when

```text
Want an AI-native vector database
+
Self-hosting flexibility
+
Advanced retrieval features
```

Especially useful for:

```text
RAG
Hybrid Search
Sparse + Dense
Multivectors
Multimodal retrieval
Agent memory
```

---

### Choose Weaviate when

```text
Want a feature-rich AI search platform
+
Vector + hybrid retrieval
```

---

### Choose Milvus when

```text
Very large vector workload
+
Distributed vector retrieval
+
High-scale infrastructure
```

---

### Choose Elasticsearch / OpenSearch when

```text
Search engine requirements
+
Vector search
```

Especially:

```text
Keyword search
+
semantic search
+
filters
+
facets
+
aggregations
```

---

### Choose embedded/local DB when

```text
Prototype
Local development
Offline application
Small deployment
```

---

## 27. Vector Databases in RAG

A standard RAG pipeline looks like:

```text
                 INGESTION

PDF
 ↓
Document Loader
 ↓
Text Splitter
 ↓
Chunks
 ↓
Embedding Model
 ↓
Vector Database
```

At query time:

```text
User Question
      ↓
Embedding Model
      ↓
Query Vector
      ↓
Vector Database
      ↓
Similarity Search
      ↓
Metadata Filtering
      ↓
Top-K Chunks
      ↓
Optional Reranker
      ↓
Context
      ↓
LLM
      ↓
Answer
```

---

## 28. Vector Databases in LangChain

Since you already know LangChain, think of the vector database as the **retriever's storage and search backend**.

Conceptually:

```text
LangChain
    ↓
Retriever
    ↓
Vector Store
    ↓
Vector Database
```

A typical flow:

```text
Documents
   ↓
Text Splitter
   ↓
Embeddings
   ↓
Vector Store
   ↓
Vector Database
```

Then:

```text
Question
   ↓
Retriever
   ↓
Vector Database
   ↓
Relevant Documents
   ↓
LLM
```

LangChain handles orchestration and abstractions; the underlying vector database performs the actual storage and retrieval.

---

## 29. Vector Databases in LangGraph

LangGraph makes the architecture more interesting because retrieval can become an agent capability.

Example:

```text
                  User
                   ↓
               Supervisor
              /     |      \
             /      |       \
            ↓       ↓        ↓
        SQL Agent  RAG    Web Search
                    |
                    ↓
               Vector DB
                    |
                    ↓
                 Reranker
                    |
                    ↓
                   LLM
```

The graph can decide:

```text
If question is about company policy:
    → Vector DB

If question is about sales numbers:
    → SQL

If question requires current information:
    → Web Search
```

Therefore, the vector database becomes one of the tools available to the agent.

---

## 30. Vector Database as Agent Memory

Vector databases can also be used as long-term semantic memory.

Example:

```text
Conversation
     ↓
Important information
     ↓
Embedding
     ↓
Vector Database
```

Later:

```text
User:
"What did we discuss about my PPE project?"
```

The system:

```text
Question
   ↓
Embedding
   ↓
Vector Search
   ↓
Relevant memories
   ↓
LLM
   ↓
Answer
```

This enables semantic memory retrieval.

### Important distinction

Not every piece of conversation should necessarily be stored as vector memory.

Production systems often distinguish:

```text
Short-term state
      +
Long-term semantic memory
      +
Structured database state
```

Use the right storage mechanism for each type of information.

---

## 31. Multimodal Vector Databases

Vector databases are not limited to text.

### Image Retrieval

```text
Image
  ↓
Vision Encoder
  ↓
Image Embedding
  ↓
Vector DB
```

Then:

```text
Query Image
    ↓
Embedding
    ↓
Vector Search
    ↓
Similar Images
```

Useful for:

- visual search
- defect detection
- PPE similarity
- product search
- medical image retrieval
- face/person similarity systems

---

### Audio Retrieval

```text
Audio
 ↓
Audio Encoder
 ↓
Embedding
 ↓
Vector DB
```

Then retrieve semantically or acoustically similar audio.

---

### Video Retrieval

A video can be represented using:

```text
Frame embeddings
+
Audio embeddings
+
Text/transcript embeddings
```

These can be indexed for retrieval.

---

## 32. Multiple Vectors Per Object

A single document does not always have to be represented by exactly one vector.

For example:

```text
Document
├── Text embedding
├── Image embedding
└── Other representation
```

Or a document can contain multiple token-level vectors.

This becomes useful in advanced retrieval systems such as multivector / late-interaction retrieval architectures.

Conceptually:

```text
Document
   ↓
Vector 1
Vector 2
Vector 3
...
Vector N
```

The retrieval algorithm can then compare the query representation against multiple representations of the document.

This is more advanced than basic:

```text
1 document → 1 embedding
```

---

## 33. Vector Database vs Vector Index

Do not confuse these concepts.

A **vector database** is the overall storage and retrieval system.

Inside it may exist one or more vector indexes.

Conceptually:

```text
Vector Database
│
├── Storage
├── Metadata
├── Filtering
├── API
├── Replication
├── Sharding
├── Authentication
├── Persistence
│
└── Vector Index
      ├── HNSW
      ├── IVF
      ├── PQ
      └── Other algorithms
```

Therefore:

> HNSW is not a vector database.

> IVF is not a vector database.

They are indexing techniques.

---

## 34. Quantization

Large vector databases can consume a lot of memory.

Suppose:

```text
1 billion vectors
×
1536 dimensions
×
4 bytes per FP32 value
```

The raw vector memory requirement becomes enormous.

Quantization reduces the representation size.

Conceptually:

```text
FP32
 ↓
FP16
 ↓
INT8
 ↓
Binary / lower precision
```

The benefit:

```text
Lower memory
+
Potentially faster search
+
Lower storage cost
```

The trade-off:

```text
Some loss in numerical precision
```

The acceptable trade-off depends on the application.

---

## 35. Production-Grade Retrieval Architecture

A simple RAG architecture is:

```text
Documents
   ↓
Embedding
   ↓
Vector DB
   ↓
LLM
```

A more mature architecture may look like:

```text
                    DOCUMENTS
                        │
                        ↓
                     Chunking
                        │
                        ↓
                 Embedding Model
                        │
                        ↓
                Vector Database
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
       Dense          Sparse       Metadata
       Search         Search        Filter
          │             │             │
          └─────────────┼─────────────┘
                        ↓
                    Fusion
                        ↓
                  Top 50 Candidates
                        ↓
                    Reranker
                        ↓
                     Top 5
                        ↓
                       LLM
                        ↓
                     Answer
```

This is much closer to production-grade retrieval.

---

## 36. Common Vector Database Features

When comparing vector databases, look for these capabilities.

### Core vector functionality

- Dense vector storage
- Similarity search
- Exact search
- ANN search
- HNSW
- IVF or other indexes
- Cosine similarity
- Dot product
- L2 distance

### Retrieval functionality

- Metadata filtering
- Sparse vectors
- Hybrid search
- Multiple vectors
- Multivectors
- Reranking integration
- Full-text search

### Infrastructure

- Persistence
- Replication
- Sharding
- Horizontal scaling
- Backup / restore
- Monitoring

### Application features

- Multi-tenancy
- Access control
- Namespaces / collections
- APIs
- SDKs
- Cloud deployment
- Self-hosting

---

## 37. Scaling Concepts

When vector databases become large, several concepts matter.

### 37.1 Sharding

Split data across machines.

```text
100M vectors

      ↓

Shard 1 → 25M
Shard 2 → 25M
Shard 3 → 25M
Shard 4 → 25M
```

Queries can be distributed across shards.

---

### 37.2 Replication

Maintain copies of data:

```text
Primary
  ├── Replica 1
  └── Replica 2
```

Benefits:

- availability
- fault tolerance
- read scaling

---

### 37.3 Partitioning

Split data logically.

Example:

```text
2024 documents
2025 documents
2026 documents
```

or:

```text
Tenant A
Tenant B
Tenant C
```

Partitioning can reduce the search space and improve organization.

---

### 37.4 Multi-Tenancy

A SaaS application may have:

```text
Tenant A
Tenant B
Tenant C
...
```

The vector database needs a safe way to isolate their data.

Possible mechanisms include:

- namespaces
- collections
- partitions
- tenant metadata filters
- separate indexes

The exact mechanism depends on the database.

---

## 38. Recommended Learning Path

Because you already understand LangChain and LangGraph, learn vector databases in this order:

```text
1. Embeddings
       ↓
2. Vector dimensions
       ↓
3. Cosine similarity
       ↓
4. Dot product
       ↓
5. L2 distance
       ↓
6. Exact nearest-neighbor search
       ↓
7. ANN
       ↓
8. HNSW
       ↓
9. IVF
       ↓
10. Quantization
       ↓
11. Metadata filtering
       ↓
12. Sparse vectors
       ↓
13. Hybrid search
       ↓
14. Reranking
       ↓
15. Multivectors
       ↓
16. Sharding
       ↓
17. Replication
       ↓
18. Multi-tenancy
       ↓
19. Vector DB selection
```

Then study three databases deeply:

```text
Qdrant
pgvector
Milvus
```

And understand these at an architectural level:

```text
Pinecone
Weaviate
Elasticsearch
OpenSearch
```

This gives you much more transferable knowledge than memorizing the APIs of ten different databases.

---

## 39. Practical Recommendations

### Best for learning modern vector retrieval

### Qdrant

Why:

```text
Dense vectors
+
Sparse vectors
+
Metadata filtering
+
Hybrid search
+
Multivectors
+
Quantization
+
Self-hosting
```

It exposes many important concepts used in modern retrieval systems.

---

### Best to understand vector search inside a relational DB

### PostgreSQL + pgvector

Learn:

```text
SQL
+
relational data
+
metadata filtering
+
vector search
+
HNSW
+
IVF
```

This is particularly valuable for real application architecture.

---

### Best to understand managed vector infrastructure

### Pinecone

Learn:

```text
Managed vector infrastructure
+
Namespaces
+
Metadata filtering
+
Scalable retrieval
+
Hybrid retrieval
+
AI application architecture
```

---

### Best to understand very large-scale vector infrastructure

### Milvus

Learn:

```text
Distributed vector search
+
Large-scale datasets
+
Multiple vector fields
+
Partitions
+
Hybrid retrieval
```

---

## 40. Final Mental Model

The entire vector database ecosystem can be reduced to:

```text
                    RAW DATA
                        │
                        ↓
                 Embedding Model
                        │
                        ↓
                      VECTOR
                        │
                        ↓
              ┌─────────────────────┐
              │   VECTOR DATABASE   │
              │                     │
              │ Storage             │
              │ Vector Index        │
              │ ANN Search          │
              │ Metadata            │
              │ Filtering           │
              │ Dense Search        │
              │ Sparse Search       │
              │ Hybrid Search       │
              │ Multiple Vectors    │
              │ Quantization        │
              │ Scaling             │
              └──────────┬──────────┘
                         │
                         ↓
                  Relevant Context
                         │
                         ↓
                       Reranker
                         │
                         ↓
                        LLM
                         │
                         ↓
                      Answer
```

---

## 41. Quick Cheat Sheet

### What is a vector database?

A system optimized for storing and searching high-dimensional vectors.

### Why do we need it?

To efficiently find semantically similar data.

### What creates vectors?

Embedding models.

### What searches vectors?

Vector databases / vector indexes.

### What is ANN?

Approximate Nearest Neighbor search.

It trades a small amount of exactness for much faster retrieval.

### What is HNSW?

A graph-based ANN index.

### What is IVF?

A cluster-based ANN index.

### What is cosine similarity?

A measure based on the angle between vectors.

### What are dense vectors?

Continuous embeddings representing semantic information.

### What are sparse vectors?

Mostly-zero representations useful for lexical/exact matching.

### What is hybrid search?

Dense semantic retrieval + sparse/keyword retrieval.

### What is reranking?

A second-stage model that improves ranking of retrieved candidates.

### What is metadata filtering?

Restricting retrieval using structured conditions.

Example:

```text
department = cardiology
AND
year >= 2024
```

### What is quantization?

Reducing vector precision/storage size to improve memory and performance.

### Is HNSW a vector database?

No.

It is a vector indexing algorithm.

### Is pgvector a vector database?

It is a PostgreSQL extension that adds vector search capabilities to PostgreSQL.

### Do I always need a dedicated vector DB?

No.

If you already use PostgreSQL and your workload fits, pgvector may be enough.

### Which database should I learn first?

Qdrant is a strong choice for learning modern vector retrieval.

---

## 42. One-Sentence Selection Guide

```text
PostgreSQL already?
    → pgvector

Managed service?
    → Pinecone

Open-source AI-native retrieval?
    → Qdrant / Weaviate

Very large-scale vector infrastructure?
    → Milvus

Search engine + vector search?
    → Elasticsearch / OpenSearch

Local / embedded?
    → Chroma / LanceDB / Qdrant Edge
```

---

## 43. The Most Important Engineering Mindset

Do not ask:

> "Which vector database is the best?"

Ask:

> **"What retrieval problem am I solving?"**

Then evaluate:

```text
Retrieval Problem
       ↓
Dense / Sparse / Hybrid?
       ↓
Metadata Requirements
       ↓
Dataset Size
       ↓
QPS
       ↓
Latency Requirement
       ↓
Recall Requirement
       ↓
Multi-tenancy
       ↓
Deployment Model
       ↓
Operational Requirements
       ↓
Budget
       ↓
Vector Database
```

This is the professional way to select a vector database.

---

## 44. Summary

A vector database is one component of a larger AI retrieval system.

The complete mental model is:

```text
                    DATA
                     │
                     ↓
               Chunk / Process
                     │
                     ↓
              Embedding Model
                     │
                     ↓
                   Vector
                     │
                     ↓
              Vector Database
                     │
             ┌───────┴────────┐
             ↓                ↓
        Vector Search     Metadata Filter
             │                │
             └───────┬────────┘
                     ↓
                Candidates
                     ↓
                  Reranker
                     ↓
                Best Context
                     ↓
                    LLM
                     ↓
                  Answer
```

The database choice depends on the retrieval and infrastructure requirements.

The core technologies worth understanding deeply are:

```text
Embeddings
Similarity Metrics
Exact Search
ANN
HNSW
IVF
Quantization
Metadata Filtering
Sparse Retrieval
Hybrid Search
Reranking
Multivectors
Sharding
Replication
Multi-tenancy
```

Once these concepts are clear, learning individual products becomes much easier because most vector databases are different implementations and productizations of the same fundamental retrieval problems.
