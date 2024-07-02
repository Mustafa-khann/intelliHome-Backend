const express = require('express');
const Schedule = require('../models/Schedule');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const schedule = new Schedule({
      ...req.body,
      user: req.user._id
    });
    await schedule.save();
    res.status(201).send(schedule);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const schedules = await Schedule.find({ user: req.user._id }).populate('device');
    res.send(schedules);
  } catch (error) {
    res.status(500).send();
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!schedule) {
      return res.status(404).send();
    }
    res.send(schedule);
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;