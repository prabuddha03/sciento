# Research Paper Generator API

A Node.js Express API that generates research papers using Google's Gemini API, stores them in Cloudinary, and provides a platform for collecting and evaluating research ideas.

## Setup

1. Clone the repository
2. Install dependencies:

```
npm install
```

> **Note:** This project uses lightweight alternatives to heavy dependencies for faster installation.

3. Create a `.env` file in the root directory with:

```
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
MONGODB_URI=mongodb://localhost:27017/research_platform
EMBEDDING_SERVICE_URL=http://localhost:5000/api/embeddings
```

4. Set up the embedding service (required for idea similarity checking):

```
cd embedding-service
pip install -r requirements.txt
cp .env.example .env
```

**Note:** The embedding service uses port 5000 by default. This is configured through the `EMBEDDING_PORT` variable in the `.env` file.

5. Start the services:

For development with auto-restart of both the main API and embedding service:

```
npm run dev:all
```

Or start them separately:

```
# Terminal 1 - Start the main API
npm run dev

# Terminal 2 - Start the embedding service
npm run embedding-service
```

For production:

```
npm start
```

## API Endpoints

### 1. Generate Research Paper

`POST /generate-paper`

Generates a research paper based on the provided data, uploads it to Cloudinary, and returns the download URL.

#### Request

The endpoint accepts `multipart/form-data` or JSON with the following fields:

**Required Fields:**

- `title` (string): The title of the paper
- `authors` (string or array): Author name(s)
- `domain` (string): Research domain/field
- `problemStatement` (string): Statement of the problem
- `proposedSolution` (string): Proposed solution
- `objectives` (string or array): Research objectives
- `methodology` (string): Research methodology
- `outcomes` (string): Expected outcomes
- `format` (string): "IEEE" or "APA"

**Optional Fields:**

- `email` (string): Contact email
- `affiliation` (string): Author affiliation
- `references` (string or array): References
- `pdf` (file): PDF file for additional context

**Query Parameters:**

- `download` (boolean): Set to 'true' to receive the PDF directly as a download rather than a URL

#### Example Request

Using `curl` for JSON (without PDF upload):

```bash
curl -X POST http://localhost:3000/generate-paper \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advances in Natural Language Processing",
    "authors": ["John Doe", "Jane Smith"],
    "email": "john@example.com",
    "affiliation": "University of Technology",
    "domain": "Artificial Intelligence",
    "problemStatement": "Current NLP models struggle with understanding context in complex scenarios.",
    "proposedSolution": "A novel architecture combining transformer models with knowledge graphs.",
    "objectives": ["Improve contextual understanding in complex text", "Reduce hallucinations in generated text"],
    "methodology": "We implement a hybrid model and evaluate on benchmark datasets.",
    "outcomes": "Our approach shows 15% improvement over baseline models.",
    "references": ["Smith et al. (2022). Advances in NLP. Conference on AI."],
    "format": "IEEE"
  }'
```

Using `curl` with multipart/form-data:

```bash
curl -X POST http://localhost:3000/generate-paper \
  -H "Content-Type: multipart/form-data" \
  -F "title=Advances in Natural Language Processing" \
  -F "authors=John Doe, Jane Smith" \
  -F "email=john@example.com" \
  -F "affiliation=University of Technology" \
  -F "domain=Artificial Intelligence" \
  -F "problemStatement=Current NLP models struggle with understanding context in complex scenarios." \
  -F "proposedSolution=A novel architecture combining transformer models with knowledge graphs." \
  -F "objectives=Improve contextual understanding in complex text,Reduce hallucinations in generated text" \
  -F "methodology=We implement a hybrid model and evaluate on benchmark datasets." \
  -F "outcomes=Our approach shows 15% improvement over baseline models." \
  -F "references=Smith et al. (2022). Advances in NLP. Conference on AI." \
  -F "format=IEEE" \
  -F "pdf=@/path/to/additional_info.pdf"
```

For direct download instead of Cloudinary URL:

