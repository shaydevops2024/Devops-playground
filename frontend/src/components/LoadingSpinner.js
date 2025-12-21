import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>{message}</p>
    </div>
  );
};

export default LoadingSpinner;
