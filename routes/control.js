const express = require('express');
const authMiddleware = require('../middleware/auth'); // Adjust path as necessary
const publishCommand = require('../mqtt/publish'); // Adjust path as necessary

const router = express.Router();

router.post('/', authMiddleware, (req, res) => {
  const { topic, command } = req.body;
  publishCommand(topic, command);
  res.status(200).send('Command sent');
});

module.exports = router;
