const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a room name"],
    trim: true,
    maxlength: [50, "Room name cannot be more than 50 characters"],
  },
  description: {
    type: String,
    required: [true, "Please provide a room description"],
    trim: true,
    maxlength: [500, "Room description cannot be more than 500 characters"],
  },
  topic: {
    type: String,
    required: [true, "Please provide a topic for this room"],
    trim: true,
  },
  createdBy: {
    type: String,
    required: [true, "Please provide a creator name"],
    trim: true,
  },
  accessCode: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
    default: function () {
      // Default room expiration: 30 days from creation
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    },
  },
});

// Generate a random 6-character access code before saving
RoomSchema.pre("save", function (next) {
  if (!this.isModified("accessCode")) {
    // If the access code is already set and not being modified, continue
    return next();
  }

  // Generate a random 6-character code if not already set
  if (!this.accessCode) {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed similar looking characters
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.accessCode = code;
  }

  next();
});

module.exports = mongoose.models.Room || mongoose.model("Room", RoomSchema);
