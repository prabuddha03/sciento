# Research Paper Generator API

A Node.js Express API that generates research papers using Google's Gemini API and stores them in Cloudinary.

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
```

4. Start the server:

```
npm start
```

For development with auto-restart:

```
npm run dev
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

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Missing required fields, invalid format, or file upload issues
- `500 Internal Server Error`: Server-side errors

## Notes

- PDF file uploads are limited to 10MB
- Only PDF files are accepted for upload
- The generated paper follows either IEEE or APA formatting standards
- Generated PDFs are stored in Cloudinary for persistent access
