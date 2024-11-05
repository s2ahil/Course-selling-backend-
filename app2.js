const express = require("express");
const mongoose = require("mongoose");
const adminRoutes = require("./adminRoutes");
const userRoutes = require("./userRoutes");
const cors = require('cors')
const bodyParser = require('body-parser')
const dotenv = require("dotenv");


const app = express();

dotenv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())



async function mongoConnection() {
    try {
      await mongoose.connect(
       process.env.mongodb_url,
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          dbName: "courses",
        }
      );
      console.log("connected");
    } catch (err) {
      throw err;
    }
  }
  mongoConnection();
// Admin routes
app.use("/admin", adminRoutes);

// User routes
app.use("/user", userRoutes);

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
