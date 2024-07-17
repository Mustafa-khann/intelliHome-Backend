const mockDevices = [
  { id: 1, name: "Living Room Light", status: true, icon: "lightbulb" },
  { id: 2, name: "Kitchen Light", status: false, icon: "lightbulb" },
  { id: 3, name: "Bathroom Geyser", status: true, icon: "water-pump" },
  { id: 4, name: "Office Computer", status: true, icon: "desktop-classic" },
  { id: 5, name: "Smart Thermostat", status: false, icon: "thermostat" },
  { id: 6, name: "Door Lock", status: true, icon: "lock" },
  { id: 7, name: "Security Camera", status: false, icon: "camera" },
  { id: 8, name: "Washing Machine", status: true, icon: "washing-machine" },
  { id: 9, name: "Smart TV", status: false, icon: "television" },
  { id: 10, name: "Refrigerator", status: true, icon: "fridge" },
];

const mockRooms = [
  {
    id: 1,
    name: "Living Room",
    icon: "sofa",
    devices: [mockDevices[0], mockDevices[8], mockDevices[6]],
  },
  {
    id: 2,
    name: "Bedroom",
    icon: "bed",
    devices: [mockDevices[1], mockDevices[4], mockDevices[7]],
    subRooms: [
      {
        id: "2-1",
        name: "Bathroom",
        devices: [mockDevices[2], mockDevices[5]],
      },
    ],
  },
  {
    id: 3,
    name: "Kitchen",
    icon: "silverware-fork-knife",
    devices: [mockDevices[9], mockDevices[1], mockDevices[7]],
  },
  {
    id: 4,
    name: "Home Office",
    icon: "desktop-mac",
    devices: [mockDevices[3], mockDevices[0], mockDevices[6]],
    subRooms: [
      {
        id: "4-1",
        name: "Bathroom",
        devices: [mockDevices[2], mockDevices[5]],
      },
    ],
  },
  {
    id: 5,
    name: "Dining Room",
    icon: "silverware",
    devices: [mockDevices[1], mockDevices[8], mockDevices[9]],
  },
  {
    id: 6,
    name: "Garage",
    icon: "car",
    devices: [mockDevices[6], mockDevices[5], mockDevices[3]],
  },
];

module.exports = { mockDevices, mockRooms };
