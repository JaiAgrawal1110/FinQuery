from fastapi import APIRouter
from pydantic import BaseModel
from app.services.vector_store import vector_store
from app.services.llm_service import answer_question

router = APIRouter()


class QueryRequest(BaseModel):
    question: str
    document_id: str | None = None
    conversation_history: list | None = None


@router.post("/ask")
def ask_question(request: QueryRequest):
    filters = {"document_id": request.document_id} if request.document_id else None
    chunks = vector_store.search(request.question, filters=filters)

    if not chunks:
        return {"answer": "No relevant information found in the uploaded documents.", "sources": []}

    result = answer_question(request.question, chunks, request.conversation_history)
    return result
