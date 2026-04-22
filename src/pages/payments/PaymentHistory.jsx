import React from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentManagement from '../../components/PaymentManagement';
import BackToHome from '../../components/BackToHome';
import '../../styles/payment-history-page.css';

const PaymentHistory = () => {
  const navigate = useNavigate();

  return (
    <div className="payment-history-page">
      <BackToHome />
      <div className="page-container">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>Payment History & Management</h1>
          <p className="page-description">
            View your payment history, retry failed payments, and manage refund requests
          </p>
        </div>
        <PaymentManagement />
      </div>
    </div>
  );
};

export default PaymentHistory;
