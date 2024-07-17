const axios = require("axios");
const jwt =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NjhlNzFmODM3Y2QxY2VhYzRkMmI2NjgiLCJpYXQiOjE3MjA3MjU1NjV9.8mjldT-Yw_q7AdsNoI5obdJSjbStd4KhmiXfUk2YqMI";

// Mock data
const { mockDevices, mockRooms } = require("./mockData");

const baseURL = "http://localhost:3000"; // Replace with your API base URL

// Function to make authenticated requests
const authenticatedRequest = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
  },
});

// Function to register a house
const registerHouse = async () => {
  try {
    const response = await authenticatedRequest.post("/houses", {
      name: "My House",
      address: "Silicon Valley",
    });
    return response.data._id;
  } catch (error) {
    console.error(
      "Error registering house:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

// Function to add rooms to a house
const addRoomsToHouse = async (houseId) => {
  const roomIds = {};
  for (const room of mockRooms) {
    try {
      const response = await authenticatedRequest.post(
        `/houses/${houseId}/rooms`,
        {
          name: room.name,
          icon: room.icon,
        },
      );
      roomIds[room.id] = response.data._id;
    } catch (error) {
      console.error(
        `Error adding room "${room.name}":`,
        error.response?.data || error.message,
      );
    }
  }
  return roomIds;
};

// Function to add devices to rooms
const addDevicesToRooms = async (houseId, roomIds) => {
  for (const room of mockRooms) {
    const roomId = roomIds[room.id];
    if (!roomId) {
      console.error(`Room ID not found for mock room ${room.id}`);
      continue;
    }
    for (const device of room.devices) {
      try {
        const response = await authenticatedRequest.post(
          `/houses/${houseId}/rooms/${roomId}/devices`,
          {
            name: device.name,
            type: device.name, // Assuming type is the same as name for mock data
            icon: device.icon,
            status: device.status,
          },
        );
        console.log(
          `Device "${device.name}" added to room "${room.name}" with ID: ${response.data._id}`,
        );
      } catch (error) {
        console.error(
          `Error adding device "${device.name}" to room "${room.name}":`,
          error.response?.data || error.message,
        );
      }
    }
  }
};

// Function to add subrooms and their devices to rooms
const addSubroomsToRooms = async (houseId, roomIds) => {
  for (const room of mockRooms) {
    const roomId = roomIds[room.id];
    if (!roomId) {
      console.error(`Room ID not found for mock room ${room.id}`);
      continue;
    }
    if (room.subRooms) {
      for (const subRoom of room.subRooms) {
        try {
          // Add subroom to the room
          const subRoomResponse = await authenticatedRequest.post(
            `/houses/${houseId}/rooms/${roomId}/subrooms`,
            {
              name: subRoom.name,
            },
          );
          console.log(`Subroom "${subRoom.name}" added to room "${room.name}"`);

          // Add devices to the subroom
          for (const device of subRoom.devices) {
            try {
              const deviceResponse = await authenticatedRequest.post(
                `/houses/${houseId}/rooms/${roomId}/devices`,
                {
                  name: device.name,
                  type: device.name, // Assuming type is the same as name for mock data
                  icon: device.icon,
                  status: device.status,
                },
              );

              // Update the subroom to include the device
              await authenticatedRequest.put(
                `/houses/${houseId}/rooms/${roomId}`,
                {
                  subRooms: [
                    {
                      name: subRoom.name,
                      devices: [deviceResponse.data._id],
                    },
                  ],
                },
              );

              console.log(
                `Device "${device.name}" added to subroom "${subRoom.name}"`,
              );
            } catch (error) {
              console.error(
                `Error adding device "${device.name}" to subroom "${subRoom.name}":`,
                error.response?.data || error.message,
              );
            }
          }
        } catch (error) {
          console.error(
            `Error adding subroom "${subRoom.name}" to room "${room.name}":`,
            error.response?.data || error.message,
          );
        }
      }
    }
  }
};

// Main function to execute the script
const uploadMockData = async () => {
  try {
    const houseId = await registerHouse();
    console.log("House registered with ID:", houseId);

    const roomIds = await addRoomsToHouse(houseId);
    console.log("Rooms added:", roomIds);

    await addDevicesToRooms(houseId, roomIds);
    console.log("Devices added to rooms");

    await addSubroomsToRooms(houseId, roomIds);
    console.log("Subrooms and their devices added");

    console.log("Mock data upload complete.");
  } catch (error) {
    console.error("Error uploading mock data:", error.message);
  }
};

// Execute the main function
uploadMockData();
