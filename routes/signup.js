const express = require('express');
const User = require('../models/Users'); // Adjust path as necessary

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    res.status(201).send('User created successfully');
  } catch (error) {
    res.status(400).send('Error creating user');
  }
});

module.exports = router;