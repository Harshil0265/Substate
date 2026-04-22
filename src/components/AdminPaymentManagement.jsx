import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/admin-payment-management.css';

const AdminPaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, failed, refunds, analytics
  const [filter, setFilter] = useState({ status: '', planType: '' });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAction, setRefundAction] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab, filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      if (activeTab === 'analytics') {
        const response = await axios.get(`${baseURL}/api/payments/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAnalytics(response.data);
      } else if (activeTab === 'refunds') {
        const response = await axios.get(`${baseURL}/api/payments/admin/refund-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRefundRequests(response.data.refundRequests);
      } else {
        const params = new URLSearchParams();
        if (filter.status) params.append('status', filter.status);
        if (filter.planType) params.append('planType', filter.planType);
        if (activeTab === 'failed') params.append('status', 'FAILED');

        const response = await axios.get(
          `${baseURL}/api/payments/admin/all?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setPayments(response.data.payments);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!refundAction) {
      alert('Please select an action (Approve or Reject)');
      return;
    }

    if (refundAction === 'approve' && !adminNotes.trim()) {
      alert('Please provide admin notes for the refund approval');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/admin/refund/${selectedPayment._id}`,
        {
          action: refundAction,
          adminNotes: adminNotes
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert(response.data.message);
      setShowRefundModal(false);
      setSelectedPayment(null);
      setRefundAction('');
      setAdminNotes('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process refund');
      console.error('Error processing refund:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadReceipt = async (paymentId, invoiceNumber) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/receipt/${paymentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceNumber || 'Invoice'}_SubState_Receipt.pdf`;
      document.body.appendChild(link);
      link.click();
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

  const renderAnalytics = () => {
    if (!analytics) return null;

    return (
      <div className="analytics-container">
        <div className="analytics-summary">
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p className="stat-value">₹{analytics.summary.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Total Payments</h3>
            <p className="stat-value">{analytics.summary.totalPayments}</p>
          </div>
          <div className="stat-card">
            <h3>Success Rate</h3>
            <p className="stat-value">{analytics.summary.successRate.toFixed(1)}%</p>
          </div>
          <div className="stat-card">
            <h3>Failed Payments</h3>
            <p className="stat-value">{analytics.summary.failedPayments}</p>
          </div>
          <div className="stat-card">
            <h3>Refunded</h3>
            <p className="stat-value">{analytics.summary.refundedPayments}</p>
          </div>
          <div className="stat-card">
            <h3>Churn Rate</h3>
            <p className="stat-value">{analytics.subscriptionMetrics.churnRate}%</p>
          </div>
        </div>

        <div className="analytics-charts">
          <div className="chart-section">
            <h3>Monthly Revenue Trend</h3>
            <div className="revenue-list">
              {analytics.monthlyRevenue.map((item, index) => (
                <div key={index} className="revenue-item">
                  <span className="month">{item.month}</span>
                  <span className="revenue">₹{item.revenue.toFixed(2)}</span>
                  <span className="transactions">{item.transactions} transactions</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-section">
            <h3>Plan Distribution</h3>
            <div className="plan-list">
              {analytics.planDistribution.map((item, index) => (
                <div key={index} className="plan-item">
                  <span className="plan-name">{item._id}</span>
                  <span className="plan-count">{item.count} subscriptions</span>
                  <span className="plan-revenue">₹{(item.revenue / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-section">
            <h3>Recent Failed Payments</h3>
            <div className="failed-payments-list">
              {analytics.failedPayments.map((payment) => (
                <div key={payment._id} className="failed-payment-item">
                  <div className="payment-user">
                    <strong>{payment.userId?.name}</strong>
                    <span>{payment.userId?.email}</span>
                  </div>
                  <div className="payment-details">
                    <span>₹{payment.amount}</span>
                    <span>{payment.planType}</span>
                    <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                  </div>
                  {payment.failureReason && (
                    <div className="failure-reason">{payment.failureReason}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPaymentsTable = (paymentsData) => {
    if (paymentsData.length === 0) {
      return <div className="no-data">No payments found</div>;
    }

    return (
      <div className="payments-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice #</th>
              <th>User</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Transaction ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paymentsData.map((payment) => (
              <tr key={payment._id}>
                <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                <td>
                  <code className="invoice-number">
                    {payment.invoiceNumber || `INV-${payment._id.slice(-8).toUpperCase()}`}
                  </code>
                </td>
                <td>
                  <div className="user-info">
                    <div>{payment.userId?.name || 'N/A'}</div>
                    <small>{payment.userId?.email || 'N/A'}</small>
                  </div>
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
                    {(payment.status === 'COMPLETED' || payment.status === 'REFUND_REQUESTED') && (
                      <button
                        className="btn-process-refund"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowRefundModal(true);
                        }}
                      >
                        Process Refund
                      </button>
                    )}
                    {payment.status === 'REFUNDED' && payment.refundedAt && (
                      <span className="refund-date">
                        Refunded: {new Date(payment.refundedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-payment-management">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-payment-management">
      <div className="admin-header">
        <h2>Payment Management</h2>
      </div>

      <div className="tabs">
        <button
          className={activeTab === 'all' ? 'active' : ''}
          onClick={() => setActiveTab('all')}
        >
          All Payments
        </button>
        <button
          className={activeTab === 'failed' ? 'active' : ''}
          onClick={() => setActiveTab('failed')}
        >
          Failed Payments
        </button>
        <button
          className={activeTab === 'refunds' ? 'active' : ''}
          onClick={() => setActiveTab('refunds')}
        >
          Refund Requests
          {refundRequests.length > 0 && (
            <span className="badge">{refundRequests.length}</span>
          )}
        </button>
        <button
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'all' && renderPaymentsTable(payments)}
      {activeTab === 'failed' && renderPaymentsTable(payments)}
      {activeTab === 'refunds' && renderPaymentsTable(refundRequests)}

      {showRefundModal && selectedPayment && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="modal-content refund-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Process Refund Request</h3>
            
            <div className="payment-info">
              <div className="info-row">
                <span>User:</span>
                <strong>{selectedPayment.userId?.name} ({selectedPayment.userId?.email})</strong>
              </div>
              <div className="info-row">
                <span>Amount:</span>
                <strong>₹{selectedPayment.amount}</strong>
              </div>
              <div className="info-row">
                <span>Plan:</span>
                <strong>{selectedPayment.planType}</strong>
              </div>
              <div className="info-row">
                <span>Payment Date:</span>
                <strong>{new Date(selectedPayment.createdAt).toLocaleDateString()}</strong>
              </div>
              {selectedPayment.refundReason && (
                <div className="info-row">
                  <span>User Reason:</span>
                  <p className="refund-reason">{selectedPayment.refundReason}</p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Action:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    value="approve"
                    checked={refundAction === 'approve'}
                    onChange={(e) => setRefundAction(e.target.value)}
                  />
                  Approve Refund
                </label>
                <label>
                  <input
                    type="radio"
                    value="reject"
                    checked={refundAction === 'reject'}
                    onChange={(e) => setRefundAction(e.target.value)}
                  />
                  Reject Refund
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Admin Notes:</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this refund decision..."
                rows="4"
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedPayment(null);
                  setRefundAction('');
                  setAdminNotes('');
                }}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                className="btn-submit"
                onClick={handleProcessRefund}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentManagement;
