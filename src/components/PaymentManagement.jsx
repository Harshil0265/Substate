import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/payment-management.css';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [retryingPayment, setRetryingPayment] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const statusParam = filter !== 'all' ? `?status=${filter}` : '';
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/history${statusParam}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPayments(response.data.payments);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch payments');
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async (paymentId) => {
    try {
      setRetryingPayment(paymentId);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/retry/${paymentId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Initialize Razorpay payment
        const options = {
          key: response.data.keyId,
          amount: response.data.amount,
          currency: response.data.currency,
          name: 'SubState',
          description: `Retry: ${response.data.subscription.planName} Plan`,
          order_id: response.data.orderId,
          handler: async function (razorpayResponse) {
            try {
              // Verify payment
              await axios.post(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/verify-payment`,
                {
                  razorpay_order_id: razorpayResponse.razorpay_order_id,
                  razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                  razorpay_signature: razorpayResponse.razorpay_signature,
                  paymentId: response.data.paymentId
                },
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              alert('Payment successful! Your subscription has been activated.');
              fetchPayments();
            } catch (verifyError) {
              console.error('Payment verification failed:', verifyError);
              alert('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: response.data.user.name,
            email: response.data.user.email
          },
          theme: {
            color: '#6366f1'
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to retry payment');
      console.error('Error retrying payment:', err);
    } finally {
      setRetryingPayment(null);
    }
  };

  const handleRequestRefund = async () => {
    if (!refundReason.trim()) {
      alert('Please provide a reason for the refund');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/request-refund/${selectedPayment._id}`,
        { reason: refundReason },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Refund request submitted successfully!');
      setShowRefundModal(false);
      setRefundReason('');
      setSelectedPayment(null);
      fetchPayments();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to request refund');
      console.error('Error requesting refund:', err);
    }
  };

  const handleDownloadReceipt = async (paymentId, invoiceNumber) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/receipt/${paymentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob' // Important for PDF download
        }
      );

      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a link element and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceNumber || 'Invoice'}_SubState_Receipt.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to download receipt');
      console.error('Error downloading receipt:', err);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      COMPLETED: 'status-completed',
      PENDING: 'status-pending',
      FAILED: 'status-failed',
      REFUNDED: 'status-refunded',
      REFUND_REQUESTED: 'status-refund-requested'
    };

    const statusLabels = {
      COMPLETED: 'Completed',
      PENDING: 'Pending',
      FAILED: 'Failed',
      REFUNDED: 'Refunded',
      REFUND_REQUESTED: 'Refund Requested'
    };

    return (
      <span className={`status-badge ${statusClasses[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  const canRequestRefund = (payment) => {
    if (payment.status !== 'COMPLETED') return false;
    const daysSincePayment = Math.floor((Date.now() - new Date(payment.createdAt)) / (1000 * 60 * 60 * 24));
    return daysSincePayment <= 30;
  };

  if (loading) {
    return (
      <div className="payment-management">
        <div className="loading-spinner">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="payment-management">
      <div className="payment-header">
        <h2>Payment History</h2>
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'COMPLETED' ? 'active' : ''}
            onClick={() => setFilter('COMPLETED')}
          >
            Completed
          </button>
          <button
            className={filter === 'FAILED' ? 'active' : ''}
            onClick={() => setFilter('FAILED')}
          >
            Failed
          </button>
          <button
            className={filter === 'REFUND_REQUESTED' ? 'active' : ''}
            onClick={() => setFilter('REFUND_REQUESTED')}
          >
            Refund Requested
          </button>
          <button
            className={filter === 'REFUNDED' ? 'active' : ''}
            onClick={() => setFilter('REFUNDED')}
          >
            Refunded
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {payments.length === 0 ? (
        <div className="no-payments">
          <p>No payments found</p>
        </div>
      ) : (
        <div className="payments-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice #</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Transaction ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                  <td>
                    <code className="invoice-number">
                      {payment.invoiceNumber || `INV-${payment._id.slice(-8).toUpperCase()}`}
                    </code>
                  </td>
                  <td>{payment.planType}</td>
                  <td>₹{payment.amount}</td>
                  <td>{getStatusBadge(payment.status)}</td>
                  <td>
                    <code className="transaction-id">
                      {payment.transactionId || payment.razorpayOrderId || 'N/A'}
                    </code>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {(payment.status === 'COMPLETED' || payment.status === 'REFUNDED') && (
                        <button
                          className="btn-download"
                          onClick={() => handleDownloadReceipt(
                            payment._id, 
                            payment.invoiceNumber || `INV-${payment._id.slice(-8).toUpperCase()}`
                          )}
                          title="Download Receipt"
                        >
                          📄 Receipt
                        </button>
                      )}
                      {payment.status === 'FAILED' && (
                        <button
                          className="btn-retry"
                          onClick={() => handleRetryPayment(payment._id)}
                          disabled={retryingPayment === payment._id}
                        >
                          {retryingPayment === payment._id ? 'Processing...' : 'Retry'}
                        </button>
                      )}
                      {canRequestRefund(payment) && (
                        <button
                          className="btn-refund"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowRefundModal(true);
                          }}
                        >
                          Request Refund
                        </button>
                      )}
                      {payment.status === 'REFUND_REQUESTED' && (
                        <span className="refund-pending-text">Pending Review</span>
                      )}
                      {payment.status === 'REFUNDED' && payment.refundedAt && (
                        <span className="refund-date">
                          Refunded on {new Date(payment.refundedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showRefundModal && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Request Refund</h3>
            <p>
              Payment Amount: <strong>₹{selectedPayment?.amount}</strong>
            </p>
            <p>
              Plan: <strong>{selectedPayment?.planType}</strong>
            </p>
            <div className="form-group">
              <label>Reason for Refund:</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Please explain why you're requesting a refund..."
                rows="4"
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundReason('');
                  setSelectedPayment(null);
                }}
              >
                Cancel
              </button>
              <button className="btn-submit" onClick={handleRequestRefund}>
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
