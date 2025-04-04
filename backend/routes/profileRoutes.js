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

// POST: Create profile (existing route)
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

    console.log('New profile object:', newProfile);

    const profile = new Profile(newProfile);
    profile.markModified('jobPreferences');
    console.log('Saving profile to database...');
    const savedProfile = await profile.save();
    console.log('Profile saved successfully:', savedProfile);
    res.status(201).json(savedProfile);
  } catch (err) {
    console.error('Profile creation error:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// GET: Fetch the current user's profile (existing route)
router.get('/profile', authenticate, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.userId });
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error('Fetch profile error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// NEW: GET: Fetch matching profiles
router.get('/matches', authenticate, async (req, res) => {
  try {
    // Fetch the current user's profile
    const userProfile = await Profile.findOne({ user: req.userId });
    if (!userProfile) {
      return res.status(404).json({ msg: 'Profile not found. Please create a profile first.' });
    }

    // Define matching criteria
    const { skills, jobPreferences, experience } = userProfile;
    const matchCriteria = {
      user: { $ne: req.userId }, // Exclude the current user's profile
      $or: [
        { skills: { $in: skills } }, // Match profiles with at least one overlapping skill
        { 'jobPreferences.type': jobPreferences.type }, // Match profiles with the same job type (e.g., Remote)
      ],
    };

    // If experience is defined, add a range for matching (e.g., within ±2 years)
    if (experience) {
      matchCriteria.experience = {
        $gte: experience - 2,
        $lte: experience + 2,
      };
    }

    // Fetch matching profiles
    const matches = await Profile.find(matchCriteria)
      .select('fullName email jobTitle skills experience jobPreferences') // Select only relevant fields
      .limit(10); // Limit to 10 matches for performance

    // Calculate a match score for sorting (optional)
    const scoredMatches = matches.map(match => {
      let score = 0;
      // Add points for each overlapping skill
      const commonSkills = match.skills.filter(skill => skills.includes(skill));
      score += commonSkills.length * 10;
      // Add points if jobPreferences.type matches
      if (match.jobPreferences.type === jobPreferences.type) {
        score += 20;
      }
      // Add points based on experience similarity
      if (match.experience && experience) {
        const experienceDiff = Math.abs(match.experience - experience);
        score += (5 - experienceDiff) * 5; // Closer experience levels get higher scores
      }
      return { ...match._doc, matchScore: score };
    });

    // Sort matches by score (highest to lowest)
    scoredMatches.sort((a, b) => b.matchScore - a.matchScore);

    res.json(scoredMatches);
  } catch (err) {
    console.error('Fetch matches error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;