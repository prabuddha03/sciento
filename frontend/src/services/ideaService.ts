import api from './api';

export interface Idea {
  id: string;
  title: string;
  description: string;
  problemStatement: string;
  proposedSolution: string;
  createdBy: string;
  createdAt: string;
  roomId: string;
  uniquenessScore: number;
  votes: number;
}

export interface IdeaDetails extends Idea {
  uniquenessAnalysis: {
    score: number;
    explanation: string;
    similarIdeas: Array<{
      id: string;
      title: string;
      similarity: number;
      explanation: string;
    }>;
  };
  comments: Array<{
    id: string;
    content: string;
    createdBy: string;
    createdAt: string;
  }>;
}

interface IdeaSubmission {
  title: string;
  description: string;
  problemStatement: string;
  proposedSolution: string;
}

const ideaService = {
  // Submit a new idea to a room
  submitIdea: async (roomId: string, ideaData: IdeaSubmission): Promise<Idea> => {
    const response = await api.post<{ success: boolean; idea: Idea }>(
      `/rooms/${roomId}/ideas`, 
      ideaData
    );
    return response.data.idea;
  },

  // Get a single idea with details
  getIdeaById: async (ideaId: string): Promise<IdeaDetails> => {
    const response = await api.get<{ success: boolean; idea: IdeaDetails }>(
      `/ideas/${ideaId}`
    );
    return response.data.idea;
  },

  // Vote on an idea
  voteOnIdea: async (ideaId: string, voteType: 'up' | 'down'): Promise<{ success: boolean; votes: number }> => {
    const response = await api.post<{ success: boolean; votes: number }>(
      `/ideas/${ideaId}/vote`,
      { voteType }
    );
    return response.data;
  },

  // Add a comment to an idea
  addComment: async (ideaId: string, content: string): Promise<{ success: boolean; comment: { id: string; content: string; createdBy: string; createdAt: string } }> => {
    const response = await api.post<{ success: boolean; comment: { id: string; content: string; createdBy: string; createdAt: string } }>(
      `/ideas/${ideaId}/comments`,
      { content }
    );
    return response.data;
  }
};

export default ideaService; 