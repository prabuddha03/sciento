import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/LoadingSpinner';
import ideaService from '../services/ideaService';
import roomService from '../services/roomService';

const SubmitIdeaPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const [ideaData, setIdeaData] = useState({
    title: '',
    description: '',
    problemStatement: '',
    proposedSolution: '',
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { data: room, isLoading: isLoadingRoom } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomId ? roomService.getRoomById(roomId) : Promise.reject('No room ID provided'),
    enabled: !!roomId
  });

  const submitIdeaMutation = useMutation({
    mutationFn: (data: typeof ideaData) => {
      if (!roomId) throw new Error('Room ID is required');
      return ideaService.submitIdea(roomId, data);
    },
    onSuccess: (data) => {
      navigate(`/ideas/${data.id}`);
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setIdeaData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!ideaData.title.trim()) {
      errors.title = 'Title is required';
    } else if (ideaData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }

    if (!ideaData.description.trim()) {
      errors.description = 'Description is required';
    } else if (ideaData.description.trim().length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }

    if (!ideaData.problemStatement.trim()) {
      errors.problemStatement = 'Problem statement is required';
    } else if (ideaData.problemStatement.trim().length < 20) {
      errors.problemStatement = 'Problem statement must be at least 20 characters';
    }

    if (!ideaData.proposedSolution.trim()) {
      errors.proposedSolution = 'Proposed solution is required';
    } else if (ideaData.proposedSolution.trim().length < 20) {
      errors.proposedSolution = 'Proposed solution must be at least 20 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      submitIdeaMutation.mutate(ideaData);
    }
  };

  if (isLoadingRoom) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" text="Loading room details..." />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Room Not Found</h2>
        <p>The room you're trying to submit an idea to couldn't be found.</p>
        <Link to="/rooms" className="mt-4 inline-flex items-center text-yellow-700 hover:text-yellow-800">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Rooms
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link 
          to={`/rooms/${roomId}`} 
          className="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to {room.name}
        </Link>
        
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Submit a Research Idea
        </h1>
        <p className="mt-2 text-gray-600">
          Share your research idea with the room. It will be checked for uniqueness against existing research.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Idea Title*
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={ideaData.title}
                  onChange={handleInputChange}
                  className={`form-input w-full ${validationErrors.title ? 'border-red-500' : ''}`}
                  placeholder="A concise title for your research idea"
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description*
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={ideaData.description}
                  onChange={handleInputChange}
                  className={`form-textarea w-full ${validationErrors.description ? 'border-red-500' : ''}`}
                  placeholder="Provide a general overview of your research idea..."
                />
                {validationErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Explain your idea in detail, including its significance and potential impact.
                </p>
              </div>

              <div>
                <label htmlFor="problemStatement" className="block text-sm font-medium text-gray-700 mb-1">
                  Problem Statement*
                </label>
                <textarea
                  id="problemStatement"
                  name="problemStatement"
                  rows={3}
                  value={ideaData.problemStatement}
                  onChange={handleInputChange}
                  className={`form-textarea w-full ${validationErrors.problemStatement ? 'border-red-500' : ''}`}
                  placeholder="What specific problem does your research idea address?"
                />
                {validationErrors.problemStatement && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.problemStatement}</p>
                )}
              </div>

              <div>
                <label htmlFor="proposedSolution" className="block text-sm font-medium text-gray-700 mb-1">
                  Proposed Solution*
                </label>
                <textarea
                  id="proposedSolution"
                  name="proposedSolution"
                  rows={4}
                  value={ideaData.proposedSolution}
                  onChange={handleInputChange}
                  className={`form-textarea w-full ${validationErrors.proposedSolution ? 'border-red-500' : ''}`}
                  placeholder="How do you propose to solve the problem? What approach would you take?"
                />
                {validationErrors.proposedSolution && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.proposedSolution}</p>
                )}
              </div>

              {submitIdeaMutation.isError && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Error submitting idea</p>
                    <p className="text-sm mt-1">
                      {submitIdeaMutation.error instanceof Error
                        ? submitIdeaMutation.error.message
                        : 'An unexpected error occurred. Please try again.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitIdeaMutation.isPending}
                  className="btn btn-primary w-full flex justify-center items-center"
                >
                  {submitIdeaMutation.isPending ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner size="small" text="" />
                      <span className="ml-2">Submitting idea...</span>
                    </span>
                  ) : (
                    <>
                      <PlusIcon className="h-5 w-5 mr-1.5" />
                      Submit Research Idea
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitIdeaPage; 