const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function askQuestion(question: string, documentId?: string, history?: any[]) {
  const res = await fetch(`${API_BASE}/query/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      document_id: documentId,
      conversation_history: history,
    }),
  });
  return res.json();
}

export async function listDocuments() {
  const res = await fetch(`${API_BASE}/documents/`);
  return res.json();
}
