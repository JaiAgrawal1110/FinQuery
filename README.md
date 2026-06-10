# FinQuery 🔍

> AI-powered financial research assistant — chat with annual reports, earnings calls & filings using RAG, semantic search and cited answers.

[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## What is FinQuery?

FinQuery is a production-grade **Retrieval-Augmented Generation (RAG)** system for financial document analysis. Upload SEC filings, annual reports, and earnings transcripts — then ask questions in plain English and get cited answers instantly.

## Features

- 📄 **PDF Upload & Processing** — Extract and chunk financial documents
- 🔍 **Semantic Search** — Find relevant context using embeddings
- 🤖 **AI Q&A** — Get grounded answers with source citations
- 📊 **Multi-Document Comparison** — Compare companies side-by-side
- 💬 **Conversation Memory** — Follow-up questions with context
- 🏢 **Document Library** — Manage multiple filings

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, Tailwind CSS |
| Backend | FastAPI, Python 3.11 |
| Vector DB | ChromaDB |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| LLM | Groq (Llama3) → OpenAI / Claude (optional) |
| Database | PostgreSQL |
| Deployment | Docker + AWS EC2 |

## Project Roadmap

| Phase | Week | Feature | Status |
|-------|------|---------|--------|
| 1 | 1 | Basic RAG — PDF to Q&A pipeline | 🔄 In Progress |
| 2 | 2 | Citations, metadata filtering, memory | ⏳ Planned |
| 3 | 3 | Multi-document comparison | ⏳ Planned |
| 4 | 4 | Full Next.js UI + Auth | ⏳ Planned |
| 5 | 5 | Docker + AWS deployment | ⏳ Planned |
| 6 | 6 | Hybrid search + reranking | ⏳ Planned |
| 7 | 7 | Evaluation dashboard | ⏳ Planned |

## Quick Start

### 1. Clone & setup
```bash
git clone https://github.com/yourusername/finquery.git
cd finquery/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# Add your GROQ_API_KEY to .env
```

### 3. Test with a single PDF (Phase 1)
```bash
python ../scripts/quickstart_rag.py \
  --pdf path/to/annual_report.pdf \
  --question "What is the total revenue for 2023?"
```

### 4. Run the API
```bash
uvicorn app.main:app --reload
# API docs at http://localhost:8000/docs
```

## Future Scope

- SEC EDGAR Auto-Fetch Integration
- Hybrid Search (BM25 + Vector)
- Reranking Models (Cohere / Cross-encoder)
- Multi-Agent Research Workflow
- Financial Ratio Extraction
- Voice Queries
- Portfolio Analysis Assistant
- RAG Evaluation Dashboard

## License

MIT © 2024 FinQuery
