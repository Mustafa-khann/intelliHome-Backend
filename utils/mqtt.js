const mqtt = require('mqtt');

let client;

const connectMQTT = () => {
  client = mqtt.connect(process.env.MQTT_BROKER_URL);

  client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe('device/+/status');
  });

  client.on('message', (topic, message) => {
    console.log(`Received message on ${topic}: ${message.toString()}`);
    // Handle incoming messages here
  });
};

const publishToMQTT = (topic, message) => {
  if (client && client.connected) {
    client.publish(topic, message);
  }
};

module.exports = { connectMQTT, publishToMQTT };