import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.document_processor import extract_text_from_pdf, chunk_document
from app.services.vector_store import vector_store

router = APIRouter()
UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    document_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_DIR}/{document_id}_{file.filename}"

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    pages = extract_text_from_pdf(file_path)
    chunks = chunk_document(pages, file.filename, document_id)
    vector_store.add_chunks(chunks)

    return {
        "document_id": document_id,
        "filename": file.filename,
        "pages_processed": len(pages),
        "chunks_created": len(chunks)
    }


@router.get("/")
def list_documents():
    return {"document_ids": vector_store.list_documents()}


@router.delete("/{document_id}")
def delete_document(document_id: str):
    vector_store.delete_document(document_id)
    return {"message": f"Document {document_id} deleted"}
