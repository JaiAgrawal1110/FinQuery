"use client";
import { useState, useRef, useEffect } from "react";

interface Source { document: string; page: number; score: number; }
interface Message { role: "user" | "assistant"; content: string; sources?: Source[]; }
interface Document { document_id: string; filename: string; pages: number; }

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

  useEffect(() => { fetchDocuments(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("http://3.25.163.61:8000/api/v1/documents/");
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {}
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    await fetch("http://3.25.163.61:8000/api/v1/documents/upload", { method: "POST", body: formData });
    await fetchDocuments();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const compareKeywords = ["compare", "difference", "both", "versus", "vs", "contrast"];
      const isCompare = compareKeywords.some((k) => question.toLowerCase().includes(k));

      let data;

      if (isCompare && documents.length >= 2) {
        const res = await fetch("http://3.25.163.61:8000/api/v1/query/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            document_ids: documents.map((d) => d.document_id),
          }),
        });
        const raw = await res.json();
        data = { answer: raw.comparison, sources: [] };
      } else {
        const res = await fetch("http://localhost:8000/api/v1/query/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            document_id: selectedDoc,
            session_id: sessionId,
          }),
        });
        data = await res.json();
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error connecting to backend. Make sure the API is running." }]);
    }
    setLoading(false);
  };

  const SUGGESTIONS = ["What is the total revenue?", "Who is the CEO?", "Compare both reports", "Summarize this report"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #020c0a;
          font-family: 'Inter', sans-serif;
          overflow: hidden;
          height: 100vh;
          color: #ffefb3;
        }

        .bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
        .orb { position: absolute; border-radius: 50%; filter: blur(100px); }
        .orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, #013e37 0%, transparent 70%); top: -200px; left: -150px; opacity: 0.7; }
        .orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, #013e37 0%, transparent 70%); bottom: -100px; right: -100px; opacity: 0.5; }
        .orb-3 { width: 300px; height: 300px; background: radial-gradient(circle, #ffefb3 0%, transparent 70%); top: 50%; left: 40%; opacity: 0.03; }

        .layout { display: flex; height: 100vh; position: relative; z-index: 1; }

        .sidebar {
          width: 268px; flex-shrink: 0;
          display: flex; flex-direction: column;
          background: rgba(1, 62, 55, 0.25);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-right: 1px solid rgba(255, 239, 179, 0.07);
        }

        .sidebar-header { padding: 30px 22px 22px; border-bottom: 1px solid rgba(255,239,179,0.06); }

        .logo {
          font-family: 'Syne', sans-serif;
          font-size: 24px; font-weight: 800;
          color: #ffefb3; letter-spacing: -0.5px;
        }
        .logo span {
          color: #013e37; background: #ffefb3;
          padding: 0 5px 1px; border-radius: 4px; margin-left: 1px;
        }
        .logo-sub {
          font-size: 10.5px; color: rgba(255,239,179,0.3);
          letter-spacing: 0.1em; text-transform: uppercase; margin-top: 5px;
        }

        .upload-zone { padding: 14px 16px; border-bottom: 1px solid rgba(255,239,179,0.06); }
        .upload-btn {
          width: 100%; padding: 11px 14px; border-radius: 10px;
          border: 1px dashed rgba(255,239,179,0.2);
          background: rgba(255,239,179,0.04);
          color: rgba(255,239,179,0.7);
          font-size: 13px; font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .upload-btn:hover { background: rgba(255,239,179,0.08); border-color: rgba(255,239,179,0.35); color: #ffefb3; }

        .doc-section { flex: 1; overflow-y: auto; padding: 14px 12px; }
        .doc-section::-webkit-scrollbar { width: 3px; }
        .doc-section::-webkit-scrollbar-thumb { background: rgba(255,239,179,0.1); border-radius: 4px; }

        .doc-label {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,239,179,0.25); padding: 0 8px; margin-bottom: 8px;
        }

        .doc-item {
          padding: 10px; border-radius: 9px;
          cursor: pointer; margin-bottom: 3px;
          border: 1px solid transparent; transition: all 0.18s;
        }
        .doc-item:hover { background: rgba(255,239,179,0.05); border-color: rgba(255,239,179,0.08); }
        .doc-item.active { background: rgba(255,239,179,0.1); border-color: rgba(255,239,179,0.18); }
        .doc-name {
          font-size: 12.5px; font-weight: 500;
          color: rgba(255,239,179,0.85);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .doc-item.active .doc-name { color: #ffefb3; }
        .doc-meta { font-size: 11px; color: rgba(255,239,179,0.25); margin-top: 2px; }

        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

        .top-bar {
          padding: 18px 32px;
          border-bottom: 1px solid rgba(255,239,179,0.05);
          background: rgba(1,62,55,0.12);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: space-between;
        }
        .top-bar-title { font-size: 14px; font-weight: 600; color: rgba(255,239,179,0.9); }
        .top-bar-sub { font-size: 11.5px; color: rgba(255,239,179,0.25); margin-top: 2px; }
        .status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #22c55e; box-shadow: 0 0 8px #22c55e;
        }

        .messages {
          flex: 1; overflow-y: auto;
          padding: 32px 36px;
          display: flex; flex-direction: column; gap: 22px;
        }
        .messages::-webkit-scrollbar { width: 3px; }
        .messages::-webkit-scrollbar-thumb { background: rgba(255,239,179,0.08); border-radius: 4px; }

        .empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          height: 100%; text-align: center; gap: 14px;
        }
        .empty-badge {
          width: 68px; height: 68px; border-radius: 22px;
          background: rgba(1,62,55,0.5);
          border: 1px solid rgba(255,239,179,0.1);
          backdrop-filter: blur(20px);
          display: flex; align-items: center; justify-content: center;
          font-size: 30px;
        }
        .empty-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 800;
          color: #ffefb3; letter-spacing: -0.3px;
        }
        .empty-sub { font-size: 13px; color: rgba(255,239,179,0.3); max-width: 340px; line-height: 1.65; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 6px; }
        .chip {
          padding: 8px 15px; border-radius: 999px;
          border: 1px solid rgba(255,239,179,0.1);
          background: rgba(1,62,55,0.3);
          color: rgba(255,239,179,0.5);
          font-size: 12px; cursor: pointer;
          transition: all 0.2s; font-family: 'Inter', sans-serif;
        }
        .chip:hover { background: rgba(1,62,55,0.6); border-color: rgba(255,239,179,0.22); color: #ffefb3; }

        .msg-row { display: flex; }
        .msg-row.user { justify-content: flex-end; }
        .msg-row.assistant { justify-content: flex-start; }

        .bubble {
          max-width: 640px; padding: 13px 17px;
          font-size: 14px; line-height: 1.72;
          border-radius: 16px;
        }
        .bubble.user {
          background: rgba(255,239,179,0.12);
          border: 1px solid rgba(255,239,179,0.18);
          color: #ffefb3; border-bottom-right-radius: 4px;
        }
        .bubble.assistant {
          background: rgba(1,62,55,0.35);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,239,179,0.07);
          color: rgba(255,239,179,0.88);
          border-bottom-left-radius: 4px;
        }
        .bubble strong { color: #ffefb3; font-weight: 600; }

        .sources { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
        .src-tag {
          font-size: 11px; padding: 3px 10px; border-radius: 999px;
          background: rgba(1,62,55,0.5);
          border: 1px solid rgba(255,239,179,0.1);
          color: rgba(255,239,179,0.4);
        }

        .thinking {
          display: flex; gap: 5px; align-items: center;
          padding: 14px 18px;
          background: rgba(1,62,55,0.35);
          border: 1px solid rgba(255,239,179,0.07);
          border-radius: 16px; border-bottom-left-radius: 4px;
          width: fit-content;
        }
        .dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,239,179,0.35);
          animation: blink 1.4s infinite;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink {
          0%,80%,100% { opacity: 0.25; transform: scale(0.75); }
          40% { opacity: 1; transform: scale(1); }
        }

        .input-area {
          padding: 18px 32px 24px;
          border-top: 1px solid rgba(255,239,179,0.05);
          background: rgba(1,62,55,0.1);
          backdrop-filter: blur(20px);
        }
        .input-row {
          display: flex; gap: 10px; align-items: center;
          background: rgba(1,62,55,0.3);
          border: 1px solid rgba(255,239,179,0.1);
          border-radius: 13px;
          padding: 5px 5px 5px 18px;
          transition: border-color 0.2s;
        }
        .input-row:focus-within { border-color: rgba(255,239,179,0.25); background: rgba(1,62,55,0.4); }
        .chat-input {
          flex: 1; background: transparent; border: none; outline: none;
          font-size: 14px; color: #ffefb3;
          font-family: 'Inter', sans-serif; padding: 9px 0;
        }
        .chat-input::placeholder { color: rgba(255,239,179,0.2); }
        .send-btn {
          padding: 10px 22px; border-radius: 9px;
          background: #ffefb3; border: none;
          color: #013e37; font-size: 13px; font-weight: 700;
          font-family: 'Inter', sans-serif;
          cursor: pointer; transition: all 0.2s;
        }
        .send-btn:hover { background: #fff9d6; transform: translateY(-1px); }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }
        .input-hint { font-size: 11px; color: rgba(255,239,179,0.15); text-align: center; margin-top: 10px; }
      `}</style>

      <div className="bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo">Fin<span>Query</span></div>
            <div className="logo-sub">Financial AI Research</div>
          </div>

          <div className="upload-zone">
            <button className="upload-btn" onClick={() => fileRef.current?.click()}>
              {uploading ? "⏳ Uploading..." : "＋ Upload PDF"}
            </button>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={uploadFile} />
          </div>

          <div className="doc-section">
            <div className="doc-label">Documents</div>
            <div
              className={`doc-item ${selectedDoc === null ? "active" : ""}`}
              onClick={() => setSelectedDoc(null)}
            >
              <div className="doc-name">📚 All Documents</div>
              <div className="doc-meta">{documents.length} file{documents.length !== 1 ? "s" : ""}</div>
            </div>
            {documents.map((doc) => (
              <div
                key={doc.document_id}
                className={`doc-item ${selectedDoc === doc.document_id ? "active" : ""}`}
                onClick={() => setSelectedDoc(doc.document_id)}
              >
                <div className="doc-name">📄 {doc.filename}</div>
                <div className="doc-meta">{doc.pages} pages</div>
              </div>
            ))}
          </div>
        </aside>

        <main className="main">
          <div className="top-bar">
            <div>
              <div className="top-bar-title">
                {selectedDoc ? documents.find((d) => d.document_id === selectedDoc)?.filename : "All Documents"}
              </div>
              <div className="top-bar-sub">Ask anything · Type "compare" to compare all docs</div>
            </div>
            <div className="status-dot" />
          </div>

          <div className="messages">
            {messages.length === 0 ? (
              <div className="empty">
                <div className="empty-badge">⚡</div>
                <div className="empty-title">Ask FinQuery anything</div>
                <div className="empty-sub">
                  Upload financial reports and get instant cited answers. Type "compare" to compare multiple companies.
                </div>
                <div className="chips">
                  {SUGGESTIONS.map((s) => (
                    <div key={s} className="chip" onClick={() => setInput(s)}>{s}</div>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`msg-row ${msg.role}`}>
                  <div>
                    <div
                      className={`bubble ${msg.role}`}
                      dangerouslySetInnerHTML={{
                        __html: msg.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br/>')
                      }}
                    />
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="sources">
                        {msg.sources.map((s, j) => (
                          <span key={j} className="src-tag">📄 {s.document} · p.{s.page}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="msg-row assistant">
                <div className="thinking">
                  <div className="dot" /><div className="dot" /><div className="dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="input-area">
            <div className="input-row">
              <input
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about revenue, risks, leadership... or type 'compare'"
              />
              <button className="send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
                Send →
              </button>
            </div>
            <div className="input-hint">Press Enter to send · Select a document to filter · "compare" triggers multi-doc mode</div>
          </div>
        </main>
      </div>
    </>
  );
}