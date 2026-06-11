import os
import uuid
import json
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.document_processor import extract_text_from_pdf, chunk_document
from app.services.vector_store import vector_store

router = APIRouter()
UPLOAD_DIR = "./uploads"
REGISTRY_FILE = "./document_registry.json"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def load_registry() -> dict:
    if os.path.exists(REGISTRY_FILE):
        with open(REGISTRY_FILE, "r") as f:
            return json.load(f)
    return {}


def save_registry(registry: dict):
    with open(REGISTRY_FILE, "w") as f:
        json.dump(registry, f, indent=2)


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    # Check if already uploaded
    registry = load_registry()
    for doc_id, meta in registry.items():
        if meta["filename"] == file.filename:
            return {
                "document_id": doc_id,
                "filename": file.filename,
                "pages_processed": meta["pages"],
                "chunks_created": meta["chunks"],
                "status": "already exists"
            }

    document_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_DIR}/{document_id}_{file.filename}"

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    pages = extract_text_from_pdf(file_path)
    chunks = chunk_document(pages, file.filename, document_id)
    vector_store.add_chunks(chunks)

    # Save to registry
    registry[document_id] = {
        "filename": file.filename,
        "pages": len(pages),
        "chunks": len(chunks),
        "file_path": file_path
    }
    save_registry(registry)

    return {
        "document_id": document_id,
        "filename": file.filename,
        "pages_processed": len(pages),
        "chunks_created": len(chunks),
        "status": "uploaded"
    }


@router.get("/")
def list_documents():
    registry = load_registry()
    return {
        "documents": [
            {
                "document_id": doc_id,
                "filename": meta["filename"],
                "pages": meta["pages"],
                "chunks": meta["chunks"]
            }
            for doc_id, meta in registry.items()
        ]
    }


@router.delete("/{document_id}")
def delete_document(document_id: str):
    registry = load_registry()
    if document_id not in registry:
        raise HTTPException(404, "Document not found")
    vector_store.delete_document(document_id)
    del registry[document_id]
    save_registry(registry)
    return {"message": f"Document {document_id} deleted"}