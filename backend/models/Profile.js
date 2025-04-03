const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
  },
  dob: {
    type: Date,
  },
  nationality: {
    type: String,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
  address: {
    city: { type: String },
    country: { type: String },
  },
  jobTitle: {
    type: String,
    required: true,
  },
  experience: {
    type: Number,
  },
  skills: {
    type: [String],
    default: [],
  },
  resume: {
    type: String,
  },
  linkedin: {
    type: String,
  },
  education: {
    degree: { type: String },
    institution: { type: String },
    year: { type: Number },
    certificates: [
      {
        name: { type: String },
        file: { type: String },
      },
    ],
  },
  workHistory: [
    {
      company: { type: String },
      jobTitle: { type: String },
      duration: { type: String },
      achievements: { type: String },
    },
  ],
  jobPreferences: {
    title: { type: String },
    type: { type: String, enum: ['On-site', 'Remote', 'Hybrid'] }, // Optional, but must be one of these values if provided
    salary: { type: Number },
    currency: { type: String, default: 'USD' },
    location: { type: String },
  },
});

module.exports = mongoose.model('Profile', ProfileSchema);