import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeftIcon, 
  UserGroupIcon, 
  TagIcon, 
  LockClosedIcon, 
  PlusIcon,
} from '@heroicons/react/24/outline';
import roomService from '../services/roomService';
import LoadingSpinner from '../components/LoadingSpinner';

const RoomDetailsPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [activeTab, setActiveTab] = useState<'ideas' | 'members'>('ideas');
  
  const { 
    data: room, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomId ? roomService.getRoomById(roomId) : Promise.reject('No room ID provided'),
    enabled: !!roomId
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" text="Loading room details..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Error Loading Room</h2>
        <p>{error instanceof Error ? error.message : 'Failed to load room details'}</p>
        <Link to="/rooms" className="mt-4 inline-flex items-center text-red-700 hover:text-red-800">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Rooms
        </Link>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Room Not Found</h2>
        <p>The requested room could not be found.</p>
        <Link to="/rooms" className="mt-4 inline-flex items-center text-yellow-700 hover:text-yellow-800">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Rooms
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/rooms" className="inline-flex items-center text-blue-600 hover:text-blue-700">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Rooms
        </Link>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
                {room.isPrivate && (
                  <LockClosedIcon className="h-5 w-5 text-gray-500 ml-2" />
                )}
              </div>
              <p className="text-gray-600 mt-1">Created by {room.createdBy} • {new Date(room.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <p className="text-gray-700 mb-4">{room.description}</p>
          
          <div className="flex items-center mb-4">
            <TagIcon className="h-5 w-5 text-gray-500 mr-2" />
            <div className="flex flex-wrap">
              {room?.tags?.map((tag, index) => (
                <span 
                  key={index}
                  className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded mr-2 mb-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex items-center mb-4">
            <UserGroupIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-gray-700">{room.memberCount} members</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('ideas')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ideas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ideas
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Members
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'ideas' ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Research Ideas</h2>
            <Link 
              to={`/rooms/${roomId}/submit-idea`} 
              className="btn btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-1.5" />
              Submit New Idea
            </Link>
          </div>

          {room?.ideas?.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 text-gray-700 p-6 rounded-lg text-center">
              <p className="font-medium mb-2">No ideas have been submitted to this room yet.</p>
              <p>Be the first to contribute by submitting a research idea!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {room?.ideas?.map((idea) => (
                <Link
                  key={idea.id}
                  to={`/ideas/${idea.id}`}
                  className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">{idea.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Submitted by {idea.createdBy} • {new Date(idea.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          idea.uniquenessScore >= 70 ? 'text-green-600' : 
                          idea.uniquenessScore >= 30 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {idea.uniquenessScore}% Unique
                        </div>
                      </div>
                      <div className="text-right text-gray-500 flex items-center">
                        <span className="text-sm font-medium">{idea.votes} votes</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Room Members</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {room?.members?.map((member) => (
                <li key={member.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)} • 
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      {member.role === 'owner' && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          Owner
                        </span>
                      )}
                      {member.role === 'moderator' && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Moderator
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              )) ?? (
                 <li className="px-6 py-4 text-gray-500 italic">Membership information not available.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetailsPage; 