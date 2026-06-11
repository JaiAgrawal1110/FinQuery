"use client";
import { useState, useRef, useEffect } from "react";

interface Source {
  document: string;
  page: number;
  score: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface Document {
  document_id: string;
  filename: string;
  pages: number;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sessionId] = useState("session-" + Date.now());
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchDocuments = async () => {
    const res = await fetch("http://localhost:8000/api/v1/documents/");
    const data = await res.json();
    setDocuments(data.documents || []);
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    await fetch("http://localhost:8000/api/v1/documents/upload", {
      method: "POST",
      body: formData,
    });
    await fetchDocuments();
    setUploading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    const res = await fetch("http://localhost:8000/api/v1/query/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        document_id: selectedDoc,
        session_id: sessionId,
      }),
    });
    const data = await res.json();
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.answer, sources: data.sources },
    ]);
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">⚡ FinQuery</h1>
          <p className="text-xs text-gray-400 mt-1">Financial AI Research</p>
        </div>

        <div className="p-4 border-b border-gray-800">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg transition"
          >
            {uploading ? "Uploading..." : "+ Upload PDF"}
          </button>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={uploadFile} />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Documents</p>
          <div
            onClick={() => setSelectedDoc(null)}
            className={`p-3 rounded-lg cursor-pointer mb-2 text-sm transition ${
              selectedDoc === null ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
          >
            📚 All Documents
          </div>
          {documents.map((doc) => (
            <div
              key={doc.document_id}
              onClick={() => setSelectedDoc(doc.document_id)}
              className={`p-3 rounded-lg cursor-pointer mb-2 text-sm transition ${
                selectedDoc === doc.document_id ? "bg-blue-600" : "hover:bg-gray-800"
              }`}
            >
              <p className="font-medium truncate">📄 {doc.filename}</p>
              <p className="text-xs text-gray-400 mt-1">{doc.pages} pages</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-800 p-4 bg-gray-900">
          <h2 className="font-semibold text-gray-200">
            {selectedDoc
              ? documents.find((d) => d.document_id === selectedDoc)?.filename
              : "All Documents"}
          </h2>
          <p className="text-xs text-gray-500">Ask anything about your financial documents</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-4xl mb-4">⚡</p>
              <h3 className="text-xl font-semibold text-gray-300">Welcome to FinQuery</h3>
              <p className="text-gray-500 mt-2 max-w-md">
                Upload financial reports, earnings calls, or SEC filings and ask questions in plain English.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-2xl ${msg.role === "user" ? "order-2" : ""}`}>
                <div
                  className={`rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-100"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.sources.map((s, j) => (
                      <span
                        key={j}
                        className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full"
                      >
                        📄 {s.document} · Page {s.page}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl px-5 py-3 text-sm text-gray-400">
                Thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-4 bg-gray-900">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about your financial documents..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-medium transition"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}