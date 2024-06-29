const express = require('express');
const mongoose = require('mongoose');
const mqtt = require('mqtt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost/ihomeBackend', { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to MQTT broker
const client = mqtt.connect('mqtt://localhost');

// Basic GET route
app.get('/', (req, res) => {
  res.send('Smart Home MVP Backend');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));