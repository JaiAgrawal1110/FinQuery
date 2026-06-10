# FinQuery Architecture

## System Flow

```
User → Next.js Frontend → FastAPI Backend
                              ↓
                    PDF Upload & Processing
                              ↓
                    Text Extraction (pypdf)
                              ↓
                    Chunking (LangChain)
                              ↓
                    Embeddings (sentence-transformers)
                              ↓
                    ChromaDB Vector Store
                              ↓
                    Semantic Search (cosine similarity)
                              ↓
                    Context Building
                              ↓
                    Groq LLM (Llama3)
                              ↓
                    Answer + Citations → User
```

## Phase-by-Phase Design

### Phase 1 — Basic RAG
Single document, Python script, no UI.

### Phase 2 — Better Retrieval
Metadata filtering, conversation memory, improved chunking.

### Phase 3 — Multi-Document
Cross-document search, company comparison.

### Phase 4 — Full Stack
Next.js UI, authentication, document management.

### Phase 5 — Production
Docker, AWS EC2, CI/CD.

### Phase 6 — Advanced RAG
Hybrid search (BM25 + Vector), reranking, query expansion.

### Phase 7 — Evaluation
Faithfulness, answer relevance, retrieval precision metrics.
