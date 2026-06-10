"""
FinQuery - Phase 1 Quickstart
Test RAG on a single PDF before setting up the full API.

Usage:
    cd backend
    python ../scripts/quickstart_rag.py --pdf path/to/report.pdf --question "What is the revenue?"
"""

import argparse
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/backend")

from app.services.document_processor import extract_text_from_pdf, chunk_document
from app.services.vector_store import VectorStore
from app.services.llm_service import answer_question
import uuid


def main():
    parser = argparse.ArgumentParser(description="FinQuery Quickstart RAG")
    parser.add_argument("--pdf", required=True, help="Path to PDF file")
    parser.add_argument("--question", required=True, help="Question to ask")
    args = parser.parse_args()

    print(f"\n📄 Processing: {args.pdf}")
    document_id = str(uuid.uuid4())
    pages = extract_text_from_pdf(args.pdf)
    print(f"✅ Extracted {len(pages)} pages")

    chunks = chunk_document(pages, os.path.basename(args.pdf), document_id)
    print(f"✅ Created {len(chunks)} chunks")

    store = VectorStore()
    store.add_chunks(chunks)
    print(f"✅ Stored in ChromaDB")

    print(f"\n🔍 Searching for: {args.question}")
    results = store.search(args.question)
    result = answer_question(args.question, results)

    print(f"\n{'='*60}")
    print(f"ANSWER:\n{result['answer']}")
    print(f"\nSOURCES:")
    for s in result["sources"]:
        print(f"  - {s['document']}, Page {s['page']} (score: {s['score']})")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
