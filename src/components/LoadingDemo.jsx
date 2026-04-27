import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingDemo = () => {
  return (
    <div style={{ 
      padding: '40px', 
      background: '#f8f9fa',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '40px'
    }}>
      <h1 style={{ 
        fontSize: '32px', 
        fontWeight: 'bold', 
        color: '#1a1a1a',
        marginBottom: '20px'
      }}>
        Loading Animation Demo
      </h1>
      
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Medium Size (Default)</h3>
        <LoadingSpinner />
      </div>
      
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Small Size</h3>
        <LoadingSpinner size="small" />
      </div>
      
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Large Size</h3>
        <LoadingSpinner size="large" />
      </div>
      
      <div style={{ 
        background: '#2d3748', 
        padding: '40px', 
        borderRadius: '16px',
        color: 'white'
      }}>
        <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>On Dark Background</h3>
        <LoadingSpinner />
      </div>
    </div>
  );
};

export default LoadingDemo;