# FinQuery 🔍

> AI-powered financial research assistant — chat with SEC filings, annual reports, and earnings transcripts using RAG, semantic search, and cited answers.

[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

> **Imagine** you need to compare Microsoft's and Deloitte's annual reports — 200+ pages combined. Without FinQuery, you're manually scanning and losing context. With FinQuery, you type *"What are the key revenue drivers?"* and get a cited answer in under 4 seconds, pinpointed to the exact filename and page: `📄 microsoft_annual.pdf · p.4`

---

## What's Built

- **PDF ingestion pipeline** — Extract, chunk (1000 tokens, 200 overlap), embed, and store with a persistent document registry that prevents duplicate uploads across restarts
- **Semantic Q&A with citations** — Top-5 cosine similarity retrieval from ChromaDB, answer grounded by Groq (Llama3), citation rendered as filename + page number
- **Multi-document comparison** — Same query runs against each document independently with explicit `doc_id` filtering; LLM synthesises a structured comparison — no cross-document retrieval bleed
- **Conversation memory** — Follow-up questions carry prior context; session cleared via `DELETE /session`
- **Document library** — Upload, list, and delete filings; persistent JSON registry maps filenames to ChromaDB IDs across restarts
- **Dockerized** — Backend containerised and running; full compose (backend + Next.js + PostgreSQL) defined

---

## Key Numbers

| Metric | Value |
|--------|-------|
| End-to-end query latency | 2–4 seconds |
| Groq inference time | ~500ms |
| Factual Q&A accuracy (informal, 10-question test) | ~80% |
| Chunk size / overlap | 1000 tokens / 200 tokens |
| Chunks retrieved per query (k) | 5 |
| REST API endpoints | 7 |

---

## Architecture

```
User Query
    │
    ▼
Next.js Frontend  (React · Tailwind CSS)
    │  POST /ask  or  POST /compare
    ▼
FastAPI Backend  (Python 3.11)
    │
    ├─── PDF Upload Path
    │         └── PyMuPDF extract → chunk (1000t / 200o) → all-MiniLM-L6-v2 embed
    │                  └── ChromaDB (local, persistent to disk)
    │                           └── JSON Registry (filename → doc_id map)
    │
    └─── Query Path
              └── embed query → cosine sim top-5 → filter by doc_id
                       └── context + query → Groq (Llama3)
                                └── cited answer (filename + page) → UI
```

---

## Tech Stack — and Why

| Layer | Choice | Reasoning |
|-------|--------|-----------|
| LLM | Groq · Llama3 | ~500ms inference, free tier, no credit card. 3–5× faster than OpenAI at this scale |
| Vector DB | ChromaDB | Local, persistent to disk, zero API cost. Pinecone makes sense at production scale; ChromaDB is the right call for a self-hosted RAG system |
| Embeddings | all-MiniLM-L6-v2 | Runs locally — no embedding API cost, no per-token billing, fast enough at our document scale |
| Backend | FastAPI | Async I/O fits the embedding + LLM call pattern; auto-generates OpenAPI docs at `/docs` |
| Frontend | Next.js · Tailwind | SSR where needed, fast iteration on UI components |
| Database | PostgreSQL | Document metadata, user sessions, upload history |
| Infra | Docker + AWS EC2 + Nginx | Single-command local dev; Nginx as reverse proxy in front of FastAPI on EC2 |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload PDF, chunk, embed, register to persistent doc registry |
| GET | `/documents` | List all uploaded documents with metadata |
| DELETE | `/document` | Remove document from ChromaDB + registry |
| POST | `/ask` | Query a single document — returns answer + citation |
| POST | `/compare` | Run same query across multiple docs; LLM synthesises comparison |
| DELETE | `/session` | Clear conversation memory |
| GET | `/health` | Service health check |

---

## The Hardest Problem I Solved

**Duplicate document identity across restarts.**

Every PDF upload generated a new UUID, so after a server restart ChromaDB still held the vectors but the application had no way to map a filename back to its document ID. Subsequent queries would either fail silently or retrieve from the wrong document.

**Fix:** built a persistent JSON registry (filename → document ID) that loads on startup. Any re-upload of an existing file returns the existing ID rather than creating a duplicate. The compare endpoint also required an explicit `where={"doc_id": id}` filter per document — without it, ChromaDB's semantic search retrieves the global top-5 chunks and silently ignores whichever document matched less strongly, making the comparison feature meaningless.

---

## Quick Start

```bash
git clone https://github.com/JaiAgrawal1110/FinQuery.git
cd FinQuery/backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Add your GROQ_API_KEY
uvicorn app.main:app --reload   # Docs at http://localhost:8000/docs
```

### Docker

```bash
docker build -t finquery-backend .
docker run -p 8000:8000 --env-file .env finquery-backend
```

---

## What's Next

- **AWS EC2 deployment** — Nginx reverse proxy in front of FastAPI (in progress)
- **Hybrid search** — BM25 + vector retrieval via LangChain EnsembleRetriever; improves recall on keyword-heavy financial queries
- **RAG evaluation** — RAGAS pipeline scoring faithfulness, answer relevance, and context precision on a fixed question set

---

MIT © 2026 Jai Agrawal