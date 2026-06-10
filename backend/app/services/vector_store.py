import chromadb
from chromadb.config import Settings as ChromaSettings
from sentence_transformers import SentenceTransformer
from app.core.config import settings


class VectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self.collection = self.client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
        self.embedder = SentenceTransformer(settings.EMBEDDING_MODEL)

    def add_chunks(self, chunks: list[dict]):
        texts = [c["text"] for c in chunks]
        embeddings = self.embedder.encode(texts).tolist()
        self.collection.add(
            ids=[c["id"] for c in chunks],
            embeddings=embeddings,
            documents=texts,
            metadatas=[c["metadata"] for c in chunks]
        )

    def search(self, query: str, top_k: int = None, filters: dict = None) -> list[dict]:
        k = top_k or settings.TOP_K_RESULTS
        query_embedding = self.embedder.encode([query]).tolist()
        where = filters if filters else None
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=k,
            where=where
        )
        output = []
        for i in range(len(results["documents"][0])):
            output.append({
                "text": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "score": 1 - results["distances"][0][i]
            })
        return output

    def delete_document(self, document_id: str):
        self.collection.delete(where={"document_id": document_id})

    def list_documents(self) -> list[str]:
        results = self.collection.get()
        doc_ids = set()
        for meta in results["metadatas"]:
            doc_ids.add(meta.get("document_id"))
        return list(doc_ids)


vector_store = VectorStore()
