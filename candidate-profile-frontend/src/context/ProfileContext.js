import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/candidate/profile');
        setProfile(data);
      } catch (error) {
        console.error(error.response?.data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
};