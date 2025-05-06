import api from './api';

export interface Room {
  id: string;
  name: string;
  description: string;
  tags: string[];
  memberCount: number;
  createdBy: string;
  createdAt: string;
  isPrivate: boolean;
}

export interface RoomDetails extends Room {
  members: {
    id: string;
    name: string;
    role: 'owner' | 'moderator' | 'member';
    joinedAt: string;
  }[];
  ideas: {
    id: string;
    title: string;
    createdBy: string;
    createdAt: string;
    uniquenessScore: number;
    votes: number;
  }[];
}

export interface CreateRoomRequest {
  name: string;
  description: string;
  tags: string[];
  isPrivate: boolean;
}

const roomService = {
  // Get all rooms
  getAllRooms: async (): Promise<Room[]> => {
    const response = await api.get<{ success: boolean; rooms: Room[] }>('/rooms');
    return response.data.rooms;
  },

  // Get single room by ID
  getRoomById: async (roomId: string): Promise<RoomDetails> => {
    const response = await api.get<{ success: boolean; room: RoomDetails }>(`/rooms/${roomId}`);
    return response.data.room;
  },

  // Create a new room
  createRoom: async (roomData: CreateRoomRequest): Promise<Room> => {
    const response = await api.post<{ success: boolean; room: Room }>('/rooms', roomData);
    return response.data.room;
  },

  // Removed joinRoom function

  // Removed leaveRoom function
};

export default roomService; 