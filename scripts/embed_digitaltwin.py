import os
import json
import requests

# Load environment variables
UPSTASH_URL = os.getenv("UPSTASH_VECTOR_REST_URL")
UPSTASH_TOKEN = os.getenv("UPSTASH_VECTOR_REST_TOKEN")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

JSON_FILE = "Twin.json"

def load_json(path=JSON_FILE):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def chunk_profile(profile):
    chunks = []
    def add_chunk(title, content):
        chunks.append({"title": title, "content": content})
    # Example fields
    pi = profile.get("personal_info", {})
    add_chunk("Personal Info", " ".join(f"{k}: {v}" for k,v in pi.items() if isinstance(v,str)))
    edu = profile.get("education", [])
    for e in edu:
        add_chunk("Education", ", ".join(f"{k}: {v}" for k,v in e.items()))
    skills = profile.get("skills", {})
    if skills:
        add_chunk("Skills", ", ".join(skills.get("core", [])))
    return chunks

def embed_texts(texts):
    url = "https://api.groq.com/openai/v1/embeddings"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    data = {
        "model": "text-embedding-3-small",
        "input": texts
    }
    r = requests.post(url, headers=headers, json=data)
    r.raise_for_status()
    return [d["embedding"] for d in r.json()["data"]]

def upstash_upsert(chunks, embeddings):
    headers = {"Authorization": f"Bearer {UPSTASH_TOKEN}"}
    for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
        body = {
            "id": f"chunk_{i}",
            "vector": emb,
            "metadata": {"title": chunk["title"], "content": chunk["content"]}
        }
        r = requests.post(f"{UPSTASH_URL}/upsert", headers=headers, json=body)
        r.raise_for_status()
        print("Upserted:", chunk["title"])

if __name__ == "__main__":
    profile = load_json()
    chunks = chunk_profile(profile)
    texts = [c["content"] for c in chunks]
    embs = embed_texts(texts)
    upstash_upsert(chunks, embs)
    print("✅ All chunks embedded and upserted to Upstash.")
