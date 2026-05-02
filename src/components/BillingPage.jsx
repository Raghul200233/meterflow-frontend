import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:6005';

  useEffect(() => {
    fetchInvoices();
  }, []);

  const payInvoice = async (invoice) => {
  // Redirect to payment portal instead of direct API call
  window.location.href = `/payment?invoiceId=${invoice._id}&amount=${invoice.amount}`;
};

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/billing/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Invoices received:', response.data);
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError(error.response?.data?.error || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = (invoice) => {
    if (!invoice || !invoice.amount) {
      console.error('Invalid invoice:', invoice);
      alert('Error: Invoice data is invalid');
      return;
    }
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!selectedInvoice || !selectedInvoice._id) {
      alert('Error: No invoice selected');
      return;
    }

    setPaying(selectedInvoice._id);
    
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await axios.post(
        `${API_URL}/api/billing/invoices/${selectedInvoice._id}/pay`,
        { paymentMethod: paymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Payment response:', response.data);
      
      alert(`✅ Payment Successful!\n\nAmount: $${selectedInvoice.amount.toFixed(2)}\nPayment ID: ${response.data.paymentId || 'N/A'}`);
      
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      fetchInvoices(); // Refresh the list
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setPaying(null);
    }
  };

  const downloadReceipt = (invoice) => {
    if (!invoice) return;
    
    const receiptContent = `
      ========================================
              METERFLOW RECEIPT
      ========================================
      
      Receipt ID: INV-${invoice._id?.slice(-8) || 'UNKNOWN'}
      Date: ${new Date(invoice.paidAt || invoice.createdAt || Date.now()).toLocaleString()}
      
      ----------------------------------------
      
      Period: ${invoice.period?.start ? new Date(invoice.period.start).toLocaleDateString() : 'N/A'} - ${invoice.period?.end ? new Date(invoice.period.end).toLocaleDateString() : 'N/A'}
      Total Requests: ${invoice.totalRequests?.toLocaleString() || 0}
      Paid Requests: ${invoice.paidRequests?.toLocaleString() || 0}
      Amount: $${invoice.amount?.toFixed(2) || '0.00'}
      Status: ${invoice.status?.toUpperCase() || 'UNKNOWN'}
      
      ----------------------------------------
      
      Thank you for using MeterFlow!
      
      ========================================
    `;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${invoice._id?.slice(-8) || 'unknown'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Paid' };
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'Pending' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: DocumentTextIcon, text: status || 'Unknown' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Billing & Invoices</h1>
        <p className="text-gray-600 mt-1">View and manage your payment history</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Yet</h3>
          <p className="text-gray-500 mb-4">Invoices will appear here once you start using APIs</p>
          <button
            onClick={() => window.location.href = '/consumer'}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Browse APIs
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => {
            const StatusBadge = getStatusBadge(invoice.status);
            const isPaid = invoice.status === 'paid';
            
            return (
              <div key={invoice._id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <DocumentTextIcon className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Invoice #{invoice._id?.slice(-8).toUpperCase() || 'N/A'}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${StatusBadge.color}`}>
                          <StatusBadge.icon className="h-3 w-3 mr-1" />
                          {StatusBadge.text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Period: {invoice.period?.start ? new Date(invoice.period.start).toLocaleDateString() : 'N/A'} - {invoice.period?.end ? new Date(invoice.period.end).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">${invoice.amount?.toFixed(2) || '0.00'}</p>
                      {invoice.dueDate && !isPaid && (
                        <p className="text-xs text-gray-500">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-3 border-t border-b border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Total Requests</p>
                      <p className="text-lg font-semibold">{invoice.totalRequests?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Paid Requests</p>
                      <p className="text-lg font-semibold">{invoice.paidRequests?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Free Tier Used</p>
                      <p className="text-lg font-semibold">{(invoice.totalRequests - invoice.paidRequests)?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">API</p>
                      <p className="text-lg font-semibold truncate">{invoice.apiId?.name || 'Multiple APIs'}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => downloadReceipt(invoice)}
                      className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                      Download
                    </button>
                    
                    {!isPaid && invoice.amount > 0 && (
                      <button
                        onClick={() => openPaymentModal(invoice)}
                        disabled={paying === invoice._id}
                        className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
                      >
                        {paying === invoice._id ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                        )}
                        Pay Now
                      </button>
                    )}
                    
                    {isPaid && (
                      <div className="flex items-center text-green-600">
                        <CheckCircleIcon className="h-5 w-5 mr-1" />
                        <span className="text-sm">Paid on {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Complete Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600">Invoice Amount</p>
                <p className="text-3xl font-bold text-primary">${selectedInvoice.amount?.toFixed(2) || '0.00'}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Payment Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <CreditCardIcon className="h-5 w-5 mr-2 text-gray-600" />
                    <span>Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <span className="mr-2">📱</span>
                    <span>UPI (Google Pay, PhonePe, Paytm)</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                disabled={paying === selectedInvoice._id}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
              >
                {paying === selectedInvoice._id ? (
                  <span className="flex items-center justify-center">
                    <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </span>
                ) : (
                  `Pay $${selectedInvoice.amount?.toFixed(2)}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingPage;