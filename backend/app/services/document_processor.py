import os
import uuid
from pathlib import Path
import pypdf
from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.core.config import settings


def extract_text_from_pdf(file_path: str) -> list[dict]:
    """Extract text from PDF with page metadata."""
    pages = []
    with open(file_path, "rb") as f:
        reader = pypdf.PdfReader(f)
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            if text.strip():
                pages.append({
                    "page_number": page_num + 1,
                    "text": text,
                    "total_pages": len(reader.pages)
                })
    return pages


def chunk_document(pages: list[dict], document_name: str, document_id: str) -> list[dict]:
    """Split pages into overlapping chunks with metadata."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", ".", " "]
    )
    chunks = []
    for page in pages:
        splits = splitter.split_text(page["text"])
        for i, split in enumerate(splits):
            chunks.append({
                "id": str(uuid.uuid4()),
                "text": split,
                "metadata": {
                    "document_id": document_id,
                    "document_name": document_name,
                    "page_number": page["page_number"],
                    "chunk_index": i,
                    "total_pages": page["total_pages"]
                }
            })
    return chunks
