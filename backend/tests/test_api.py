import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_list_documents():
    response = client.get("/api/v1/documents/")
    assert response.status_code == 200
    assert 'documents' in response.json()