```bash
curl -X POST http://localhost:3000/generate-paper?download=true \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

#### Response

By default, returns a JSON object with the Cloudinary URL:

```json
{
  "success": true,
  "message": "Research paper generated successfully",
  "paper": {
    "title": "Advances in Natural Language Processing",
    "format": "IEEE",
    "downloadUrl": "https://res.cloudinary.com/your-cloud-name/raw/upload/v1234567890/research_papers/Advances_in_Natural_Language_Processing_1234567890.pdf",
    "createdAt": "2023-11-22T15:30:45Z"
  }
}
```

If `download=true` query parameter is provided, responds with the PDF file as a downloadable attachment.

### 2. Analyze Research Paper

`POST /analyze-paper`

Analyzes an uploaded research paper PDF and provides a synopsis of varying detail along with scores for feasibility, innovation, and scalability, as well as an assessment of bias, edge cases, and ethical risks.

#### Request

The endpoint only accepts `multipart/form-data` with the following field:

**Required Fields:**

- `pdf` (file): The PDF file to analyze

**Query Parameters:**

- `synopsis` (string): Level of detail for the synopsis - "brief", "moderate", or "detailed" (default: "moderate")

#### Example Request

```bash
curl -X POST http://localhost:3000/analyze-paper?synopsis=detailed \
  -F "pdf=@/path/to/research_paper.pdf"
```

#### Response

Returns a JSON object with the analysis:

```json
{
  "success": true,
  "synopsisType": "detailed",
  "analysis": {
    "synopsis": "This research paper explores a novel approach to natural language processing by integrating transformer models with knowledge graphs to enhance contextual understanding. The authors propose a hybrid architecture that leverages semantic relationships from knowledge graphs to provide additional context for transformer models when processing complex text. Their methodology involves pre-training a transformer model on a large corpus, then implementing a knowledge graph integration layer that retrieves relevant semantic relationships during inference. Evaluation on standard NLP benchmarks demonstrates a 15% improvement over baseline models, particularly in scenarios requiring deep contextual understanding. The authors highlight particular success in reducing hallucinations in generated text by grounding language models with factual knowledge from the graph structure. The work contributes both theoretical insights into how structured knowledge can complement statistical learning approaches and practical architectural innovations for implementing such hybrid systems.",
    "scores": {
      "feasibility": {
        "score": 8,
        "justification": "The approach builds on established technologies (transformers and knowledge graphs) with a clear integration methodology and demonstrable results."
      },
      "innovation": {
        "score": 7,
        "justification": "While combining transformers and knowledge graphs isn't entirely novel, their specific architecture and integration approach offers meaningful advantages."
      },
      "scalability": {
        "score": 6,
        "justification": "The knowledge graph component may present challenges for scaling to extremely large domains, though the approach is generally adaptable."
      }
    },
    "risks": {
      "bias": {
        "level": "Medium",
        "description": "The research inherits biases present in both the transformer training data and knowledge graph sources, with limited discussion of bias mitigation strategies."
      },
      "edgeCases": {
        "level": "High",
        "description": "The paper doesn't adequately address performance in low-resource languages or highly specialized domains where knowledge graph coverage may be sparse."
      },
      "ethical": {
        "level": "Low",
        "description": "The technology focuses on improving understanding rather than generation capabilities, limiting potential for misuse."
      }
    },
    "keywords": [
      "Natural Language Processing",
      "Transformer Models",
      "Knowledge Graphs",
      "Contextual Understanding",
      "Hybrid Architecture",
      "Hallucination Reduction",
      "Semantic Integration"
    ]
  }
}
```

### 3. Detect AI-Generated Text

`POST /detect-ai`

Analyzes text to determine the likelihood that it was generated by an AI system such as ChatGPT, Claude, or other large language models.

#### Request

The endpoint accepts either:

**Option 1: JSON with text**

- Content-Type: `application/json`
- Body: JSON object with a `text` field containing the content to analyze

**Option 2: PDF Upload**

- Content-Type: `multipart/form-data`
- Body: Form data with a `pdf` file upload

> Note: For long texts, only the first ~4000 tokens (approximately 16,000 characters) will be analyzed.

#### Example Requests

Using `curl` with text in JSON:

```bash
curl -X POST http://localhost:3000/detect-ai \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The integration of artificial intelligence in healthcare systems presents numerous opportunities and challenges. Recent advancements in machine learning algorithms have enabled more accurate diagnosis of various medical conditions, potentially reducing human error and improving patient outcomes. However, these systems also raise questions about data privacy, algorithmic bias, and the changing role of healthcare professionals. As we continue to develop and deploy AI in medical settings, it is crucial to establish robust ethical frameworks and regulatory guidelines to ensure these technologies benefit all patients equitably."
  }'
