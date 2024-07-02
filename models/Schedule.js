const mongoose = require('mongoose');
const Device = require('./Device');  // Import the Device model

const ScheduleSchema = new mongoose.Schema({
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  action: { type: Boolean, required: true },
  time: { type: Date, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);