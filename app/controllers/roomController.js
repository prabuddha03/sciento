const dbConnect = require("../utils/dbConnect");
const Room = require("../models/Room");

/**
 * Create a new room
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createRoom(req, res) {
  try {
    // Connect to database
    await dbConnect();

    // Extract data from request
    const { name, description, topic, createdBy } = req.body;

    // Validate required fields
    if (!name || !description || !topic || !createdBy) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Create new room with auto-generated access code
    const room = new Room({
      name,
      description,
      topic,
      createdBy,
      accessCode: "", // Will be auto-generated in pre-save hook
    });

    // Save room to database
    await room.save();

    // Return the created room
    res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: {
        id: room._id,
        name: room.name,
        description: room.description,
        topic: room.topic,
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

    let room;

    // Check if identifier is an ObjectID or access code
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // It's an ObjectID
      room = await Room.findById(identifier);
    } else {
      // It's an access code
      room = await Room.findOne({ accessCode: identifier });
    }

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

    // Return the room
    res.status(200).json({
      success: true,
      room: {
        id: room._id,
        name: room.name,
        description: room.description,
        topic: room.topic,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
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

module.exports = { createRoom, getRoom };
