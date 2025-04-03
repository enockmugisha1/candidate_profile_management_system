const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Middleware to authenticate JWT token
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// POST: Create profile
router.post('/profile', authenticate, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'certificates', maxCount: 10 },
]), async (req, res) => {
  try {
    console.log('Received profile creation request - req.body:', req.body);
    console.log('Uploaded files:', req.files);

    if (!req.body) {
      return res.status(400).json({ msg: 'Request body is missing or not properly parsed' });
    }

    const {
      fullName = '',
      email = '',
      phoneNumber = '',
      dob = '',
      nationality = '',
      gender = '',
      address = '',
      jobTitle = '',
      experience = '',
      skills = '',
      linkedin = '',
      education = '',
      workHistory = '',
    } = req.body;

    // Validate required fields
    if (!fullName) return res.status(400).json({ msg: 'Full Name is required' });
    if (!email) return res.status(400).json({ msg: 'Email is required' });
    if (!jobTitle) return res.status(400).json({ msg: 'Job Title is required' });

    const parsedAddress = address ? JSON.parse(address) : { city: '', country: '' };
    const parsedEducation = education ? JSON.parse(education) : { degree: '', institution: '', year: undefined, certificates: [] };
    const parsedWorkHistory = workHistory ? JSON.parse(workHistory) : [];
    const parsedSkills = skills ? JSON.parse(skills) : [];

    // Construct jobPreferences from FormData keys
    const parsedJobPreferences = {
      title: req.body['jobPreferences[title]'] || '',
      type: req.body['jobPreferences[type]'] || undefined, // Set to undefined if empty to avoid invalid enum
      salary: req.body['jobPreferences[salary]'] ? Number(req.body['jobPreferences[salary]']) : undefined,
      currency: req.body['jobPreferences[currency]'] || 'USD',
      location: req.body['jobPreferences[location]'] || '',
    };

    // Validate jobPreferences.type
    const validTypes = ['On-site', 'Remote', 'Hybrid'];
    if (parsedJobPreferences.type && !validTypes.includes(parsedJobPreferences.type)) {
      return res.status(400).json({ msg: `Invalid jobPreferences.type value: ${parsedJobPreferences.type}. Must be one of ${validTypes.join(', ')}` });
    }

    const resumePath = req.files && req.files.resume ? `/uploads/${req.files.resume[0].filename}` : req.body.resume;

    const certificates = [];
    if (req.files && req.files.certificates) {
      req.files.certificates.forEach((file, index) => {
        certificates.push({
          name: req.body[`certificateNames[${index}]`] || `Certificate ${index + 1}`,
          file: `/uploads/${file.filename}`,
        });
      });
    } else if (parsedEducation.certificates) {
      certificates.push(...parsedEducation.certificates);
    }

    const newProfile = {
      user: req.userId,
      fullName,
      email,
      phoneNumber,
      dob: dob ? (isNaN(new Date(dob).getTime()) ? undefined : new Date(dob)) : undefined,
      nationality,
      gender,
      address: parsedAddress,
      jobTitle,
      experience: experience ? Number(experience) : undefined,
      skills: parsedSkills,
      resume: resumePath || '',
      linkedin,
      education: {
        degree: parsedEducation.degree || '',
        institution: parsedEducation.institution || '',
        year: parsedEducation.year ? Number(parsedEducation.year) : undefined,
        certificates,
      },
      workHistory: parsedWorkHistory,
      jobPreferences: parsedJobPreferences,
    };

    const profile = new Profile(newProfile);
    await profile.save();
    console.log('Profile created:', profile);
    res.status(201).json(profile);
  } catch (err) {
    console.error('Profile creation error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// PUT: Update profile
router.put('/profile', authenticate, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'certificates', maxCount: 10 },
]), async (req, res) => {
  try {
    console.log('Received profile update request - req.body:', req.body);
    console.log('Uploaded files:', req.files);

    if (!req.body) {
      return res.status(400).json({ msg: 'Request body is missing or not properly parsed' });
    }

    const {
      fullName = '',
      email = '',
      phoneNumber = '',
      dob = '',
      nationality = '',
      gender = '',
      address = '',
      jobTitle = '',
      experience = '',
      skills = '',
      linkedin = '',
      education = '',
      workHistory = '',
    } = req.body;

    if (!fullName) return res.status(400).json({ msg: 'Full Name is required' });
    if (!email) return res.status(400).json({ msg: 'Email is required' });
    if (!jobTitle) return res.status(400).json({ msg: 'Job Title is required' });

    const parsedAddress = address ? JSON.parse(address) : { city: '', country: '' };
    const parsedEducation = education ? JSON.parse(education) : { degree: '', institution: '', year: undefined, certificates: [] };
    const parsedWorkHistory = workHistory ? JSON.parse(workHistory) : [];
    const parsedSkills = skills ? JSON.parse(skills) : [];

    const parsedJobPreferences = {
      title: req.body['jobPreferences[title]'] || '',
      type: req.body['jobPreferences[type]'] || undefined,
      salary: req.body['jobPreferences[salary]'] ? Number(req.body['jobPreferences[salary]']) : undefined,
      currency: req.body['jobPreferences[currency]'] || 'USD',
      location: req.body['jobPreferences[location]'] || '',
    };

    const validTypes = ['On-site', 'Remote', 'Hybrid'];
    if (parsedJobPreferences.type && !validTypes.includes(parsedJobPreferences.type)) {
      return res.status(400).json({ msg: `Invalid jobPreferences.type value: ${parsedJobPreferences.type}. Must be one of ${validTypes.join(', ')}` });
    }

    const resumePath = req.files && req.files.resume ? `/uploads/${req.files.resume[0].filename}` : req.body.resume;

    const certificates = [];
    if (req.files && req.files.certificates) {
      req.files.certificates.forEach((file, index) => {
        certificates.push({
          name: req.body[`certificateNames[${index}]`] || `Certificate ${index + 1}`,
          file: `/uploads/${file.filename}`,
        });
      });
    } else if (parsedEducation.certificates) {
      certificates.push(...parsedEducation.certificates);
    }

    const updatedProfile = {
      fullName,
      email,
      phoneNumber,
      dob: dob ? (isNaN(new Date(dob).getTime()) ? undefined : new Date(dob)) : undefined,
      nationality,
      gender,
      address: parsedAddress,
      jobTitle,
      experience: experience ? Number(experience) : undefined,
      skills: parsedSkills,
      resume: resumePath || '',
      linkedin,
      education: {
        degree: parsedEducation.degree || '',
        institution: parsedEducation.institution || '',
        year: parsedEducation.year ? Number(parsedEducation.year) : undefined,
        certificates,
      },
      workHistory: parsedWorkHistory,
      jobPreferences: parsedJobPreferences,
    };

    const profile = await Profile.findOneAndUpdate(
      { user: req.userId },
      updatedProfile,
      { new: true, upsert: true }
    );
    console.log('Updated profile:', profile);
    res.json(profile);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// GET: Fetch profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.userId });
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;