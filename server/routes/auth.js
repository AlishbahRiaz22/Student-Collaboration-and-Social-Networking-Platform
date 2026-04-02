const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// REGISTER
router.post("/register", async (req, res) => {
    console.log("REGISTER ROUTE HIT");
  try {
    const { name, username, email, password } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }]
    });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const user = new User({
      name,
      username,
      email,
      password // password will be hashed by the Mongoose pre-save hook
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "User registered successfully", token, user: { id: user._id, name: user.name, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
console.log("AUTH ROUTES LOADED");
module.exports = router;