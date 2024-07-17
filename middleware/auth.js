const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.header("Authorization").replace("Bearer ", "");

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by _id from decoded token
    const user = await User.findById(decoded.userId);

    // If user not found, throw error
    if (!user) {
      throw new Error();
    }

    // Attach user information to request object
    req.token = token;
    req.user = user;

    // Proceed to next middleware
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = auth;
