const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/Users'); // Adjust path as necessary

const router = express.Router();
const SECRET_KEY = 'secretKey';

router.post('/', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).send('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).send('Invalid credentials');
  }

  const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '24h' });
  res.json({ token });
});

module.exports = router;
