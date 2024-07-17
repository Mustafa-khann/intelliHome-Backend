// models/House.js
const mongoose = require("mongoose");

// Define the ElectricityConsumption schema
const ElectricityConsumptionSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  voltage: { type: Number, required: true },
  current: { type: Number, required: true },
  power: { type: Number, required: true },
  energy: { type: Number, required: true }, // in watt-hours
});

// Define the Device schema
const DeviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: Boolean, default: false },
  icon: { type: String, required: true },
  subRoom: { type: String, default: null },
  isRoomDevice: { type: Boolean, default: false },
  electricityConsumption: [ElectricityConsumptionSchema],
});

// Define the SubRoom schema
const SubRoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  devices: [DeviceSchema],
});

// Define the Room schema
const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, required: true },
  devices: [DeviceSchema],
  subRooms: [SubRoomSchema],
});

// Define the Schedule schema
const ScheduleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
    required: true,
  },
  onTime: { type: String, required: true },
  offTime: { type: String, required: true },
  days: [
    { type: String, enum: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

// Define the House schema
const HouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  familyMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  rooms: [RoomSchema],
  devices: [DeviceSchema],
  schedules: [ScheduleSchema],
  electricityConsumption: [ElectricityConsumptionSchema],
});

module.exports = mongoose.model("House", HouseSchema);
