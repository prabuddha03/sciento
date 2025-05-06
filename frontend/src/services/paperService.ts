import api from './api';

// Paper Analysis Types
export interface PaperAnalysisResponse {
  success: boolean;
  synopsisType: string;
  analysis: {
    synopsis: string;
    scores: {
      feasibility: { score: number; justification: string };
      innovation: { score: number; justification: string };
      scalability: { score: number; justification: string };
    };
    risks: {
      bias: { level: string; description: string };
      edgeCases: { level: string; description: string };
      ethical: { level: string; description: string };
    };
    keywords: string[];
  };
}

// AI Detection Types
export interface AIDetectionResponse {
  success: boolean;
  result: {
    isAIGenerated: boolean;
    confidence: number;
    explanation: string;
  };
}

// Paper Uniqueness Types
export interface PaperUniquenessResponse {
  success: boolean;
  paper: {
    id: string;
    title: string;
    abstract: string;
    conclusion: string;
    pageCount: number;
  };
  uniquenessScore: number;
  explanation: string;
  similarPapers: Array<{
    paperId: string;
    title: string;
    authors: string;
    year: string;
    similarity: number;
    explanation: string;
  }>;
  message: string;
}

// Paper Details Types
export interface PaperDetailsResponse {
  success: boolean;
  paper: {
    id: string;
    title: string;
    authors: string[];
    abstract: string;
    conclusion: string;
    uniquenessScore: number;
    explanation: string;
    similarPapers: Array<{
      title: string;
      authors: string;
      year: string;
      similarity: number;
      explanation: string;
    }>;
    doi?: string;
    journal?: string;
    year?: string;
    pdfUrl?: string;
    createdAt: string;
  };
}

// Paper Structuring Types
export interface PaperStructuringResponse {
  success: boolean;
  paper: {
    title: string;
    authors: string[];
    abstract: string;
    sections: Array<{
      title: string;
      content: string;
      subsections?: Array<{
        title: string;
        content: string;
      }>;
    }>;
    references: Array<{
      id: string;
      citation: string;
    }>;
  };
  formattedPaper: string;
  format: string;
}

// --- Structure Check Types --- Add new types
export interface StructureCheckResponse {
  success: boolean;
  formatChecked: string;
  detectedFormat?: string;
  complianceScore: number;
  justification: string;
  message?: string;
}
// --- End Structure Check Types ---

const paperService = {
  // Analyze a research paper PDF
  analyzePaper: async (file: File, synopsisType: string = 'moderate'): Promise<PaperAnalysisResponse> => {
    const formData = new FormData();
    formData.append('pdf', file);
    
    const response = await api.post<PaperAnalysisResponse>(`/analyze-paper?synopsis=${synopsisType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  
  // Detect if text is AI-generated
  detectAI: async (fileOrText: File | string): Promise<AIDetectionResponse> => {
    const formData = new FormData();
    
    if (fileOrText instanceof File) {
      formData.append('pdf', fileOrText);
    } else {
      formData.append('text', fileOrText);
    }
    
    const response = await api.post<AIDetectionResponse>('/detect-ai', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  
  // Check uniqueness of a paper
  checkPaperUniqueness: async (
    file: File, 
    metadata: { title?: string; authors?: string; doi?: string; journal?: string; year?: string } = {}
  ): Promise<PaperUniquenessResponse> => {
    const formData = new FormData();
    formData.append('pdf', file);
    
    // Add optional metadata
    Object.entries(metadata).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    
    const response = await api.post<PaperUniquenessResponse>('/papers/check-uniqueness', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  
  // Get a single paper with its details
  getPaperById: async (paperId: string) => {
    const response = await api.get<PaperDetailsResponse>(`/papers/${paperId}`);
    return response.data.paper;
  },

  // Structure a paper in a specific format (IEEE, APA, etc.)
  structurePaper: async (
    file: File,
    format: string,
    metadata?: {
      title?: string;
      authors?: string;
      abstract?: string;
      keywords?: string;
    }
  ): Promise<PaperStructuringResponse> => {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('format', format);
    
    // Add optional metadata
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
    }
    
    const response = await api.post<PaperStructuringResponse>('/papers/structure', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Structure a paper from raw text/sections in a specific format
  structurePaperFromText: async (
    paperData: {
      title: string;
      authors: string[];
      abstract: string;
      sections: Array<{
        title: string;
        content: string;
      }>;
      references?: string[];
    },
    format: string
  ): Promise<PaperStructuringResponse> => {
    const response = await api.post<PaperStructuringResponse>('/papers/structure-text', {
      paperData,
      format,
    });
    
    return response.data;
  },

  // --- Check paper structure compliance --- Add new function
  checkPaperStructure: async (
    file: File,
    format: string
  ): Promise<StructureCheckResponse> => {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('format', format);

    const response = await api.post<StructureCheckResponse>('/papers/check-structure', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
  // --- End check paper structure ---
};

export default paperService; 