from groq import Groq
from app.core.config import settings
from app.core.prompts import FINANCIAL_QA_PROMPT

client = Groq(api_key=settings.GROQ_API_KEY)


def build_context(chunks: list[dict]) -> str:
    context_parts = []
    for chunk in chunks:
        meta = chunk["metadata"]
        context_parts.append(
            f"[Source: {meta['document_name']}, Page {meta['page_number']}]\n{chunk['text']}"
        )
    return "\n\n---\n\n".join(context_parts)


def answer_question(question: str, chunks: list[dict], conversation_history: list = None) -> dict:
    context = build_context(chunks)
    prompt = FINANCIAL_QA_PROMPT.format(context=context, question=question)
    messages = conversation_history or []
    messages.append({"role": "user", "content": prompt})

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=messages,
        temperature=0.1,
        max_tokens=1024
    )

    answer = response.choices[0].message.content
    sources = [
        {
            "document": c["metadata"]["document_name"],
            "page": c["metadata"]["page_number"],
            "score": round(c["score"], 3)
        }
        for c in chunks
    ]
    return {"answer": answer, "sources": sources, "tokens_used": response.usage.total_tokens}
