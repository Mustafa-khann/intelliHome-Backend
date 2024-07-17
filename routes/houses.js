const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const House = require("../models/House");
const auth = require("../middleware/auth");
const ObjectId = mongoose.Types.ObjectId;
const { check, validationResult } = require("express-validator");

// Middleware to handle house_id parameter
router.param("house_id", async (req, res, next, house_id) => {
  try {
    const house = await House.findById(house_id);
    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }
    req.house = house;
    next();
  } catch (error) {
    console.error("Error fetching house:", error);
    res.status(500).json({ error: "Failed to fetch house" });
  }
});

// CRUD operations for houses (/houses)
router
  .route("/")
  .get(auth, async (req, res) => {
    try {
      const houses = await House.find({ owner: req.user._id });
      res.json(houses);
    } catch (error) {
      console.error("Error fetching houses:", error);
      res.status(500).json({ error: "Failed to fetch houses" });
    }
  })
  .post(auth, async (req, res) => {
    const { name, address } = req.body;
    try {
      const newHouse = new House({ name, address, owner: req.user._id });
      await newHouse.save();
      res.status(201).json(newHouse);
    } catch (error) {
      console.error("Error creating house:", error);
      res.status(500).json({ error: "Failed to create house" });
    }
  });

router.post("/createhouse", auth, async (req, res) => {
  try {
    let { name, address, rooms, schedules, electricityConsumption } = req.body;

    // Convert string IDs to ObjectIds for schedules
    if (schedules) {
      schedules = schedules.map((schedule) => ({
        ...schedule,
        deviceId: new mongoose.Types.ObjectId(schedule.deviceId),
        createdBy: req.user._id,
      }));
    }

    // Convert string IDs to ObjectIds for electricityConsumption
    if (electricityConsumption) {
      electricityConsumption = electricityConsumption.map((consumption) => ({
        ...consumption,
        device: new mongoose.Types.ObjectId(consumption.device),
      }));
    }

    const newHouse = new House({
      name,
      address,
      owner: req.user._id,
      rooms,
      schedules,
      electricityConsumption,
    });

    await newHouse.save();

    res.status(201).json({
      message: "House created successfully",
      house: newHouse,
    });
  } catch (error) {
    console.error("Error creating house:", error);
    res
      .status(500)
      .json({ error: "Failed to create house", details: error.message });
  }
});

// CRUD operations for /houses/:house_id
router
  .route("/:house_id")
  .get(auth, (req, res) => {
    res.json(req.house);
  })
  .put(auth, async (req, res) => {
    const { name, address } = req.body;
    try {
      req.house.name = name || req.house.name;
      req.house.address = address || req.house.address;
      await req.house.save();
      res.json(req.house);
    } catch (error) {
      console.error("Error updating house:", error);
      res.status(500).json({ error: "Failed to update house" });
    }
  })
  .delete(auth, async (req, res) => {
    try {
      await House.deleteOne({ _id: req.params.house_id });
      res.json({ message: "House deleted" });
    } catch (error) {
      console.error("Error deleting house:", error);
      res.status(500).json({ error: "Failed to delete house" });
    }
  });

