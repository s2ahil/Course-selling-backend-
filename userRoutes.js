const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { User, Course } = require("./models"); // Assuming you have these models
const { authenticateJwt } = require("./middleware");
const dotenv = require("dotenv");
dotenv.config();
const SALT_ROUNDS = 10; // Define the number of salt rounds for bcrypt

// Public Routes (No Authentication)
router.post("/signup", async (req, res) => {

  console.log("user signup reached")
  const { username, password } = req.body;
  const user = await User.findOne({ username: username });

  if (user) {
    res.status(403).json({ message: "User already exists" });
  } else {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    const token = jwt.sign({ username, role: "user" }, process.env.USER_SECRET, { expiresIn: "1h" });
    res.json({ message: "User created successfully", token });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (user) {
    // Compare the password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      const token = jwt.sign({ username, role: "user" }, process.env.USER_SECRET, { expiresIn: "1h" });
      res.json({ message: "Logged in successfully", token });
    } else {
      res.status(403).json({ message: "Invalid credentials" });
    }
  } else {
    res.status(403).json({ message: "User not found" });
  }
});


router.get("/me",authenticateJwt(process.env.USER_SECRET),async (req,res)=>{
  console.log("reached user/me")
  const admin = await User.findOne({ username: req.user.username });
  if (!admin) {
    res.status(403).json({msg: "User doesnt exist"})
    return
  }
  res.json({
      username: admin.username
  })

})
// Protected Routes (Require Authentication)
router.use(authenticateJwt(process.env.USER_SECRET));

router.get("/courses", async (req, res) => {
  const courses = await Course.find();
  res.json({ courses });
});

router.post("/courses/:courseId", async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (course) {
    const user = await User.findOne({ username: req.user.username });

    if (user) {
      // Check if the course is already in the user's purchasedCourses
      const alreadyPurchased = user.purchasedCourses.some(p => p.course.equals(course._id));
      if (alreadyPurchased) {
        return res.status(400).json({ message: "Course already purchased" });
      }

      // Add course to user's purchasedCourses
      user.purchasedCourses.push({ course: course._id });
      course.purchasedBy.push({ user: user._id });
      await user.save();
      await course.save();

      res.json({ message: "Course purchased successfully" });
    } else {
      res.status(403).json({ message: "User not found" });
    }
  } else {
    res.status(404).json({ message: "Course not found" });
  }
});

router.get("/purchasedCourses", async (req, res) => {
  const user = await User.findOne({ username: req.user.username })
    .populate({
      path: "purchasedCourses.course", // Populate course details
      model: "Course",
    });

  if (user) {
    res.json({ purchasedCourses: user.purchasedCourses || [] });
  } else {
    res.status(403).json({ message: "User not found" });
  }
});

module.exports = router;
