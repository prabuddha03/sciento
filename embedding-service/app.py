from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv
import json
import re
from io import BytesIO

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)


print("Loading BERT model...")
model_name = os.getenv("BERT_MODEL_NAME", "all-MiniLM-L6-v2")  
model = SentenceTransformer(model_name)
print(f"BERT model '{model_name}' loaded successfully")

@app.route('/api/embeddings', methods=['POST'])
def generate_embeddings():
    """
    Generate BERT embeddings for the given text fields.
    
    Expected request JSON:
    {
        "problemStatement": "Text of problem statement",
        "proposedSolution": "Text of proposed solution",
        "description": "Text of description",
        "domain": "Text of domain"
    }
    
    Returns:
    {
        "embeddings": {
            "problemStatement": [...],
            "proposedSolution": [...],
            "description": [...],
            "domain": [...]
        }
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Fields to generate embeddings for
        fields = ['problemStatement', 'proposedSolution', 'description', 'domain']
        
        # Validate required fields
        missing_fields = [field for field in fields if field not in data or not data[field]]
        if missing_fields:
            return jsonify({
                "error": "Missing required fields",
                "missing_fields": missing_fields
            }), 400
        
        # Generate embeddings for each field
        embeddings = {}
        for field in fields:
            # Generate embedding for the field
            field_embedding = model.encode(data[field])
            # Convert to Python list for JSON serialization
            embeddings[field] = field_embedding.tolist()
        
        return jsonify({"embeddings": embeddings})
    
    except Exception as e:
        print(f"Error generating embeddings: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/paper/embeddings', methods=['POST'])
def generate_paper_embeddings():
    """
    Generate BERT embeddings for abstract and conclusion sections of a scientific paper.
    
    Expected request JSON:
    {
        "abstract": "Text of the abstract",
        "conclusion": "Text of the conclusion"
    }
    
    Returns:
    {
        "embeddings": {
            "abstract": [...],
            "conclusion": [...]
        }
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Fields to generate embeddings for
        fields = ['abstract', 'conclusion']
        
        # Validate at least one field is present
        if not any(field in data and data[field] for field in fields):
            return jsonify({
                "error": "At least one of abstract or conclusion must be provided",
            }), 400
        
        # Generate embeddings for each provided field
        embeddings = {}
        for field in fields:
            if field in data and data[field]:
                # Generate embedding for the field
                field_embedding = model.encode(data[field])
                # Convert to Python list for JSON serialization
                embeddings[field] = field_embedding.tolist()
        
        return jsonify({"embeddings": embeddings})
    
    except Exception as e:
        print(f"Error generating paper embeddings: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/paper/similarity', methods=['POST'])
def calculate_paper_similarity():
    """
    Calculate similarity between a paper (abstract/conclusion) and existing paper embeddings.
    
    Expected request JSON:
    {
        "embeddings": {
            "abstract": [...],  # Optional
            "conclusion": [...]  # Optional
        },
        "top_k": 5  # Optional, default is 5
    }
    
    Returns:
    {
        "uniquenessScore": 85,
        "similarPapers": [
            {
                "paperId": "123",
                "title": "Paper title",
                "similarity": 0.78,
                "url": "https://example.com/paper"
            },
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        if not data or 'embeddings' not in data:
            return jsonify({"error": "No embeddings provided"}), 400
        
        embeddings = data['embeddings']
        top_k = data.get('top_k', 5)
        
        # Mock implementation - in production, this would query a vector database
        # For now, we'll return a mocked result with a random uniqueness score
        uniqueness_score = np.random.randint(70, 100)
        
        # In production, we would search for similar papers in the database and return them
        mock_similar_papers = [
            {
                "paperId": f"paper{i}",
                "title": f"Paper Title {i}",
                "similarity": round(np.random.uniform(0.5, 0.9), 2),
                "url": f"https://example.com/paper{i}"
            }
            for i in range(1, top_k + 1)
        ]
        
        # Sort by similarity (descending)
        mock_similar_papers.sort(key=lambda x: x["similarity"], reverse=True)
        
        # Calculate uniqueness score based on top matches (in production)
        # uniqueness_score = 100 - (average similarity of top 3 papers) * 100
        
        return jsonify({
            "uniquenessScore": uniqueness_score,
            "similarPapers": mock_similar_papers
        })
    
    except Exception as e:
        print(f"Error calculating paper similarity: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the service is running."""
    return jsonify({"status": "healthy", "model": model_name})

if __name__ == '__main__':
    # Use EMBEDDING_PORT instead of PORT to avoid conflicts with the system environment
    port = int(os.getenv("EMBEDDING_PORT", 5000))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    print(f"Starting embedding service on port {port}, debug mode: {debug}")
    app.run(host='0.0.0.0', port=port, debug=debug) 