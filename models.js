const mongoose = require("mongoose");

// Admin model
const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },

    password: {
        type: String,
        required: true,

    },

    createdCourses: [
        {

            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
        }
    ],
    purchasedCoursesAnalytics: [
        {
            course: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course',
            },
            users: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                }
            ]
        }
    ]
});

const Admin = mongoose.model("Admin", adminSchema);

// User model
const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,

    },


    purchasedCourses: [
        {
            course: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course'
            },

            purchaseDate: {
                type: Date,
                default: Date.now,
            }

        }
    ],
});
const User = mongoose.model("User", userSchema);

// Course model
const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    imageLink: {
        type: String,
    },
    video:{
        type: String,
    },
    published: {
        type: Boolean

    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
    },
    purchasedBy: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            purchaseDate: {
                type: Date,
                default: Date.now,
            },
        },
    ],


});

const Course = mongoose.model("Course", courseSchema);

module.exports = { Admin, User, Course };
