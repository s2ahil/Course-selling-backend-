const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { Admin, Course } = require("./models"); // Assuming you have these models
const { authenticateJwt } = require("./middleware");
const dotenv = require("dotenv");
dotenv.config();
const SALT_ROUNDS = 10; // Define the number of salt rounds for bcrypt

// Public Routes (No Authentication)
router.post("/signup", async (req, res) => {
  console.log("admin signup ");
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username: username });

  if (admin) {
    return res.status(403).json({ message: "Admin already exists" });
  } else {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newAdmin = new Admin({ username, password: hashedPassword });
    await newAdmin.save();
    const token = jwt.sign({ username, role: "admin" }, process.env.ADMIN_SECRET, { expiresIn: "1h" });
    res.json({ message: "Admin created successfully", token });
  }
});

router.get("/me", authenticateJwt(process.env.ADMIN_SECRET), async (req, res) => {
  console.log("reached admin/me");
  const admin = await Admin.findOne({ username: req.user.username });
  if (!admin) {
    return res.status(403).json({ msg: "Admin doesn't exist" });
  }
  res.json({
    username: admin.username,
  });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });

  if (admin) {
    // Compare the password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (isPasswordValid) {
      const token = jwt.sign({ username, role: "admin" }, process.env.ADMIN_SECRET, { expiresIn: "1h" });
      res.json({ message: "Logged in successfully", token });
    } else {
      res.status(403).json({ message: "Invalid credentials" });
    }
  } else {
    res.status(403).json({ message: "Admin not found" });
  }
});

// Protected Routes (Require Authentication)
router.use(authenticateJwt(process.env.ADMIN_SECRET));

router.post("/courses", async (req, res) => {
  try {
    const admin = await Admin.findOne({ username: req.user.username }); // Get the admin based on the JWT
    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    const newCourse = new Course({
      ...req.body,
      createdBy: admin._id,  // Store the admin's ObjectId in the createdBy field
    });
    
    await newCourse.save();

    // Update the admin's createdCourses array
    admin.createdCourses.push(newCourse._id);
    await admin.save();

    res.json({ message: "Course created successfully", courseId: newCourse._id });
  } catch (err) {
    res.status(500).json({ message: "Error creating course", error: err.message });
  }
});

router.get("/courses", async (req, res) => {
  try {
    const admin = await Admin.findOne({ username: req.user.username });
    console.log("reached courses get");
    const courses = await Course.find({ createdBy: admin._id });
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: "Error fetching courses", error: err.message });
  }
});

router.get("/courses/analytics", async (req, res) => {
  try {
    const admin = await Admin.findOne({ username: req.user.username }).populate("createdCourses");
    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    // Get all courses created by the admin
    const courses = await Course.find({ createdBy: admin._id }).populate("purchasedBy.user");

    // Create analytics data
    const analytics = courses.map(course => ({
      name: course.title,
      purchases: course.purchasedBy.length, // Count the number of users who purchased each course
    }));

    res.json(analytics);
  } catch (err) {
    res.status(500).json({ message: "Error fetching course analytics", error: err.message });
  }
});

// Get course by ID
router.get("/courses/:id", async (req, res) => {
  try {
    const admin = await Admin.findOne({ username: req.user.username });
    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    const course = await Course.findOne({ _id: req.params.id, createdBy: admin._id });
    if (!course) {
      return res.status(404).json({ message: "Course not found or unauthorized" });
    }

    res.json({ course });
  } catch (err) {
    res.status(500).json({ message: "Error fetching course", error: err.message });
  }
});

// Update course by ID
router.patch("/courses/:id", async (req, res) => {
  try {
    const admin = await Admin.findOne({ username: req.user.username });
    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    const course = await Course.findOne({ _id: req.params.id, createdBy: admin._id });
    if (!course) {
      return res.status(404).json({ message: "Course not found or unauthorized" });
    }

    // Update course fields
    Object.assign(course, req.body);
    await course.save();

    res.json({ message: "Course updated successfully", course });
  } catch (err) {
    res.status(500).json({ message: "Error updating course", error: err.message });
  }
});

// Delete course by ID
router.delete("/courses/:id", async (req, res) => {
  try {
    const admin = await Admin.findOne({ username: req.user.username });
    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    // Find and delete the course if it was created by this admin
    const course = await Course.findOneAndDelete({ _id: req.params.id, createdBy: admin._id });
    if (!course) {
      return res.status(404).json({ message: "Course not found or unauthorized" });
    }

    // Remove the course reference from the admin's `createdCourses` array
    admin.createdCourses = admin.createdCourses.filter(courseId => courseId.toString() !== req.params.id);
    await admin.save();

    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting course", error: err.message });
  }
});

module.exports = router;