```

Using `curl` with a PDF upload:

```bash
curl -X POST http://localhost:3000/detect-ai \
  -F "pdf=@/path/to/document.pdf"
```

#### Response

Returns a JSON object with the AI detection analysis:

```json
{
  "aiScore": 87,
  "confidence": "High",
  "explanation": "The text exhibits several characteristics of AI-generated content including: uniform sentence structure with minimal stylistic variation, absence of personal anecdotes or unique perspectives, generic framing of complex issues, and use of balanced, measured tone throughout without natural emotion or idiosyncrasies found in human writing."
}
```

### 4. Create a Room for Idea Collection

`POST /rooms`

Creates a new room for collecting research ideas. Each room has a unique access code for participants to join.

#### Request

The endpoint accepts JSON with the following fields:

**Required Fields:**

- `name` (string): The name of the room
- `description` (string): A description of the room's purpose
- `topic` (string): The research topic or focus area
- `createdBy` (string): Name of the room creator

#### Example Request

```bash
curl -X POST http://localhost:3000/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Ethics Research Group",
    "description": "A room for collecting and evaluating research ideas related to ethical considerations in AI development.",
    "topic": "AI Ethics",
    "createdBy": "Dr. Jane Smith"
  }'
```

#### Response

Returns a JSON object with the room details and unique access code:

```json
{
  "success": true,
  "message": "Room created successfully",
  "room": {
    "id": "60c72b2f9b1d8a2a4c9e6b3d",
    "name": "AI Ethics Research Group",
    "description": "A room for collecting and evaluating research ideas related to ethical considerations in AI development.",
    "topic": "AI Ethics",
    "accessCode": "K7P9M2",
    "createdBy": "Dr. Jane Smith",
    "createdAt": "2023-11-22T15:30:45Z",
    "expiresAt": "2023-12-22T15:30:45Z"
  }
}
```

### 5. Join a Room by ID or Access Code

`GET /rooms/:identifier`

Retrieves a room by its MongoDB ID or unique access code. Participants can use the access code to join a room.

#### Request

The endpoint accepts a room identifier (either MongoDB ID or access code) as a URL parameter.

#### Example Request

Using MongoDB ID:

```bash
curl -X GET http://localhost:3000/rooms/60c72b2f9b1d8a2a4c9e6b3d
```

Using access code:

```bash
curl -X GET http://localhost:3000/rooms/K7P9M2
```

#### Response

Returns a JSON object with the room details:

```json
{
  "success": true,
  "room": {
    "id": "60c72b2f9b1d8a2a4c9e6b3d",
    "name": "AI Ethics Research Group",
    "description": "A room for collecting and evaluating research ideas related to ethical considerations in AI development.",
    "topic": "AI Ethics",
    "createdBy": "Dr. Jane Smith",
    "createdAt": "2023-11-22T15:30:45Z",
    "expiresAt": "2023-12-22T15:30:45Z"
  }
}
```

### 6. Submit an Idea

`POST /ideas`

Submits a new research idea to a room and analyzes its uniqueness compared to existing ideas using BERT embeddings.

#### Request

The endpoint accepts JSON with the following fields:

**Required Fields:**

- `title` (string): The title of the idea
- `description` (string): A detailed description of the idea
- `domain` (string): The domain or field of the idea
- `problemStatement` (string): Problem the idea addresses
- `proposedSolution` (string): The proposed solution
- `authorName` (string): Name of the idea author
- `roomId` (string): MongoDB ID of the room

**Optional Fields:**

- `authorEmail` (string): Email of the idea author

#### Example Request

```bash
curl -X POST http://localhost:3000/ideas \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bias Detection Framework for NLP Models",
    "description": "A framework to automatically detect and mitigate biases in natural language processing models during training and evaluation phases.",
    "domain": "AI Ethics",
    "problemStatement": "Current NLP models often inherit and amplify societal biases present in training data.",
    "proposedSolution": "A multi-stage bias detection pipeline that analyzes training data, model outputs, and provides mitigation strategies.",
    "authorName": "Alex Johnson",
    "authorEmail": "alex@example.com",
    "roomId": "60c72b2f9b1d8a2a4c9e6b3d"
  }'
