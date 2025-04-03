import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ProfileContext } from '../context/ProfileContext';
import axios from 'axios';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { profile: initialProfile, setProfile, loading } = useContext(ProfileContext);
  const [editMode, setEditMode] = useState(false);
  const [profile, setLocalProfile] = useState(initialProfile || {
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
    resume: '',
    linkedin: '',
    education: { degree: '', institution: '', year: '', certificates: [] },
    workHistory: [],
    jobPreferences: { title: '', type: '', salary: '', currency: 'USD', location: '' },
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [certificateFiles, setCertificateFiles] = useState([]);
  const [certificateNames, setCertificateNames] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // Add state for error messages
  const navigate = useNavigate();

  // Sync local profile state with context profile
  useEffect(() => {
    if (initialProfile) {
      setLocalProfile(initialProfile);
    }
  }, [initialProfile]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Set edit mode if no profile exists
  useEffect(() => {
    if (!initialProfile && !loading) {
      setEditMode(true);
    }
  }, [initialProfile, loading]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(''); // Clear previous error messages
    try {
      // Basic validation
      if (!profile.fullName) {
        setErrorMessage('Full Name is required');
        setIsSubmitting(false);
        return;
      }
      if (!profile.email) {
        setErrorMessage('Email is required');
        setIsSubmitting(false);
        return;
      }
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email)) {
        setErrorMessage('Please enter a valid email address');
        setIsSubmitting(false);
        return;
      }
      if (!profile.jobTitle) {
        setErrorMessage('Job Title is required');
        setIsSubmitting(false);
        return;
      }
      if (profile.dob) {
        const dobDate = new Date(profile.dob);
        if (isNaN(dobDate.getTime())) {
          setErrorMessage('Invalid date of birth');
          setIsSubmitting(false);
          return;
        }
      }
      if (profile.experience && isNaN(Number(profile.experience))) {
        setErrorMessage('Experience must be a number');
        setIsSubmitting(false);
        return;
      }

      // Prepare FormData for multipart/form-data request
      const formData = new FormData();
      
      // Add text fields
      formData.append('fullName', profile.fullName || '');
      formData.append('email', profile.email || '');
      formData.append('phoneNumber', profile.phoneNumber || '');
      formData.append('dob', profile.dob || '');
      formData.append('nationality', profile.nationality || '');
      formData.append('gender', profile.gender || '');
      formData.append('address', JSON.stringify(profile.address || { city: '', country: '' }));
      formData.append('jobTitle', profile.jobTitle || '');
      formData.append('experience', profile.experience || '');
      formData.append('skills', JSON.stringify(profile.skills || []));
      formData.append('resume', profile.resume || '');
      formData.append('linkedin', profile.linkedin || '');
      formData.append('education', JSON.stringify({
        degree: profile.education?.degree || '',
        institution: profile.education?.institution || '',
        year: profile.education?.year || '',
        certificates: profile.education?.certificates || [],
      }));
      formData.append('workHistory', JSON.stringify(profile.workHistory || []));

      // Add jobPreferences subfields individually
      formData.append('jobPreferences[title]', profile.jobPreferences?.title || '');
      formData.append('jobPreferences[type]', profile.jobPreferences?.type || '');
      formData.append('jobPreferences[salary]', profile.jobPreferences?.salary || '');
      formData.append('jobPreferences[currency]', profile.jobPreferences?.currency || 'USD');
      formData.append('jobPreferences[location]', profile.jobPreferences?.location || '');

      // Add resume file if selected
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      // Add certificate files and names
      const validCertificateFiles = certificateFiles.filter(file => file != null);
      validCertificateFiles.forEach((file, index) => {
        formData.append('certificates', file);
        formData.append(`certificateNames[${index}]`, certificateNames[index] || `Certificate ${index + 1}`);
      });

      // Log FormData entries for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`FormData entry: ${key} = ${value}`);
      }

      console.log('Sending request with FormData');
      const method = initialProfile?._id ? 'put' : 'post';
      const url = 'http://localhost:5000/api/candidate/profile';
      const { data } = await axios[method](url, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Response:', data);
      setProfile(data);
      setLocalProfile(data);
      setEditMode(false);
      setResumeFile(null);
      setCertificateFiles([]);
      setCertificateNames([]);
    } catch (error) {
      console.error('Request error:', error.message, error.response?.data);
      if (error.response?.status === 401) {
        setErrorMessage('Session expired. Please log in again.');
        localStorage.removeItem('token');
        logout();
        navigate('/login');
      } else if (error.message === 'Network Error') {
        setErrorMessage('Unable to connect to the server. Please check your network connection or ensure the server is running.');
      } else {
        setErrorMessage(error.response?.data?.msg || 'Failed to save profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalProfile(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNestedChange = (e, field, subField) => {
    const { value } = e.target;
    setLocalProfile(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [subField]: value,
      },
    }));
  };

  const handleArrayChange = (e, field) => {
    const { value } = e.target;
    setLocalProfile(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(item => item),
    }));
  };

  const handleWorkHistoryChange = (index, subField, value) => {
    setLocalProfile(prev => {
      const updatedWorkHistory = [...(prev.workHistory || [])];
      updatedWorkHistory[index] = {
        ...updatedWorkHistory[index],
        [subField]: value,
      };
      return {
        ...prev,
        workHistory: updatedWorkHistory,
      };
    });
  };

  const addWorkHistory = () => {
    setLocalProfile(prev => ({
      ...prev,
      workHistory: [...(prev.workHistory || []), { company: '', jobTitle: '', duration: '', achievements: '' }],
    }));
  };

  const handleResumeChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleCertificateChange = (e, index) => {
    const newCertificateFiles = [...certificateFiles];
    newCertificateFiles[index] = e.target.files[0];
    setCertificateFiles(newCertificateFiles);
  };

  const handleCertificateNameChange = (index, value) => {
    const newCertificateNames = [...certificateNames];
    newCertificateNames[index] = value;
    setCertificateNames(newCertificateNames);
  };

  const addCertificate = () => {
    setCertificateFiles(prev => [...prev, null]);
    setCertificateNames(prev => [...prev, '']);
  };

  const handleCancel = () => {
    setLocalProfile(initialProfile || {
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
      resume: '',
      linkedin: '',
      education: { degree: '', institution: '', year: '', certificates: [] },
      workHistory: [],
      jobPreferences: { title: '', type: '', salary: '', currency: 'USD', location: '' },
    });
    setEditMode(false);
    setResumeFile(null);
    setCertificateFiles([]);
    setCertificateNames([]);
    setErrorMessage('');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Dashboard</h2>
      <p>Welcome, {user?.fullName || 'User'}!</p>
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        style={{ padding: '10px', background: '#dc3545', color: '#fff', border: 'none', marginBottom: '20px' }}
      >
        Logout
      </button>

      {editMode ? (
        <form onSubmit={handleUpdate}>
          <h3>{initialProfile?._id ? 'Edit Profile' : 'Create Profile'}</h3>
          {errorMessage && (
            <div style={{ color: 'red', marginBottom: '10px' }}>
              {errorMessage}
            </div>
          )}

          {/* Personal Information */}
          <h4>Personal Information</h4>
          <input
            name="fullName"
            value={profile.fullName || ''}
            onChange={handleChange}
            placeholder="Full Name"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />
          <input
            name="email"
            value={profile.email || ''}
            onChange={handleChange}
            placeholder="Email"
            type="email"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />
          <input
            name="phoneNumber"
            value={profile.phoneNumber || ''}
            onChange={handleChange}
            placeholder="Phone Number"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />
          <input
            name="dob"
            value={profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : ''}
            onChange={handleChange}
            placeholder="Date of Birth (YYYY-MM-DD)"
            type="date"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />
          <input
            name="nationality"
            value={profile.nationality || ''}
            onChange={handleChange}
            placeholder="Nationality"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />
          <select
            name="gender"
            value={profile.gender || ''}
            onChange={handleChange}
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <input
            name="city"
            value={profile.address?.city || ''}
            onChange={(e) => handleNestedChange(e, 'address', 'city')}
            placeholder="City"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />
          <input
            name="country"
            value={profile.address?.country || ''}
            onChange={(e) => handleNestedChange(e, 'address', 'country')}
            placeholder="Country"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />

          {/* Professional Information */}
          <h4>Professional Information</h4>
          <input
            name="jobTitle"
            value={profile.jobTitle || ''}
            onChange={handleChange}
            placeholder="Job Title"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />
          <input
            name="experience"
            value={profile.experience || ''}
            onChange={handleChange}
            placeholder="Experience (years)"
            type="number"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />
          <input
            name="skills"
            value={profile.skills?.join(', ') || ''}
            onChange={(e) => handleArrayChange(e, 'skills')}
            placeholder="Skills (comma-separated)"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />
          <input
            type="file"
            onChange={handleResumeChange}
            accept=".pdf,.doc,.docx"
            style={{ display: 'block', margin: '10px 0' }}
            disabled={isSubmitting}
          />
          {profile.resume && (
            <p>Current Resume: <a href={profile.resume} target="_blank" rel="noopener noreferrer">View</a></p>
          )}
          <input
            name="linkedin"
            value={profile.linkedin || ''}
            onChange={handleChange}
            placeholder="LinkedIn URL"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />

          {/* Education */}
          <h4>Education</h4>
          <input
            name="degree"
            value={profile.education?.degree || ''}
            onChange={(e) => handleNestedChange(e, 'education', 'degree')}
            placeholder="Degree"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />
          <input
            name="institution"
            value={profile.education?.institution || ''}
            onChange={(e) => handleNestedChange(e, 'education', 'institution')}
            placeholder="Institution"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />
          <input
            name="year"
            value={profile.education?.year || ''}
            onChange={(e) => handleNestedChange(e, 'education', 'year')}
            placeholder="Year"
            type="number"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />
          {certificateFiles.map((file, index) => (
            <div key={index}>
              <input
                type="file"
                onChange={(e) => handleCertificateChange(e, index)}
                accept=".pdf,.doc,.docx"
                style={{ display: 'block', margin: '10px 0' }}
                disabled={isSubmitting}
              />
              <input
                value={certificateNames[index] || ''}
                onChange={(e) => handleCertificateNameChange(index, e.target.value)}
                placeholder={`Certificate ${index + 1} Name`}
                style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
                disabled={isSubmitting}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addCertificate}
            style={{ padding: '10px', background: '#28a745', color: '#fff', border: 'none', margin: '10px 0' }}
            disabled={isSubmitting}
          >
            Add Certificate
          </button>

          {/* Work History */}
          <h4>Work History</h4>
          {(profile.workHistory || []).map((work, index) => (
            <div key={index} style={{ marginBottom: '20px' }}>
              <input
                value={work.company || ''}
                onChange={(e) => handleWorkHistoryChange(index, 'company', e.target.value)}
                placeholder="Company"
                style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
                disabled={isSubmitting}
              />
              <input
                value={work.jobTitle || ''}
                onChange={(e) => handleWorkHistoryChange(index, 'jobTitle', e.target.value)}
                placeholder="Job Title"
                style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
                disabled={isSubmitting}
              />
              <input
                value={work.duration || ''}
                onChange={(e) => handleWorkHistoryChange(index, 'duration', e.target.value)}
                placeholder="Duration (e.g., 2019-2021)"
                style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
                disabled={isSubmitting}
              />
              <input
                value={work.achievements || ''}
                onChange={(e) => handleWorkHistoryChange(index, 'achievements', e.target.value)}
                placeholder="Achievements"
                style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
                disabled={isSubmitting}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addWorkHistory}
            style={{ padding: '10px', background: '#28a745', color: '#fff', border: 'none', margin: '10px 0' }}
            disabled={isSubmitting}
          >
            Add Work History
          </button>

          {/* Job Preferences */}
          <h4>Job Preferences</h4>
          <input
            name="title"
            value={profile.jobPreferences?.title || ''}
            onChange={(e) => handleNestedChange(e, 'jobPreferences', 'title')}
            placeholder="Job Title"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />
          <select
            name="type"
            value={profile.jobPreferences?.type || ''}
            onChange={(e) => handleNestedChange(e, 'jobPreferences', 'type')}
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          >
            <option value="">Select Job Type</option>
            <option value="On-site">On-site</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
          </select>
          <input
            name="salary"
            value={profile.jobPreferences?.salary || ''}
            onChange={(e) => handleNestedChange(e, 'jobPreferences', 'salary')}
            placeholder="Expected Salary"
            type="number"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />
          <select
            name="currency"
            value={profile.jobPreferences?.currency || 'USD'}
            onChange={(e) => handleNestedChange(e, 'jobPreferences', 'currency')}
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="RWF">RWF</option>
          </select>
          <input
            name="location"
            value={profile.jobPreferences?.location || ''}
            onChange={(e) => handleNestedChange(e, 'jobPreferences', 'location')}
            placeholder="Preferred Location"
            style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
            disabled={isSubmitting}
          />

          <button
            type="submit"
            style={{ padding: '10px', background: '#007BFF', color: '#fff', border: 'none', width: '100%', marginTop: '20px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            style={{ padding: '10px', background: '#6c757d', color: '#fff', border: 'none', width: '100%', marginTop: '10px' }}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </form>
      ) : (
        <div>
          <h3>Your Profile</h3>
          {initialProfile ? (
            <>
              <h4>Personal Information</h4>
              <p><strong>Full Name:</strong> {initialProfile.fullName}</p>
              <p><strong>Email:</strong> {initialProfile.email}</p>
              <p><strong>Phone Number:</strong> {initialProfile.phoneNumber || 'N/A'}</p>
              <p><strong>Date of Birth:</strong> {initialProfile.dob ? new Date(initialProfile.dob).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Nationality:</strong> {initialProfile.nationality || 'N/A'}</p>
              <p><strong>Gender:</strong> {initialProfile.gender || 'N/A'}</p>
              <p><strong>Address:</strong> {initialProfile.address?.city && initialProfile.address?.country ? `${initialProfile.address.city}, ${initialProfile.address.country}` : 'N/A'}</p>

              <h4>Professional Information</h4>
              <p><strong>Job Title:</strong> {initialProfile.jobTitle}</p>
              <p><strong>Experience:</strong> {initialProfile.experience ? `${initialProfile.experience} years` : 'N/A'}</p>
              <p><strong>Skills:</strong> {initialProfile.skills?.length > 0 ? initialProfile.skills.join(', ') : 'N/A'}</p>
              <p><strong>Resume:</strong> {initialProfile.resume ? <a href={initialProfile.resume} target="_blank" rel="noopener noreferrer">View Resume</a> : 'N/A'}</p>
              <p><strong>LinkedIn:</strong> {initialProfile.linkedin ? <a href={initialProfile.linkedin} target="_blank" rel="noopener noreferrer">View LinkedIn</a> : 'N/A'}</p>

              <h4>Education</h4>
              <p><strong>Degree:</strong> {initialProfile.education?.degree || 'N/A'}</p>
              <p><strong>Institution:</strong> {initialProfile.education?.institution || 'N/A'}</p>
              <p><strong>Year:</strong> {initialProfile.education?.year || 'N/A'}</p>
              <p><strong>Certificates:</strong></p>
              {initialProfile.education?.certificates?.length > 0 ? (
                <ul>
                  {initialProfile.education.certificates.map((cert, index) => (
                    <li key={index}>
                      {cert.name}: <a href={cert.file} target="_blank" rel="noopener noreferrer">View Certificate</a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>N/A</p>
              )}

              <h4>Work History</h4>
              {initialProfile.workHistory?.length > 0 ? (
                <ul>
                  {initialProfile.workHistory.map((work, index) => (
                    <li key={index}>
                      <strong>{work.jobTitle}</strong> at {work.company} ({work.duration})<br />
                      Achievements: {work.achievements}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>N/A</p>
              )}

              <h4>Job Preferences</h4>
              <p><strong>Title:</strong> {initialProfile.jobPreferences?.title || 'N/A'}</p>
              <p><strong>Type:</strong> {initialProfile.jobPreferences?.type || 'N/A'}</p>
              <p><strong>Salary:</strong> {initialProfile.jobPreferences?.salary ? `${initialProfile.jobPreferences.salary} ${initialProfile.jobPreferences.currency}` : 'N/A'}</p>
              <p><strong>Location:</strong> {initialProfile.jobPreferences?.location || 'N/A'}</p>
            </>
          ) : (
            <p>No profile found. Please create your profile.</p>
          )}
          <button
            onClick={() => setEditMode(true)}
            style={{ padding: '10px', background: '#007BFF', color: '#fff', border: 'none', marginTop: '20px' }}
          >
            {initialProfile ? 'Edit Profile' : 'Create Profile'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;