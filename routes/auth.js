const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const House = require("../models/House");

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY || "secretKey";

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).send({ error: "All fields are required." });
    }

    console.log(name, email, password);

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .send({ error: "User already exists with that email." });
    }

    // Create new user
    const user = new User({ name, email, password });
    await user.save();

    res.status(201).send({ message: "User registered successfully." });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).send({ error: "Internal server error." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .send({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found.");
      return res.status(400).send({ error: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Incorrect password.");
      return res.status(400).send({ error: "Invalid credentials." });
    }

    const houses = await House.find({ owner: user._id });
    const houseId = houses.length > 0 ? houses[0]._id : null;

    const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
      expiresIn: "24h",
    });

    // Send the response
    res.json({ token, house_Id: houseId });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send({ error: "Internal server error." });
  }
});

router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
