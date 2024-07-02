const express = require('express');
const Device = require('../models/Device');
const auth = require('../middleware/auth');
const { publishToMQTT } = require('../utils/mqtt');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const device = new Device({
      ...req.body,
      user: req.user._id
    });
    await device.save();
    res.status(201).send(device);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const devices = await Device.find({ user: req.user._id });
    res.send(devices);
  } catch (error) {
    res.status(500).send();
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const device = await Device.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!device) {
      return res.status(404).send();
    }
    publishToMQTT(`device/${device._id}/status`, device.status.toString());
    res.send(device);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const device = await Device.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!device) {
      return res.status(404).send();
    }
    res.send(device);
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;