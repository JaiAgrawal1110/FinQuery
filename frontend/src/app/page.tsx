// Phase 4: Full Next.js UI
// For now, use the FastAPI docs at http://localhost:8000/docs

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">FinQuery</h1>
        <p className="text-gray-400 text-lg mb-8">
          AI-powered financial document intelligence
        </p>
        <p className="text-gray-500">
          Frontend coming in Phase 4. 
          API running at{" "}
          <a href="http://localhost:8000/docs" className="text-blue-400 underline">
            localhost:8000/docs
          </a>
        </p>
      </div>
    </main>
  );
}
