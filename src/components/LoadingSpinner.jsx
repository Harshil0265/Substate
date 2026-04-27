import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium' }) => {
  return (
    <div className={`loading-spinner ${size}`}>
      <div className="chart-container">
        <div className="chart-bar bar-1"></div>
        <div className="chart-bar bar-2"></div>
        <div className="chart-bar bar-3"></div>
        <div className="chart-bar bar-4"></div>
        <div className="chart-bar bar-5"></div>
        <div className="bouncing-ball"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;