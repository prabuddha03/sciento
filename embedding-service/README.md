# Embedding Service

This is a Flask-based service that generates BERT embeddings for text fields of research ideas. It's used by the main application to calculate similarity between ideas.

## Setup

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

2. Create a `.env` file based on the example below:

```bash
# Configuration for the embedding service
EMBEDDING_PORT=5000  # We use a specific variable name to avoid conflicts with system PORT variable
FLASK_ENV=development
BERT_MODEL_NAME=all-MiniLM-L6-v2  # Small but effective model, change if needed
```

3. Start the service:

```bash
# Method 1: Using the start script (recommended)
# This automatically finds the correct Python version with dependencies
./start.sh

# Method 2: Directly with Python
# Only use this if your Python has all the required dependencies installed
python app.py
```

### Troubleshooting

If you get an error like `ModuleNotFoundError: No module named 'flask'` or other missing modules, it means your Python environment doesn't have the required dependencies installed. This can happen due to multiple Python installations on your system.

The provided `start.sh` script automatically tries to find a Python installation that has the required dependencies. If that doesn't work, you can:

1. Identify which Python version has the dependencies installed:

   ```bash
   pip3 show flask | grep Location
   ```

2. Run the app with that specific Python:

   ```bash
   # Replace X.Y with your Python version (e.g., 3.10)
   /opt/homebrew/bin/pythonX.Y app.py
   # or
   /usr/local/bin/pythonX.Y app.py
   ```

3. Consider setting up a virtual environment to avoid these issues:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

### Port Conflicts

If you see the service running on port 3000 instead of 5000, it's likely because your system has a PORT environment variable set to 3000. The service now uses EMBEDDING_PORT to avoid this conflict.

## API Endpoints

### Generate Embeddings

```
POST /api/embeddings
```

Generate BERT embeddings for the given text fields.

#### Request Body

```json
{
  "problemStatement": "Text of problem statement",
  "proposedSolution": "Text of proposed solution",
  "description": "Text of description",
  "domain": "Text of domain"
}
```

#### Response

```json
{
  "embeddings": {
    "problemStatement": [...],
    "proposedSolution": [...],
    "description": [...],
    "domain": [...]
  }
}
```

### Health Check

```
GET /api/health
```

Check if the service is running properly.

#### Response

```json
{
  "status": "healthy",
  "model": "all-MiniLM-L6-v2"
}
```

## Notes

- The service uses SentenceTransformers with the `all-MiniLM-L6-v2` model by default, which is a good balance between performance and efficiency.
- The embeddings are generated for each field separately to enable field-specific similarity comparisons.
- The service is designed to be used by the main Node.js application, which will send text fields and receive embeddings for similarity calculation.
