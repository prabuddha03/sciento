const dbConnect = require("../utils/dbConnect");
const Room = require("../models/Room");
const Idea = require("../models/Idea");

/**
 * Create a new room
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createRoom(req, res) {
  try {
    // Connect to database
    await dbConnect();

    // Extract data from request - include tags and isPrivate
    const { name, description, topic, createdBy, tags, isPrivate } = req.body;

    // Validate required fields (tags and isPrivate are optional based on schema defaults)
    if (!name || !description || !topic || !createdBy) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields (name, description, topic, createdBy)",
      });
    }

    // Create new room with auto-generated access code
    const room = new Room({
      name,
      description,
      topic,
      createdBy,
      tags: tags || [], // Use provided tags or default to empty array
      isPrivate: isPrivate || false, // Use provided value or default to false
      accessCode: "", // Will be auto-generated in pre-save hook
    });

    // Save room to database
    await room.save();

    // Return the created room - include new fields
    res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: {
        id: room._id,
        name: room.name,
        description: room.description,
        topic: room.topic,
        tags: room.tags,
        isPrivate: room.isPrivate,
        accessCode: room.accessCode,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}

/**
 * Get a room by ID or access code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getRoom(req, res) {
  try {
    // Connect to database
    await dbConnect();

    // Extract room identifier from params
    const { identifier } = req.params;

    let roomQuery;

    // Check if identifier is an ObjectID or access code
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // It's an ObjectID
      roomQuery = Room.findById(identifier);
    } else {
      // It's an access code
      roomQuery = Room.findOne({ accessCode: identifier });
    }

    const room = await roomQuery; // Execute the query to get the room first

    // Check if room exists
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Check if room is active
    if (!room.isActive) {
      return res.status(400).json({
        success: false,
        error: "This room is no longer active",
      });
    }

    // Check if room has expired
    if (room.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: "This room has expired",
      });
    }

    // Fetch associated ideas for the room
    const ideas = await Idea.find({ roomId: room._id })
      .select("title createdBy createdAt uniquenessScore votes") // Select fields needed by frontend
      .sort({ createdAt: -1 });

    // Return the room details along with the ideas
    res.status(200).json({
      success: true,
      room: {
        id: room._id,
        name: room.name,
        description: room.description,
        topic: room.topic, // Assuming topic might still be relevant internally or for other uses
        tags: room.tags || [],
        isPrivate: room.isPrivate || false,
        memberCount: room.members ? room.members.length : 0, // Assuming members field exists or calculate dynamically if needed
        createdBy: room.createdBy,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
        // TODO: Add member details if needed by the frontend interface
        members: [], // Placeholder - Add actual member fetching if required
        ideas: ideas.map((idea) => ({
          // Map fetched ideas to the expected format
          id: idea._id,
          title: idea.title,
          createdBy: idea.createdBy, // Assuming 'createdBy' is the field name in Idea model
          createdAt: idea.createdAt,
          uniquenessScore: idea.uniquenessScore,
          votes: idea.votes || 0, // Provide default value if votes might be missing
        })),
      },
    });
  } catch (error) {
    console.error("Error getting room:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}

/**
 * Get a list of all active and non-expired rooms
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getRooms(req, res) {
  try {
    // Connect to database
    await dbConnect();

    // Query for active and non-expired rooms
    const now = new Date();
    const rooms = await Room.find({
      isActive: true,
      expiresAt: { $gt: now }, // Only rooms that haven't expired
    })
      .select("name description topic createdBy createdAt expiresAt") // Select relevant fields
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    // Return the list of rooms
    res.status(200).json({
      success: true,
      count: rooms.length,
      rooms: rooms.map((room) => ({
        id: room._id,
        name: room.name,
        description: room.description,
        topic: room.topic,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt, // Include expiresAt if needed on the list view
      })),
    });
  } catch (error) {
    console.error("Error getting rooms:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}

module.exports = { createRoom, getRoom, getRooms };