```

#### Response

Returns a JSON object with the idea details and uniqueness analysis:

```json
{
  "success": true,
  "message": "Idea submitted successfully",
  "idea": {
    "id": "60c72b2f9b1d8a2a4c9e6b3f",
    "title": "Bias Detection Framework for NLP Models",
    "description": "A framework to automatically detect and mitigate biases in natural language processing models during training and evaluation phases.",
    "domain": "AI Ethics",
    "problemStatement": "Current NLP models often inherit and amplify societal biases present in training data.",
    "proposedSolution": "A multi-stage bias detection pipeline that analyzes training data, model outputs, and provides mitigation strategies.",
    "authorName": "Alex Johnson",
    "createdAt": "2023-11-22T16:45:30Z",
    "roomId": "60c72b2f9b1d8a2a4c9e6b3d",
    "uniquenessScore": 78,
    "fieldUniqueness": {
      "problemStatement": 85,
      "proposedSolution": 70,
      "description": 80,
      "domain": 90
    }
  },
  "uniquenessAnalysis": {
    "uniquenessScore": 78,
    "fieldUniqueness": {
      "problemStatement": 85,
      "proposedSolution": 70,
      "description": 80,
      "domain": 90
    },
    "explanation": "This idea is mostly unique with some similarities to existing ideas.",
    "similarIdeas": [
      {
        "ideaId": "60c72b2f9b1d8a2a4c9e6b3e",
        "similarityScore": 45,
        "fieldSimilarity": {
          "problemStatement": 55,
          "proposedSolution": 40,
          "description": 45,
          "domain": 98
        },
        "explanation": "Similar domain (98% similar) and problemStatement (55% similar) to \"Fairness Metrics for Machine Learning\"."
      }
    ]
  }
}
```

#### Exact Match Rejection

If a new idea has an exact match with an existing idea's problem statement or proposed solution, it will be rejected:

```json
{
  "success": false,
  "error": "Idea rejected",
  "explanation": "This idea is rejected because it has an identical problemStatement to an existing idea."
}
```

### 7. Get Ideas in a Room

`GET /rooms/:roomId/ideas`

Retrieves all ideas submitted to a specific room.

#### Request

The endpoint accepts a room ID as a URL parameter.

#### Example Request

```bash
curl -X GET http://localhost:3000/rooms/60c72b2f9b1d8a2a4c9e6b3d/ideas
```

#### Response

Returns a JSON object with all ideas in the room:

```json
{
  "success": true,
  "count": 2,
  "ideas": [
    {
      "id": "60c72b2f9b1d8a2a4c9e6b3e",
      "title": "Fairness Metrics for Machine Learning",
      "description": "A comprehensive set of metrics to evaluate fairness across different demographic groups in machine learning models.",
      "domain": "AI Ethics",
      "problemStatement": "Existing evaluation metrics don't adequately capture fairness considerations across different demographic groups.",
      "proposedSolution": "A suite of fairness metrics that evaluate disparate impact, equal opportunity, and representation in ML models.",
      "authorName": "Sam Wilson",
      "createdAt": "2023-11-22T15:50:22Z",
      "uniquenessScore": 85
    },
    {
      "id": "60c72b2f9b1d8a2a4c9e6b3f",
      "title": "Bias Detection Framework for NLP Models",
      "description": "A framework to automatically detect and mitigate biases in natural language processing models during training and evaluation phases.",
      "domain": "AI Ethics",
      "problemStatement": "Current NLP models often inherit and amplify societal biases present in training data.",
      "proposedSolution": "A multi-stage bias detection pipeline that analyzes training data, model outputs, and provides mitigation strategies.",
      "authorName": "Alex Johnson",
      "createdAt": "2023-11-22T16:45:30Z",
      "uniquenessScore": 78
    }
  ]
}
```

### 8. Get Similar Ideas

`GET /ideas/:ideaId/similar`

Retrieves ideas similar to a specific idea, showing similarity scores for each field.

#### Request

The endpoint accepts an idea ID as a URL parameter.

#### Example Request

```bash
curl -X GET http://localhost:3000/ideas/60c72b2f9b1d8a2a4c9e6b3f/similar
```

#### Response

Returns a JSON object with the idea and its similar ideas:

```json
{
  "success": true,
  "idea": {
    "id": "60c72b2f9b1d8a2a4c9e6b3f",
    "title": "Bias Detection Framework for NLP Models",
    "uniquenessScore": 78,
    "fieldUniqueness": {
      "problemStatement": 85,
      "proposedSolution": 70,
      "description": 80,
      "domain": 90
    }
  },
  "similarIdeas": [
    {
      "idea": {
        "id": "60c72b2f9b1d8a2a4c9e6b3e",
        "title": "Fairness Metrics for Machine Learning",
        "description": "A comprehensive set of metrics to evaluate fairness across different demographic groups in machine learning models.",
        "domain": "AI Ethics",
        "problemStatement": "Existing evaluation metrics don't adequately capture fairness considerations across different demographic groups.",
        "proposedSolution": "A suite of fairness metrics that evaluate disparate impact, equal opportunity, and representation in ML models.",
        "authorName": "Sam Wilson",
        "createdAt": "2023-11-22T15:50:22Z",
        "uniquenessScore": 85
      },
      "similarityScore": 45,
      "fieldSimilarity": {
        "problemStatement": 55,
        "proposedSolution": 40,
        "description": 45,
        "domain": 98
      },
      "explanation": "Similar domain (98% similar) and problemStatement (55% similar) to this idea."
    }
  ]
}
```

### 8. Check Paper Uniqueness

`POST /papers/check-uniqueness`

Analyzes a research paper PDF to determine its uniqueness by comparing it against a database of 800,000 scientific papers.

#### Request

The endpoint accepts `multipart/form-data` with the following:

**Required Field:**

- `pdf` (file): The research paper PDF file to analyze

**Optional Fields:**

- `title` (string): Paper title
- `authors` (string): Comma-separated list of authors
- `doi` (string): Digital Object Identifier
- `journal` (string): Journal name
- `year` (number): Publication year

#### Example Request

```bash
curl -X POST http://localhost:3000/papers/check-uniqueness \
  -F "pdf=@/path/to/research_paper.pdf" \
  -F "title=Advances in Scientific Research" \
  -F "authors=Jane Smith, John Doe" \
  -F "journal=Journal of Scientific Research" \
  -F "year=2023"
