"""
Vector Search Service - Flask API
Provides semantic search over hospital knowledge base
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import chromadb
from chromadb.utils import embedding_functions
import os
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for NestJS backend

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize ChromaDB
logger.info("🔧 Initializing Vector Search Service...")
db_path = os.path.join(os.path.dirname(__file__), "chroma_db")

try:
    client = chromadb.PersistentClient(path=db_path)
    embedder = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    collection = client.get_collection(
        name="hospital_knowledge",
        embedding_function=embedder
    )
    logger.info("✅ Vector database loaded successfully!")
    logger.info(f"   Collection: hospital_knowledge")
    logger.info(f"   Database path: {db_path}")
except Exception as e:
    logger.error(f"❌ Failed to load vector database: {e}")
    logger.error("   Please run: python populate_db.py first!")
    collection = None


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    if collection is None:
        return jsonify({
            "status": "unhealthy",
            "service": "vector-search",
            "error": "Vector database not initialized. Run populate_db.py first."
        }), 500

    return jsonify({
        "status": "healthy",
        "service": "vector-search",
        "database": "ChromaDB",
        "model": "all-MiniLM-L6-v2",
        "collection": "hospital_knowledge"
    })


@app.route('/search', methods=['POST'])
def search():
    """
    Search vector database for relevant hospital information

    Request Body:
    {
        "query": "Heart ka doctor chahiye",
        "n_results": 5  // optional, default 5
    }

    Response:
    {
        "success": true,
        "query": "Heart ka doctor chahiye",
        "results": ["...", "...", "..."],
        "count": 5
    }
    """
    if collection is None:
        return jsonify({
            "success": False,
            "error": "Vector database not initialized"
        }), 500

    try:
        data = request.json

        if not data or 'query' not in data:
            return jsonify({
                "success": False,
                "error": "No query provided"
            }), 400

        query = data.get('query', '')
        n_results = data.get('n_results', 5)

        # Validate inputs
        if not query.strip():
            return jsonify({
                "success": False,
                "error": "Empty query"
            }), 400

        if n_results < 1 or n_results > 20:
            n_results = 5  # Default to 5

        logger.info(f"🔍 Searching for: '{query}' (top {n_results} results)")

        # Perform vector search
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )

        documents = results['documents'][0] if results['documents'] else []

        logger.info(f"   Found {len(documents)} results")

        return jsonify({
            "success": True,
            "query": query,
            "results": documents,
            "count": len(documents)
        })

    except Exception as e:
        logger.error(f"❌ Search error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/search-with-scores', methods=['POST'])
def search_with_scores():
    """
    Search with similarity scores

    Response includes similarity scores for each result
    """
    if collection is None:
        return jsonify({
            "success": False,
            "error": "Vector database not initialized"
        }), 500

    try:
        data = request.json
        query = data.get('query', '')
        n_results = data.get('n_results', 5)

        if not query.strip():
            return jsonify({
                "success": False,
                "error": "Empty query"
            }), 400

        logger.info(f"🔍 Searching with scores: '{query}'")

        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )

        # Format results with scores
        formatted_results = []
        if results['documents'] and results['distances']:
            for doc, distance in zip(results['documents'][0], results['distances'][0]):
                # ChromaDB returns distances (lower is better)
                # Convert to similarity score (higher is better)
                similarity = 1 / (1 + distance)
                formatted_results.append({
                    "text": doc,
                    "similarity": round(similarity, 4),
                    "distance": round(distance, 4)
                })

        return jsonify({
            "success": True,
            "query": query,
            "results": formatted_results,
            "count": len(formatted_results)
        })

    except Exception as e:
        logger.error(f"❌ Search error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/stats', methods=['GET'])
def stats():
    """Get database statistics"""
    if collection is None:
        return jsonify({
            "success": False,
            "error": "Vector database not initialized"
        }), 500

    try:
        count = collection.count()
        return jsonify({
            "success": True,
            "total_documents": count,
            "collection_name": "hospital_knowledge",
            "embedding_model": "all-MiniLM-L6-v2",
            "embedding_dimensions": 384
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/test', methods=['GET'])
def test():
    """Quick test endpoint with sample queries"""
    if collection is None:
        return jsonify({
            "success": False,
            "error": "Vector database not initialized"
        }), 500

    test_queries = [
        "Heart ka doctor chahiye",
        "ICU me bed available hai?",
        "Chest pain ho raha hai",
        "Pharmacy kab khulti hai?"
    ]

    results = {}
    for query in test_queries:
        search_results = collection.query(
            query_texts=[query],
            n_results=2
        )
        results[query] = search_results['documents'][0] if search_results['documents'] else []

    return jsonify({
        "success": True,
        "test_queries": test_queries,
        "results": results
    })


if __name__ == '__main__':
    if collection is None:
        print("\n" + "="*60)
        print("⚠️  WARNING: Vector database not initialized!")
        print("="*60)
        print("\nPlease run first:")
        print("  python populate_db.py")
        print("\nThen start the service:")
        print("  python app.py")
        print("="*60 + "\n")
        exit(1)

    print("\n" + "="*60)
    print("🚀 VECTOR SEARCH SERVICE STARTING")
    print("="*60)
    print(f"   Port: 5003")
    print(f"   Database: {db_path}")
    print(f"   Model: all-MiniLM-L6-v2")
    print(f"   Documents: {collection.count()}")
    print("="*60 + "\n")

    app.run(host='0.0.0.0', port=5003, debug=True)
