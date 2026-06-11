from fastapi import APIRouter
from pydantic import BaseModel
from app.services.vector_store import vector_store
from app.services.llm_service import answer_question

router = APIRouter()

# In-memory session store (Phase 4 will move this to DB)
conversation_sessions: dict = {}


class QueryRequest(BaseModel):
    question: str
    document_id: str | None = None
    session_id: str | None = None


@router.post("/ask")
def ask_question(request: QueryRequest):
    # Load conversation history for this session
    history = []
    if request.session_id and request.session_id in conversation_sessions:
        history = conversation_sessions[request.session_id]

    # Search relevant chunks
    filters = {"document_id": request.document_id} if request.document_id else None
    chunks = vector_store.search(request.question, filters=filters)

    if not chunks:
        return {"answer": "No relevant information found.", "sources": [], "session_id": request.session_id}

    # Get answer
    result = answer_question(request.question, chunks, history.copy())

    # Save updated history
    if request.session_id:
        if request.session_id not in conversation_sessions:
            conversation_sessions[request.session_id] = []
        conversation_sessions[request.session_id].append(
            {"role": "user", "content": request.question}
        )
        conversation_sessions[request.session_id].append(
            {"role": "assistant", "content": result["answer"]}
        )

    return {
        "answer": result["answer"],
        "sources": result["sources"],
        "tokens_used": result["tokens_used"],
        "session_id": request.session_id
    }


@router.delete("/session/{session_id}")
def clear_session(session_id: str):
    if session_id in conversation_sessions:
        del conversation_sessions[session_id]
    return {"message": f"Session {session_id} cleared"}