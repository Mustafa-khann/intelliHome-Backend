const express = require('express');
const mongoose = require('mongoose');
const mqtt = require('mqtt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost/smart_home_mvp', { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to MQTT broker
const client = mqtt.connect('mqtt://localhost');

// Basic route
app.get('/', (req, res) => {
  res.send('Smart Home MVP Backend');
});

// Start server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));