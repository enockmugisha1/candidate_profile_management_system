import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ProfileContext } from '../context/ProfileContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, loading, logout } = useContext(AuthContext);
  const { profile, setProfile } = useContext(ProfileContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dob: '',
    nationality: '',
    gender: '',
    address: { city: '', country: '' },
    jobTitle: '',
    experience: '',
    skills: [],
    resume: null,
    linkedin: '',
    education: { degree: '', institution: '', year: '', certificates: [] },
    workHistory: [],
    jobPreferences: { title: '', type: '', salary: '', currency: 'USD', location: '' },
  });
  const [error, setError] = useState('');
  const [matches, setMatches] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      console.log('User not logged in, redirecting to login');
      navigate('/login');
    }

    if (profile) {
      setFormData(profile);
      fetchMatches();
      setShowForm(false);
    } else {
      setShowForm(false);
    }
  }, [user, loading, profile, navigate]);

  const fetchMatches = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/candidate/matches', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Matching profiles:', response.data);
      setMatches(response.data);
    } catch (error) {
      console.error('Fetch matches error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.log('Unauthorized, logging out and redirecting to login');
        logout();
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim());
    setFormData((prev) => ({
      ...prev,
      skills,
    }));
  };

  const handleWorkHistoryChange = (index, field, value) => {
    const updatedWorkHistory = [...formData.workHistory];
    updatedWorkHistory[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      workHistory: updatedWorkHistory,
    }));
  };

  const addWorkHistory = () => {
    setFormData((prev) => ({
      ...prev,
      workHistory: [...prev.workHistory, { company: '', jobTitle: '', duration: '', achievements: '' }],
    }));
  };

  const handleCertificateChange = (index, field, value) => {
    const updatedCertificates = [...formData.education.certificates];
    updatedCertificates[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      education: {
        ...prev.education,
        certificates: updatedCertificates,
      },
    }));
  };

  const addCertificate = () => {
    setFormData((prev) => ({
      ...prev,
      education: {
        ...prev.education,
        certificates: [...prev.education.certificates, { name: '', file: null }],
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === 'address' || key === 'education' || key === 'workHistory' || key === 'jobPreferences' || key === 'skills') {
        data.append(key, JSON.stringify(formData[key]));
      } else if (key === 'resume') {
        if (formData.resume instanceof File) {
          data.append(key, formData.resume);
        }
      } else {
        data.append(key, formData[key]);
      }
    });

    // Append certificates as separate fields
    formData.education.certificates.forEach((cert, index) => {
      if (cert.file instanceof File) {
        data.append(`certificates`, cert.file);
        data.append(`certificateNames[${index}]`, cert.name || `Certificate ${index + 1}`);
      }
    });

    for (let pair of data.entries()) {
      console.log(`FormData entry: ${pair[0]} = ${pair[1]}`);
    }

    try {
      console.log('Sending request with FormData');
      const response = await axios.post('http://localhost:5000/api/candidate/profile', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Response:', response.data);
      setProfile(response.data);
      setError('');
      fetchMatches();
      setShowForm(false);
    } catch (error) {
      console.error('Profile submission error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.log('Unauthorized, logging out and redirecting to login');
        logout();
      } else {
        setError(error.response?.data?.msg || 'Failed to save profile. Please try again.');
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Your Dashboard</h2>
        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>

      {profile ? (
        <>
          <div className="profile-preview">
            <h3>Your Profile</h3>
            <div className="profile-details">
              <p><strong>Full Name:</strong> {profile.fullName}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Phone Number:</strong> {profile.phoneNumber}</p>
              <p><strong>Date of Birth:</strong> {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Nationality:</strong> {profile.nationality}</p>
              <p><strong>Gender:</strong> {profile.gender}</p>
              <p><strong>Address:</strong> {profile.address.city}, {profile.address.country}</p>
              <p><strong>Job Title:</strong> {profile.jobTitle}</p>
              <p><strong>Experience:</strong> {profile.experience} years</p>
              <p><strong>Skills:</strong> {profile.skills.join(', ')}</p>
              {profile.resume && (
                <p>
                  <strong>Resume:</strong> <a href={profile.resume} target="_blank" rel="noopener noreferrer">View Resume</a>
                </p>
              )}
              <p><strong>LinkedIn:</strong> <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">{profile.linkedin}</a></p>
              <p><strong>Education:</strong> {profile.education.degree}, {profile.education.institution}, {profile.education.year}</p>
              {profile.education.certificates && profile.education.certificates.length > 0 && (
                <>
                  <h4>Certificates:</h4>
                  {profile.education.certificates.map((cert, index) => (
                    <div key={index} className="certificate-preview">
                      <p><strong>Name:</strong> {cert.name}</p>
                      {cert.file && (
                        <p>
                          <strong>File:</strong> <a href={cert.file} target="_blank" rel="noopener noreferrer">View Certificate</a>
                        </p>
                      )}
                    </div>
                  ))}
                </>
              )}
              <h4>Work History:</h4>
              {profile.workHistory.map((work, index) => (
                <div key={index} className="work-history-preview">
                  <p><strong>Company:</strong> {work.company}</p>
                  <p><strong>Job Title:</strong> {work.jobTitle}</p>
                  <p><strong>Duration:</strong> {work.duration}</p>
                  <p><strong>Achievements:</strong> {work.achievements}</p>
                </div>
              ))}
              <h4>Job Preferences:</h4>
              <p><strong>Preferred Job Title:</strong> {profile.jobPreferences.title}</p>
              <p><strong>Job Type:</strong> {profile.jobPreferences.type}</p>
              <p><strong>Expected Salary:</strong> {profile.jobPreferences.salary} {profile.jobPreferences.currency}</p>
              <p><strong>Preferred Location:</strong> {profile.jobPreferences.location}</p>
            </div>
            <button className="edit-profile-button" onClick={() => setShowForm(true)}>
              Edit Profile
            </button>
          </div>
        </>
      ) : (
        <div className="no-profile-message">
          <p>You don’t have a profile yet.</p>
          <button className="create-profile-button" onClick={() => setShowForm(true)}>
            Create Profile
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="profile-form">
          {error && <p className="error-message">{error}</p>}
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-group">
              <label>Full Name:</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number:</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Date of Birth:</label>
              <input
                type="date"
                name="dob"
                value={formData.dob ? formData.dob.split('T')[0] : ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Nationality:</label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Gender:</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>City:</label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Country:</label>
              <input
                type="text"
                value={formData.address.country}
                onChange={(e) => handleNestedChange('address', 'country', e.target.value)}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Professional Information</h3>
            <div className="form-group">
              <label>Job Title:</label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Experience (Years):</label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Skills (comma-separated):</label>
              <input
                type="text"
                value={formData.skills.join(', ')}
                onChange={handleSkillsChange}
              />
            </div>
            <div className="form-group">
              <label>Resume:</label>
              <input
                type="file"
                name="resume"
                onChange={(e) => setFormData((prev) => ({ ...prev, resume: e.target.files[0] }))}
              />
              {formData.resume && typeof formData.resume === 'string' && (
                <a href={formData.resume} target="_blank" rel="noopener noreferrer">
                  View Current Resume
                </a>
              )}
            </div>
            <div className="form-group">
              <label>LinkedIn Profile:</label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Education</h3>
            <div className="form-group">
              <label>Degree:</label>
              <input
                type="text"
                value={formData.education.degree}
                onChange={(e) => handleNestedChange('education', 'degree', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Institution:</label>
              <input
                type="text"
                value={formData.education.institution}
                onChange={(e) => handleNestedChange('education', 'institution', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Year:</label>
              <input
                type="number"
                value={formData.education.year}
                onChange={(e) => handleNestedChange('education', 'year', e.target.value)}
              />
            </div>
            <div className="form-group">
              <h4>Certificates</h4>
              {formData.education.certificates.map((cert, index) => (
                <div key={index} className="certificate-entry">
                  <div className="form-group">
                    <label>Certificate Name:</label>
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) => handleCertificateChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Certificate File:</label>
                    <input
                      type="file"
                      onChange={(e) => handleCertificateChange(index, 'file', e.target.files[0])}
                    />
                    {cert.file && typeof cert.file === 'string' && (
                      <a href={cert.file} target="_blank" rel="noopener noreferrer">
                        View Current Certificate
                      </a>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" className="add-button" onClick={addCertificate}>
                Add Certificate
              </button>
            </div>
          </div>

          <div className="form-section">
            <h3>Work History</h3>
            {formData.workHistory.map((work, index) => (
              <div key={index} className="work-history-entry">
                <div className="form-group">
                  <label>Company:</label>
                  <input
                    type="text"
                    value={work.company}
                    onChange={(e) => handleWorkHistoryChange(index, 'company', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Job Title:</label>
                  <input
                    type="text"
                    value={work.jobTitle}
                    onChange={(e) => handleWorkHistoryChange(index, 'jobTitle', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Duration:</label>
                  <input
                    type="text"
                    value={work.duration}
                    onChange={(e) => handleWorkHistoryChange(index, 'duration', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Achievements:</label>
                  <textarea
                    value={work.achievements}
                    onChange={(e) => handleWorkHistoryChange(index, 'achievements', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <button type="button" className="add-button" onClick={addWorkHistory}>
              Add Work History
            </button>
          </div>

          <div className="form-section">
            <h3>Job Preferences</h3>
            <div className="form-group">
              <label>Preferred Job Title:</label>
              <input
                type="text"
                name="jobPreferences[title]"
                value={formData.jobPreferences.title}
                onChange={(e) => handleNestedChange('jobPreferences', 'title', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Job Type:</label>
              <select
                name="jobPreferences[type]"
                value={formData.jobPreferences.type}
                onChange={(e) => handleNestedChange('jobPreferences', 'type', e.target.value)}
              >
                <option value="">Select Job Type</option>
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div className="form-group">
              <label>Expected Salary:</label>
              <input
                type="number"
                name="jobPreferences[salary]"
                value={formData.jobPreferences.salary}
                onChange={(e) => handleNestedChange('jobPreferences', 'salary', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Currency:</label>
              <select
                name="jobPreferences[currency]"
                value={formData.jobPreferences.currency}
                onChange={(e) => handleNestedChange('jobPreferences', 'currency', e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div className="form-group">
              <label>Preferred Location:</label>
              <input
                type="text"
                name="jobPreferences[location]"
                value={formData.jobPreferences.location}
                onChange={(e) => handleNestedChange('jobPreferences', 'location', e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">
              {profile ? 'Update Profile' : 'Create Profile'}
            </button>
            <button type="button" className="cancel-button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {matches.length > 0 && (
        <div className="matches-section">
          <h3>Matching Profiles</h3>
          <div className="matches-list">
            {matches.map((match, index) => (
              <div key={index} className="match-card">
                <h4>{match.fullName}</h4>
                <p><strong>Email:</strong> {match.email}</p>
                <p><strong>Job Title:</strong> {match.jobTitle}</p>
                <p><strong>Experience:</strong> {match.experience} years</p>
                <p><strong>Skills:</strong> {match.skills.join(', ')}</p>
                <p><strong>Job Type:</strong> {match.jobPreferences.type}</p>
                <p><strong>Match Score:</strong> {match.matchScore}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;