```

#### Response

Returns a JSON object with the paper details, uniqueness score, and similar papers:

```json
{
  "success": true,
  "paper": {
    "id": "60c72b2f9b1d8a2a4c9e6b3f",
    "title": "Advances in Scientific Research",
    "abstract": "This paper explores recent advances in scientific research methodologies...",
    "conclusion": "In conclusion, these advances represent significant steps forward...",
    "pageCount": 12
  },
  "uniquenessScore": 78,
  "similarPapers": [
    {
      "paperId": "paper1",
      "title": "Scientific Paper 1: Machine Learning Research",
      "similarity": 0.72,
      "url": "https://example.com/papers/paper1"
    },
    {
      "paperId": "paper2",
      "title": "Scientific Paper 2: Natural Language Processing Research",
      "similarity": 0.65,
      "url": "https://example.com/papers/paper2"
    }
  ],
  "message": "Paper uniqueness analysis completed successfully"
}
```

### 9. Get Papers

`GET /papers`

Retrieves a list of papers that have been analyzed for uniqueness.

#### Request

**Query Parameters:**

- `limit` (number): Number of papers to return (default: 10)
- `skip` (number): Number of papers to skip (default: 0)
- `sortBy` (string): Field to sort by (default: "createdAt")
- `sortDir` (string): Sort direction, "asc" or "desc" (default: "desc")

#### Example Request

```bash
curl -X GET "http://localhost:3000/papers?limit=5&sortBy=uniquenessScore&sortDir=desc"
```

#### Response

Returns a JSON object with the list of papers:

```json
{
  "success": true,
  "count": 5,
  "total": 42,
  "papers": [
    {
      "id": "60c72b2f9b1d8a2a4c9e6b3f",
      "title": "Advances in Scientific Research",
      "authors": ["Jane Smith", "John Doe"],
      "abstract": "This paper explores recent advances in scientific research methodologies...",
      "uniquenessScore": 92,
      "createdAt": "2023-11-22T16:45:30Z",
      "pdfUrl": "https://res.cloudinary.com/your-cloud-name/raw/upload/v123456789/research_papers/paper_1234567890.pdf"
    }
    // ... more papers ...
  ]
}
```

### 10. Get Paper Details

`GET /papers/:paperId`

Retrieves detailed information about a specific paper, including its uniqueness analysis.

#### Request

The endpoint accepts a paper ID as a URL parameter.

#### Example Request

```bash
curl -X GET http://localhost:3000/papers/60c72b2f9b1d8a2a4c9e6b3f
```

#### Response

Returns a JSON object with detailed information about the paper:

```json
{
  "success": true,
  "paper": {
    "id": "60c72b2f9b1d8a2a4c9e6b3f",
    "title": "Advances in Scientific Research",
    "authors": ["Jane Smith", "John Doe"],
    "abstract": "This paper explores recent advances in scientific research methodologies...",
    "conclusion": "In conclusion, these advances represent significant steps forward...",
    "publicationYear": 2023,
    "doi": "10.1234/example.doi.123",
    "journal": "Journal of Scientific Research",
    "uniquenessScore": 92,
    "similarPapers": [
      {
        "paperId": "paper1",
        "similarityScore": 0.72,
        "explanation": "Similar to \"Scientific Paper 1: Machine Learning Research\""
      }
    ],
    "pdfUrl": "https://res.cloudinary.com/your-cloud-name/raw/upload/v123456789/research_papers/paper_1234567890.pdf",
    "createdAt": "2023-11-22T16:45:30Z"
  }
}
```

## Paper Uniqueness Analysis System

The platform uses a sophisticated system to analyze the uniqueness of scientific research papers:

### How it Works

1. **PDF Processing**: The system extracts abstract and conclusion sections from uploaded research papers.

2. **BERT Embeddings**: It generates BERT embeddings for these sections, capturing their semantic meaning.

3. **Vector Similarity Search**: The embeddings are compared against a database of 800,000 scientific papers using efficient vector similarity search.

4. **Field-Specific Analysis**: Different weights are applied to abstract and conclusion comparisons to give a more accurate uniqueness score.

5. **Detailed Results**: The system returns the uniqueness score and most similar papers, allowing researchers to understand how their work relates to existing literature.

### Architecture Components

1. **PDF Extraction**: Uses regex patterns to identify and extract abstract and conclusion sections from PDFs.

2. **Embedding Service**: Python service using SentenceTransformers to generate high-quality BERT embeddings.

3. **Vector Database**: Integration with a vector database for efficient similarity search at scale:

   - Development: Uses mock data for testing
   - Production: Supports MongoDB Atlas Vector Search with other options available

4. **Similarity Scoring**: Calculates weighted similarity scores and converts them to a uniqueness percentage.

### Benefits

- **Comprehensive Analysis**: Compares against a large corpus of scientific literature
- **Semantic Understanding**: Detects similar concepts even when wording differs
- **High Performance**: Vector search enables fast similarity calculation even with 800,000+ papers
- **Detailed Insights**: Provides specific similar papers for reference and citation

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Missing required fields, invalid format, or file upload issues
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side errors

## Notes

- PDF file uploads are limited to 10MB
- Only PDF files are accepted for upload
- The generated paper follows either IEEE or APA formatting standards
- Generated PDFs are stored in Cloudinary for persistent access
- Rooms expire after 30 days by default
- Idea uniqueness is evaluated using Gemini AI
