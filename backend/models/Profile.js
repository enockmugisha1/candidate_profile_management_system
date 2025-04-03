const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: String,
  email: String,
  phoneNumber: String,
  dob: Date,
  nationality: String,
  gender: String,
  address: { city: String, country: String },
  jobTitle: String,
  experience: Number,
  skills: [String],
  resume: String,
  linkedin: String,
  education: { degree: String, institution: String, year: Number },
  workHistory: [{ company: String, jobTitle: String, duration: String, achievements: String }],
  jobPreferences: {
    title: String,
    type: String,
    salary: Number,
    currency: String,
    location: String,
  },
});

module.exports = mongoose.model('Profile', profileSchema);