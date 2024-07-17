const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost');

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe('appliance/state', (err) => {
    if (err) {
      console.error('Subscription error:', err);
    }
  });
});

client.on('message', (topic, message) => {
  // Handle incoming messages
  console.log(`Received message on ${topic}: ${message.toString()}`);
});

module.exports = client;
