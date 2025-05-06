import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, MagnifyingGlassIcon, UsersIcon } from '@heroicons/react/24/outline';
import roomService from '../services/roomService';
import LoadingSpinner from '../components/LoadingSpinner';

const RoomsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { 
    data: rooms, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomService.getAllRooms(),
  });

  const filteredRooms = rooms?.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const renderRoomTopics = (topics: string[]) => {
    return topics.slice(0, 3).map((topic, index) => (
      <span 
        key={index}
        className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded mr-2 mb-1"
      >
        {topic}
      </span>
    ));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Research Rooms</h1>
          <p className="mt-2 text-gray-600">
            Join research rooms to collaborate with others on ideas and papers.
          </p>
        </div>
        <Link to="/rooms/new" className="btn btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-1.5" />
          Create Room
        </Link>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search rooms by name, description, or topics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" text="Loading rooms..." />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error Loading Rooms</h2>
          <p>{error instanceof Error ? error.message : 'Failed to load rooms'}</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">No Rooms Found</h2>
          {searchTerm ? (
            <p>No rooms match your search criteria. Try different keywords or create a new room.</p>
          ) : (
            <p>There are no research rooms yet. Be the first to create one!</p>
          )}
          <Link to="/rooms/new" className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800">
            <PlusIcon className="h-4 w-4 mr-1" /> Create a new room
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRooms.map((room) => (
            <Link 
              key={room.id}
              to={`/rooms/${room.id}`} 
              className="block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition duration-200"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{room.name}</h2>
                  <div className="flex items-center text-gray-500">
                    <UsersIcon className="h-5 w-5 mr-1" />
                    <span>{room.memberCount}</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">{room.description}</p>
                
                <div className="mb-4 flex flex-wrap">
                  {renderRoomTopics(room.tags)}
                  {room.tags.length > 3 && (
                    <span className="inline-block px-2 py-1 text-xs text-gray-500">
                      +{room.tags.length - 3} more
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Created by {room.createdBy}</span>
                  <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomsPage; 