// GET /:house_id/house-devices - Retrieve all house devices (not in rooms)
router.get("/:house_id/housedevices", auth, async (req, res) => {
  try {
    const house = await House.findById(req.params.house_id);
    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    // Filter devices that are not room devices
    const houseDevices = house.devices.filter((device) => !device.isRoomDevice);
    res.json(houseDevices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /:house_id/house-devices - Add a new house device
router.post("/:house_id/housedevices", auth, async (req, res) => {
  const { name, icon } = req.body;
  try {
    const house = await House.findById(req.params.house_id);
    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    const newDevice = {
      name,
      icon,
      status: false, // Default status
      isRoomDevice: false, // Mark as a house device
    };

    house.devices.push(newDevice);
    await house.save();

    res.status(201).json(newDevice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /:house_id/house-devices/:device_id - Update a specific house device
router.put("/:house_id/housedevices/:device_id", auth, async (req, res) => {
  const { name, icon, status } = req.body;
  try {
    const house = await House.findById(req.params.house_id);
    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    const device = house.devices.id(req.params.device_id);
    if (!device || device.isRoomDevice) {
      return res.status(404).json({ message: "House device not found" });
    }

    if (name) device.name = name;
    if (icon) device.icon = icon;
    if (status !== undefined) device.status = status; // Handle status change

    await house.save();
    res.json(device);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /:house_id/house-devices/:device_id - Delete a specific house device
router.delete("/:house_id/housedevices/:device_id", auth, async (req, res) => {
  try {
    const house = await House.findById(req.params.house_id);
    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    const device = house.devices.id(req.params.device_id);
    if (!device || device.isRoomDevice) {
      return res.status(404).json({ message: "House device not found" });
    }

    device.remove();
    await house.save();
    res.json({ message: "Device deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// CRUD operations for rooms (/houses/:house_id/rooms)
router
  .route("/:house_id/rooms")
  .get(auth, (req, res) => {
    res.json(req.house.rooms);
  })
  .post(auth, async (req, res) => {
    const { name, icon } = req.body;
    try {
      const newRoom = { name, icon, devices: [], subRooms: [] };
      req.house.rooms.push(newRoom);
      await req.house.save();
      res.status(201).json(newRoom);
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ error: "Failed to create room" });
    }
  });

// CRUD operations for a specific room (/houses/:house_id/rooms/:room_id)
router
  .route("/:house_id/rooms/:room_id")
  .get(auth, (req, res) => {
    const room = req.house.rooms.id(req.params.room_id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  })
  .put(auth, async (req, res) => {
    const { name, icon } = req.body;
    try {
      const room = req.house.rooms.id(req.params.room_id);
      if (!room) return res.status(404).json({ message: "Room not found" });
      room.name = name || room.name;
      room.icon = icon || room.icon;
      await req.house.save();
      res.json(room);
    } catch (error) {
      console.error("Error updating room:", error);
      res.status(500).json({ error: "Failed to update room" });
    }
  })
  .delete(auth, async (req, res) => {
    try {
      req.house.rooms.id(req.params.room_id).remove();
      await req.house.save();
      res.json({ message: "Room deleted" });
    } catch (error) {
      console.error("Error deleting room:", error);
      res.status(500).json({ error: "Failed to delete room" });
    }
  });

// CRUD operations for devices in a specific room (/houses/:house_id/rooms/:room_id/devices)
router
  .route("/:house_id/rooms/:room_id/devices")
  .get(auth, (req, res) => {
    const room = req.house.rooms.id(req.params.room_id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room.devices);
  })
  .post(auth, async (req, res) => {
    const { name, icon } = req.body;
    try {
      const room = req.house.rooms.id(req.params.room_id);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const newDevice = { name, icon, status: false };
      room.devices.push(newDevice);
      await req.house.save();
      res.status(201).json(newDevice);
    } catch (error) {
      console.error("Error adding device:", error);
      res.status(500).json({ error: "Failed to add device" });
    }
  });

// CRUD operations for a specific device in a specific room (/houses/:house_id/rooms/:room_id/devices/:device_id)
router
  .route("/:house_id/rooms/:room_id/devices/:device_id")
  .get(auth, (req, res) => {
    const room = req.house.rooms.id(req.params.room_id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    const device = room.devices.id(req.params.device_id);
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.json(device);
  })
  .put(auth, async (req, res) => {
    const { name, icon } = req.body;
    try {
      const room = req.house.rooms.id(req.params.room_id);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const device = room.devices.id(req.params.device_id);
      if (!device) return res.status(404).json({ message: "Device not found" });
      device.name = name || device.name;
      device.icon = icon || device.icon;
      await req.house.save();
      res.json(device);
    } catch (error) {
      console.error("Error updating device:", error);
      res.status(500).json({ error: "Failed to update device" });
    }
  })
  .delete(auth, async (req, res) => {
    try {
      const room = req.house.rooms.id(req.params.room_id);
      if (!room) return res.status(404).json({ message: "Room not found" });
      room.devices.id(req.params.device_id).remove();
      await req.house.save();
      res.json({ message: "Device deleted" });
    } catch (error) {
      console.error("Error deleting device:", error);
      res.status(500).json({ error: "Failed to delete device" });
    }
  });

// Accessing and changing the state of a device
router
  .route("/:house_id/rooms/:room_id/devices/:device_id/state")
  .get(auth, (req, res) => {
    const room = req.house.rooms.id(req.params.room_id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    const device = room.devices.id(req.params.device_id);
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.json({ status: device.status });
  })
  .put(auth, async (req, res) => {
    const { status } = req.body;
    try {
      const room = req.house.rooms.id(req.params.room_id);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const device = room.devices.id(req.params.device_id);
      if (!device) return res.status(404).json({ message: "Device not found" });
      device.status = status;
      await req.house.save();
      res.json({ message: "Device status updated successfully" });
    } catch (error) {
      console.error("Error updating device status:", error);
      res.status(500).json({ error: "Failed to update device status" });
    }
  });

// CRUD operations for sub-rooms in a specific room (/houses/:house_id/rooms/:room_id/subrooms)
router
  .route("/:house_id/rooms/:room_id/subrooms")
  .get(auth, (req, res) => {
    const room = req.house.rooms.id(req.params.room_id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room.subRooms);
  })
  .post(auth, async (req, res) => {
    const { name } = req.body;
    try {
      const room = req.house.rooms.id(req.params.room_id);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const newSubRoom = { name, devices: [] };
      room.subRooms.push(newSubRoom);
      await req.house.save();
      res.status(201).json(newSubRoom);
    } catch (error) {
      console.error("Error adding sub-room:", error);
      res.status(500).json({ error: "Failed to add sub-room" });
    }
  });

// CRUD operations for a specific sub-room in a specific room (/houses/:house_id/rooms/:room_id/subrooms/:subroom_id)
router
  .route("/:house_id/rooms/:room_id/subrooms/:subroom_id")
  .get(auth, (req, res) => {
    const room = req.house.rooms.id(req.params.room_id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    const subroom = room.subRooms.id(req.params.subroom_id);
    if (!subroom)
      return res.status(404).json({ message: "Sub-room not found" });
    res.json(subroom);
  })
  .put(auth, async (req, res) => {
    const { name } = req.body;
    try {
      const room = req.house.rooms.id(req.params.room_id);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const subroom = room.subRooms.id(req.params.subroom_id);
      if (!subroom)
        return res.status(404).json({ message: "Sub-room not found" });
      subroom.name = name || subroom.name;
      await req.house.save();
      res.json(subroom);
    } catch (error) {
      console.error("Error updating sub-room:", error);
      res.status(500).json({ error: "Failed to update sub-room" });
    }
  })
  .delete(auth, async (req, res) => {
    try {
      const room = req.house.rooms.id(req.params.room_id);
      if (!room) return res.status(404).json({ message: "Room not found" });
      room.subRooms.id(req.params.subroom_id).remove();
      await req.house.save();
      res.json({ message: "Sub-room deleted" });
    } catch (error) {
      console.error("Error deleting sub-room:", error);
      res.status(500).json({ error: "Failed to delete sub-room" });
    }
  });

// CRUD operations for devices in a specific sub-room (/houses/:house_id/rooms/:room_id/subrooms/:subroom_id/devices)
router
  .route("/:house_id/rooms/:room_id/subrooms/:subroom_id/devices")
  .get(auth, (req, res) => {
    const room = req.house.rooms.id(req.params.room_id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    const subroom = room.subRooms.id(req.params.subroom_id);
    if (!subroom)
      return res.status(404).json({ message: "Sub-room not found" });
    res.json(subroom.devices);
  })
  .post(auth, async (req, res) => {
    const { name, icon } = req.body;
    try {
      const room = req.house.rooms.id(req.params.room_id);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const subroom = room.subRooms.id(req.params.subroom_id);
      if (!subroom)
        return res.status(404).json({ message: "Sub-room not found" });
      const newDevice = { name, icon, status: false, subRoom: subroom._id };
      subroom.devices.push(newDevice);
      await req.house.save();
      res.status(201).json(newDevice);
    } catch (error) {
      console.error("Error adding device to sub-room:", error);
      res.status(500).json({ error: "Failed to add device to sub-room" });
    }
  });

// CRUD operations for a specific device in a specific sub-room (/houses/:house_id/rooms/:room_id/subrooms/:subroom_id/devices/:device_id)
router
  .route("/:house_id/rooms/:room_id/subrooms/:subroom_id/devices/:device_id")
  .get(auth, (req, res) => {
    const room = req.house.rooms.id(req.params.room_id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    const subroom = room.subRooms.id(req.params.subroom_id);
    if (!subroom)
      return res.status(404).json({ message: "Sub-room not found" });
    const device = subroom.devices.id(req.params.device_id);
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.json(device);
  })
  .put(auth, async (req, res) => {
    const { name, icon, status } = req.body;
    try {
      const room = req.house.rooms.id(req.params.room_id);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const subroom = room.subRooms.id(req.params.subroom_id);
      if (!subroom)
        return res.status(404).json({ message: "Sub-room not found" });
      const device = subroom.devices.id(req.params.device_id);
      if (!device) return res.status(404).json({ message: "Device not found" });
      device.name = name || device.name;
      device.icon = icon || device.icon;
      device.status = status !== undefined ? status : device.status;
      await req.house.save();
      res.json(device);
    } catch (error) {
      console.error("Error updating device in sub-room:", error);
      res.status(500).json({ error: "Failed to update device in sub-room" });
    }
  })
  .delete(auth, async (req, res) => {
    try {
      const room = req.house.rooms.id(req.params.room_id);
      if (!room) return res.status(404).json({ message: "Room not found" });
      const subroom = room.subRooms.id(req.params.subroom_id);
      if (!subroom)
        return res.status(404).json({ message: "Sub-room not found" });
      subroom.devices.id(req.params.device_id).remove();
      await req.house.save();
      res.json({ message: "Device deleted from sub-room" });
    } catch (error) {
      console.error("Error deleting device from sub-room:", error);
      res.status(500).json({ error: "Failed to delete device from sub-room" });
    }
  });

// CRUD operations for schedules
router
  .route("/:house_id/schedules")
  .get(auth, async (req, res) => {
    try {
      const house = await House.findById(req.params.house_id);
      if (!house) {
        return res.status(404).json({ error: "House not found" });
      }
      res.json(house.schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  })
  .post(auth, async (req, res) => {
    const { name, deviceId, onTime, offTime, days } = req.body;
    try {
      const house = await House.findById(req.params.house_id);
      if (!house) {
        return res.status(404).json({ error: "House not found" });
      }

      const newSchedule = {
        name,
        deviceId,
        onTime,
        offTime,
        days,
        createdBy: req.user._id,
      };

      house.schedules.push(newSchedule);
      await house.save();
      res.status(201).json(newSchedule);
    } catch (error) {
      console.error("Error creating schedule:", error);
      res.status(500).json({ error: "Failed to create schedule" });
    }
  })
  .put(auth, async (req, res) => {
    const { scheduleId, name, deviceId, onTime, offTime, days } = req.body;
    try {
      const house = await House.findById(req.params.house_id);
      if (!house) {
        return res.status(404).json({ error: "House not found" });
      }

      const schedule = house.schedules.id(scheduleId);
      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      // Update schedule fields
      if (name) schedule.name = name;
      if (deviceId) schedule.deviceId = deviceId;
      if (onTime) schedule.onTime = onTime;
      if (offTime) schedule.offTime = offTime;
      if (days) schedule.days = days;

      await house.save();
      res.status(200).json(schedule);
    } catch (error) {
      console.error("Error updating schedule:", error);
      res.status(500).json({ error: "Failed to update schedule" });
    }
  })
  .delete(auth, async (req, res) => {
    const { scheduleId } = req.body;
    try {
      const house = await House.findById(req.params.house_id);
      if (!house) {
        return res.status(404).json({ error: "House not found" });
      }

      const schedule = house.schedules.id(scheduleId);
      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      schedule.remove();
      await house.save();
      res.status(200).json({ message: "Schedule deleted successfully" });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      res.status(500).json({ error: "Failed to delete schedule" });
    }
  });

router
  .route("/:house_id/schedules/:schedule_id")
  .get(auth, async (req, res) => {
    try {
      const house = await House.findById(req.params.house_id);
      if (!house) {
        return res.status(404).json({ message: "House not found" });
      }

      const schedule = house.schedules.id(req.params.schedule_id);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      res.json(schedule);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      res.status(500).json({ error: "Failed to fetch schedule" });
    }
  })
  .put(auth, async (req, res) => {
    const { name, deviceId, onTime, offTime, days } = req.body;
    try {
      const house = await House.findById(req.params.house_id);
      if (!house) {
        return res.status(404).json({ message: "House not found" });
      }

      const schedule = house.schedules.id(req.params.schedule_id);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      // Update schedule fields
      schedule.name = name || schedule.name;
      schedule.deviceId = deviceId || schedule.deviceId;
      schedule.onTime = onTime || schedule.onTime;
      schedule.offTime = offTime || schedule.offTime;
      schedule.days = days || schedule.days;

      await house.save();
      res.json(schedule);
    } catch (error) {
      console.error("Error updating schedule:", error);
      res.status(500).json({ error: "Failed to update schedule" });
    }
  })
  .delete(auth, async (req, res) => {
    try {
      const house = await House.findByIdAndUpdate(
        req.params.house_id,
        {
          $pull: { schedules: { _id: req.params.schedule_id } },
        },
        { new: true },
      );

      if (!house) {
        return res.status(404).json({ message: "House not found" });
      }

      res.json({ message: "Schedule deleted" });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      res.status(500).json({ error: "Failed to delete schedule" });
    }
  });

// CRUD operations for electricity consumption
router
  .route("/:house_id/electricityconsumption")
  .get(auth, (req, res) => {
    res.json(req.house.electricityConsumption);
  })
  .post(auth, async (req, res) => {
    const { device, voltage, current, power, energy } = req.body;
    try {
      const newConsumption = { device, voltage, current, power, energy };
      req.house.electricityConsumption.push(newConsumption);
      await req.house.save();
      res.status(201).json(newConsumption);
    } catch (error) {
      console.error("Error recording electricity consumption:", error);
      res
        .status(500)
        .json({ error: "Failed to record electricity consumption" });
    }
  });

// POST: /:house_id/electricityconsumption/batch
router
  .route("/:house_id/electricityconsumption/batch")
  .post(auth, async (req, res) => {
    const { house_id } = req.params;
    const { data } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ msg: "Data must be an array" });
    }

    try {
      const house = await House.findById(house_id);
      if (!house) {
        return res.status(404).json({ msg: "House not found" });
      }

      const rooms = house.rooms || [];
      const subRooms = house.subRooms || [];

      for (const consumptionData of data) {
        const { device, voltage, current, power, energy, timestamp } =
          consumptionData;

        // Find the device in the house
        const deviceToUpdate =
          house.devices.id(device) ||
          rooms.flatMap((room) => room.devices.id(device)).find((d) => d) ||
          subRooms
            .flatMap((subRoom) => subRoom.devices.id(device))
            .find((d) => d);

        if (!deviceToUpdate) {
          return res
            .status(404)
            .json({ msg: `Device with ID ${device} not found` });
        }

        // Add the electricity consumption data to the device
        deviceToUpdate.electricityConsumption.push({
          device: device, // Ensure the device field is set
          voltage,
          current,
          power,
          energy,
          timestamp: timestamp || new Date(),
        });
      }

      // Save the updated house
      await house.save();

      res
        .status(200)
        .json({ msg: "Electricity consumption data added successfully" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });

// Electricity Consumption of past 24 hours
router
  .route("/:house_id/electricityconsumption/hourly")
  .get(auth, async (req, res) => {
    const { house_id } = req.params;

    try {
      const house = await House.findById(house_id)
        .populate("rooms.devices")
        .populate("devices");
      if (!house) {
        return res.status(404).json({ msg: "House not found" });
      }

      const energyConsumption = Array(24).fill(0);
      const currentTime = new Date();

      // Debug: Log the current time
      console.log("Current Time:", currentTime);

      // Function to accumulate energy from devices
      const accumulateEnergy = (devices) => {
        devices.forEach((device) => {
          device.electricityConsumption.forEach((consumption) => {
            const consumptionTime = new Date(consumption.timestamp);
            const hoursDifference = Math.floor(
              (currentTime - consumptionTime) / (1000 * 60 * 60),
            );

            // Debug: Log each consumption record and its calculated hour difference
            console.log(
              `Device: ${device.name}, Timestamp: ${consumption.timestamp}, Hours Difference: ${hoursDifference}`,
            );

            if (hoursDifference >= 0 && hoursDifference < 24) {
              energyConsumption[23 - hoursDifference] += consumption.energy; // Accumulate energy
            }
          });
        });
      };

      // Accumulate energy from house-level devices
      accumulateEnergy(house.devices);

      // Accumulate energy from rooms and their devices
      house.rooms.forEach((room) => {
        accumulateEnergy(room.devices);
        room.subRooms.forEach((subRoom) => {
          accumulateEnergy(subRoom.devices);
        });
      });

      const energyInKWh = energyConsumption.map((energy) =>
        parseFloat(energy.toFixed(3)),
      );

      // Debug: Log the final energy consumption array

      res.status(200).json(energyInKWh);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });

router
  .route("/:house_id/electricityconsumption/total")
  .get(auth, async (req, res) => {
    const { house_id } = req.params;

    try {
      const house = await House.findById(house_id)
        .populate("rooms.devices")
        .populate("devices");

      if (!house) {
        return res.status(404).json({ msg: "House not found" });
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1); // Set to the first day of the current month
      startOfMonth.setHours(0, 0, 0, 0); // Set time to midnight

      let totalEnergy = 0;

      // Function to calculate total energy
      const calculateTotalEnergy = (devices) => {
        devices.forEach((device) => {
          device.electricityConsumption.forEach((consumption) => {
            const consumptionTime = new Date(consumption.timestamp);
            if (consumptionTime >= startOfMonth) {
              totalEnergy += consumption.energy; // Accumulate energy
            }
          });
        });
      };

      // Calculate total energy from house-level devices
      calculateTotalEnergy(house.devices);

      // Calculate total energy from rooms and their devices
      house.rooms.forEach((room) => {
        calculateTotalEnergy(room.devices);
        room.subRooms.forEach((subRoom) => {
          calculateTotalEnergy(subRoom.devices);
        });
      });

      const totalEnergyInKWh = parseFloat(totalEnergy.toFixed(3)); // Format to 3 decimal places

      res.status(200).json({ totalEnergy: totalEnergyInKWh });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });

// Family member management
router
  .route("/:house_id/familymembers")
  .get(auth, (req, res) => {
    res.json(req.house.familyMembers);
  })
  .post(auth, async (req, res) => {
    const { userId } = req.body;
    try {
      if (!req.house.familyMembers.includes(userId)) {
        req.house.familyMembers.push(userId);
        await req.house.save();
      }
      res.status(201).json(req.house.familyMembers);
    } catch (error) {
      console.error("Error adding family member:", error);
      res.status(500).json({ error: "Failed to add family member" });
    }
  });

router
  .route("/:house_id/familymembers/:user_id")
  .delete(auth, async (req, res) => {
    try {
      req.house.familyMembers = req.house.familyMembers.filter(
        (member) => member.toString() !== req.params.user_id,
      );
      await req.house.save();
      res.json({ message: "Family member removed" });
    } catch (error) {
      console.error("Error removing family member:", error);
      res.status(500).json({ error: "Failed to remove family member" });
    }
  });

module.exports = router;
