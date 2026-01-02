"""
Populate Vector Database from Text File
Easy way to add unlimited hospital knowledge!
"""
import chromadb
from chromadb.utils import embedding_functions
import os

print("="*60)
print("🏥 LOADING HOSPITAL DATA FROM TEXT FILE")
print("="*60)

# Read text file
print("\n📝 Reading hospital_data.txt...")
with open('hospital_data.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Clean and filter lines
sentences = []
for line in lines:
    line = line.strip()
    # Skip empty lines and comments
    if line and not line.startswith('#'):
        sentences.append(line)

print(f"✅ Found {len(sentences)} knowledge sentences")

# Initialize ChromaDB
print("\n🔧 Initializing ChromaDB...")
db_path = os.path.join(os.path.dirname(__file__), "chroma_db")
client = chromadb.PersistentClient(path=db_path)

embedder = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

# Delete old collection
try:
    client.delete_collection("hospital_knowledge")
    print("   (Deleted old collection)")
except:
    pass

# Create new collection
collection = client.create_collection(
    name="hospital_knowledge",
    embedding_function=embedder,
    metadata={"description": "Apollo Hospital knowledge base"}
)

# Add documents
print("\n🚀 Adding documents to vector database...")
ids = [f"doc_{i}" for i in range(len(sentences))]

batch_size = 100
for i in range(0, len(sentences), batch_size):
    batch_sentences = sentences[i:i+batch_size]
    batch_ids = ids[i:i+batch_size]
    collection.add(
        documents=batch_sentences,
        ids=batch_ids
    )
    print(f"   Added batch {i//batch_size + 1} ({len(batch_sentences)} docs)")

print(f"\n✅ Successfully populated {len(sentences)} documents!")
print(f"📍 Database location: {db_path}")

# Test
print("\n" + "="*60)
print("🧪 TESTING")
print("="*60)

test_queries = [
    "Dil ka doctor",
    "Parking charges",
    "COVID test price"
]

for query in test_queries:
    print(f"\n🔍 Query: '{query}'")
    results = collection.query(query_texts=[query], n_results=2)
    print("   Results:")
    for i, doc in enumerate(results['documents'][0], 1):
        print(f"   {i}. {doc}")

print("\n" + "="*60)
print("✅ DONE!")
print("="*60)
