import React, { useState, useContext } from 'react'; // Import useState and useContext
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { AuthContext } from '../context/AuthContext'; // Import AuthContext

const Auth = () => {
  const { login, signup } = useContext(AuthContext);
  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignup && password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      if (isSignup) {
        await signup(fullName, email, password, phoneNumber);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Auth error:', error.message, error.response?.data);
      alert(error.response?.data?.msg || 'Authentication failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2>{isSignup ? 'Sign Up' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        {isSignup && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                required={isSignup}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Phone Number (Optional)</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Phone Number"
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
          </>
        )}
        <div style={{ marginBottom: '15px' }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        {isSignup && (
          <div style={{ marginBottom: '15px' }}>
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required={isSignup}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
        )}
        <button type="submit" style={{ padding: '10px', background: '#007BFF', color: '#fff', border: 'none', width: '100%' }}>
          {isSignup ? 'Sign Up' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsSignup(!isSignup)}
          style={{ background: 'none', border: 'none', color: '#007BFF', cursor: 'pointer' }}
        >
          {isSignup ? 'Login' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
};

export default Auth;