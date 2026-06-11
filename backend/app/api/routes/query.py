from fastapi import APIRouter
from pydantic import BaseModel
from app.services.vector_store import vector_store
from app.services.llm_service import answer_question
from groq import Groq
from app.core.config import settings

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

class CompareRequest(BaseModel):
    question: str
    document_ids: list[str]
    session_id: str | None = None


@router.post("/compare")
def compare_documents(request: CompareRequest):
    if len(request.document_ids) < 2:
        return {"error": "Please provide at least 2 document IDs to compare"}

    individual_answers = {}

    for doc_id in request.document_ids:
        # Force filter by each document individually
        chunks = vector_store.search(
            request.question, 
            top_k=3,
            filters={"document_id": doc_id}
        )
        if chunks:
            doc_name = chunks[0]["metadata"]["document_name"]
            result = answer_question(request.question, chunks)
            individual_answers[doc_name] = result["answer"]
        else:
            individual_answers[doc_id] = "No relevant information found."

    # Build comparison summary
    comparison_prompt = f"Question: {request.question}\n\nAnswers from different companies:\n\n"
    for doc_name, answer in individual_answers.items():
        comparison_prompt += f"**{doc_name}:**\n{answer}\n\n"
        comparison_prompt += """Now provide a SHORT structured comparison. 
                                Max 5 bullet points per category. 
                                Only include what's available in both companies.
                                Be concise - no repetition, no filler text."""

    
    client = Groq(api_key=settings.GROQ_API_KEY)
    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[{"role": "user", "content": comparison_prompt}],
        temperature=0.1,
        max_tokens=1024
    )

    return {
        "comparison": response.choices[0].message.content,
        "individual_answers": individual_answers
    }