import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import roomService from '../services/roomService';
import LoadingSpinner from '../components/LoadingSpinner';

const CreateRoomPage = () => {
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState({
    name: '',
    description: '',
    topic: '',
    createdBy: '',
    isPrivate: false,
  });
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const createRoomMutation = useMutation({
    mutationFn: () => roomService.createRoom({ 
        name: roomData.name,
        description: roomData.description,
        topic: roomData.topic,
        createdBy: roomData.createdBy,
        tags: tags,
        isPrivate: roomData.isPrivate,
    }),
    onSuccess: (room) => {
      navigate(`/rooms/${room.id}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRoomData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setRoomData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags((prev) => [...prev, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!roomData.name.trim()) {
      errors.name = 'Room name is required';
    } else if (roomData.name.trim().length < 3) {
      errors.name = 'Room name must be at least 3 characters';
    }

    if (!roomData.description.trim()) {
      errors.description = 'Room description is required';
    } else if (roomData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (!roomData.topic.trim()) {
      errors.topic = 'Room topic is required';
    }

    if (!roomData.createdBy.trim()) {
      errors.createdBy = 'Creator name is required';
    }

    if (tags.length === 0) {
      errors.tags = 'At least one topic tag is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      createRoomMutation.mutate();
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link to="/rooms" className="inline-flex items-center text-blue-600 hover:text-blue-700">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Rooms
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Create a Research Room</h1>
        <p className="mt-2 text-gray-600">
          Research rooms are spaces for collaboration on scientific ideas and papers.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={roomData.name}
                  onChange={handleInputChange}
                  className={`form-input w-full ${validationErrors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g., Quantum Computing Research Group"
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
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
                  value={roomData.description}
                  onChange={handleInputChange}
                  className={`form-textarea w-full ${validationErrors.description ? 'border-red-500' : ''}`}
                  placeholder="Describe the purpose and focus of this research room..."
                />
                {validationErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                )}
              </div>

              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                  Room Topic*
                </label>
                <input
                  type="text"
                  id="topic"
                  name="topic"
                  value={roomData.topic}
                  onChange={handleInputChange}
                  className={`form-input w-full ${validationErrors.topic ? 'border-red-500' : ''}`}
                  placeholder="e.g., AI Ethics, Nanotechnology, Astrophysics"
                />
                {validationErrors.topic && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.topic}</p>
                )}
              </div>

              <div>
                <label htmlFor="createdBy" className="block text-sm font-medium text-gray-700 mb-1">
                  Created By*
                </label>
                <input
                  type="text"
                  id="createdBy"
                  name="createdBy"
                  value={roomData.createdBy}
                  onChange={handleInputChange}
                  className={`form-input w-full ${validationErrors.createdBy ? 'border-red-500' : ''}`}
                  placeholder="Your Name or Alias"
                />
                {validationErrors.createdBy && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.createdBy}</p>
                )}
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  Topic Tags*
                </label>
                <div className={`flex flex-wrap items-center p-2 border rounded-md ${
                  validationErrors.tags ? 'border-red-500' : 'border-gray-300'
                }`}>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 m-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      onBlur={() => tagInput.trim() && addTag()}
                      className="w-full border-0 p-1 focus:ring-0 focus:outline-none text-sm"
                      placeholder={tags.length > 0 ? "Add another tag..." : "Add tags (e.g., AI, Machine Learning, Genomics)"}
                    />
                  </div>
                </div>
                {validationErrors.tags && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.tags}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Press Enter or Tab to add each tag. These help others find your room.
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrivate"
                  name="isPrivate"
                  checked={roomData.isPrivate}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700">
                  Make this room private (invitation only)
                </label>
              </div>

              {createRoomMutation.isError && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Error creating room</p>
                    <p className="text-sm mt-1">
                      {createRoomMutation.error instanceof Error
                        ? createRoomMutation.error.message
                        : 'An unexpected error occurred. Please try again.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={createRoomMutation.isPending}
                  className="btn btn-primary w-full flex justify-center items-center"
                >
                  {createRoomMutation.isPending ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner size="small" text="" />
                      <span className="ml-2">Creating room...</span>
                    </span>
                  ) : (
                    <>
                      <PlusIcon className="h-5 w-5 mr-1.5" />
                      Create Research Room
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

export default CreateRoomPage; 