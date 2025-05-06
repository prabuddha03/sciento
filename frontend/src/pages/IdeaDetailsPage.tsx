import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeftIcon, 
  ChatBubbleLeftRightIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
  PuzzlePieceIcon,
  LightBulbIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import ideaService from '../services/ideaService';
import LoadingSpinner from '../components/LoadingSpinner';

const IdeaDetailsPage = () => {
  const { ideaId } = useParams<{ ideaId: string }>();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  
  const { 
    data: idea, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['idea', ideaId],
    queryFn: () => ideaId ? ideaService.getIdeaById(ideaId) : Promise.reject('No idea ID provided'),
    enabled: !!ideaId
  });

  const voteOnIdeaMutation = useMutation({
    mutationFn: ({ ideaId, voteType }: { ideaId: string; voteType: 'up' | 'down' }) => 
      ideaService.voteOnIdea(ideaId, voteType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId] });
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ ideaId, content }: { ideaId: string; content: string }) => 
      ideaService.addComment(ideaId, content),
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId] });
    }
  });

  const handleVote = (voteType: 'up' | 'down') => {
    if (ideaId) {
      voteOnIdeaMutation.mutate({ ideaId, voteType });
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (ideaId && newComment.trim()) {
      addCommentMutation.mutate({ ideaId, content: newComment });
    }
  };

  const renderUniquenessScore = (score: number) => {
    let color = 'text-green-600';
    let message = 'Highly unique';
    
    if (score < 30) {
      color = 'text-red-600';
      message = 'Low uniqueness';
    } else if (score < 70) {
      color = 'text-yellow-600';
      message = 'Moderately unique';
    }
    
    return (
      <div className="flex items-center space-x-2">
        <span className={`text-3xl font-bold ${color}`}>{score}%</span>
        <span className={`font-medium ${color}`}>{message}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" text="Loading idea details..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Error Loading Idea</h2>
        <p>{error instanceof Error ? error.message : 'Failed to load idea details'}</p>
        <Link to="/rooms" className="mt-4 inline-flex items-center text-red-700 hover:text-red-800">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Rooms
        </Link>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Idea Not Found</h2>
        <p>The requested idea could not be found.</p>
        <Link to="/rooms" className="mt-4 inline-flex items-center text-yellow-700 hover:text-yellow-800">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Rooms
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to={`/rooms/${idea.roomId}`} className="inline-flex items-center text-blue-600 hover:text-blue-700">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Room
        </Link>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8">
        <div className="flex border-b border-gray-200 px-6 py-4">
          <div className="mr-4 flex flex-col items-center">
            <button 
              onClick={() => handleVote('up')}
              className="text-gray-500 hover:text-blue-600 p-1"
              disabled={voteOnIdeaMutation.isPending}
            >
              <ChevronUpIcon className="h-6 w-6" />
            </button>
            <span className="text-lg font-bold my-1">{idea.votes}</span>
            <button 
              onClick={() => handleVote('down')}
              className="text-gray-500 hover:text-red-600 p-1"
              disabled={voteOnIdeaMutation.isPending}
            >
              <ChevronDownIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{idea.title}</h1>
            <p className="text-gray-600 mt-1">
              Submitted by {idea.createdBy} • {new Date(idea.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          <div>
            <div className="flex items-center mb-2">
              <LightBulbIcon className="h-5 w-5 text-yellow-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Description</h2>
            </div>
            <p className="text-gray-700 whitespace-pre-line">{idea.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center mb-2">
                <PuzzlePieceIcon className="h-5 w-5 text-red-500 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Problem Statement</h2>
              </div>
              <p className="text-gray-700 whitespace-pre-line">{idea.problemStatement}</p>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <LightBulbIcon className="h-5 w-5 text-green-500 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Proposed Solution</h2>
              </div>
              <p className="text-gray-700 whitespace-pre-line">{idea.proposedSolution}</p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Uniqueness Analysis</h2>
            </div>
            <div className="mb-3">
              {renderUniquenessScore(idea.uniquenessAnalysis.score)}
              <p className="mt-2 text-gray-700">{idea.uniquenessAnalysis.explanation}</p>
            </div>
            
            {idea.uniquenessAnalysis.similarIdeas.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Similar Ideas:</h3>
                <div className="space-y-3">
                  {idea.uniquenessAnalysis.similarIdeas.map((similarIdea) => (
                    <div key={similarIdea.id} className="bg-white p-3 rounded border border-gray-200">
                      <div className="flex justify-between">
                        <Link 
                          to={`/ideas/${similarIdea.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {similarIdea.title}
                        </Link>
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                          {similarIdea.similarity}% Similar
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{similarIdea.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Discussion</h2>
            <span className="ml-2 bg-gray-100 text-gray-700 text-sm rounded-full px-2 py-0.5">
              {idea.comments.length}
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {idea.comments.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No comments yet. Be the first to start the discussion!</p>
            </div>
          ) : (
            idea.comments.map((comment) => (
              <div key={comment.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-900">{comment.createdBy}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-gray-700 whitespace-pre-line">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50">
          <form onSubmit={handleAddComment}>
            <div className="flex">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="form-input flex-1 rounded-r-none"
                disabled={addCommentMutation.isPending}
              />
              <button
                type="submit"
                className="btn bg-blue-600 text-white px-4 rounded-l-none hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50"
                disabled={!newComment.trim() || addCommentMutation.isPending}
              >
                {addCommentMutation.isPending ? (
                  <LoadingSpinner size="small" text="" />
                ) : (
                  <PaperAirplaneIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {addCommentMutation.isError && (
              <p className="mt-2 text-sm text-red-600">
                {addCommentMutation.error instanceof Error
                  ? addCommentMutation.error.message
                  : 'Error posting comment. Please try again.'}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default IdeaDetailsPage; 