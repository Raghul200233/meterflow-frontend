import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  QrCodeIcon, 
  ClipboardIcon, 
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

function PaymentPortal() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentSession, setPaymentSession] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState(0);
  const [invoiceId, setInvoiceId] = useState(null);
  const [status, setStatus] = useState('pending');
  const [copied, setCopied] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [receipt, setReceipt] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:6005';

  useEffect(() => {
    // Get invoice details from URL params
    const params = new URLSearchParams(location.search);
    const invoiceIdParam = params.get('invoiceId');
    const amountParam = params.get('amount');
    
    if (invoiceIdParam && amountParam) {
      setInvoiceId(invoiceIdParam);
      setAmount(parseFloat(amountParam));
      createPaymentSession(invoiceIdParam, parseFloat(amountParam));
    } else {
      alert('Invalid payment request');
      navigate('/billing');
    }
  }, []);

  const createPaymentSession = async (invoiceId, amount) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/api/payments/create-session`, {
        invoiceId,
        amount,
        paymentMethod: 'upi'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data;
      setPaymentSession(data);
      setQrCode(data.qrCode);
      setUpiId(data.upiId);
      setStatus('pending');
      
      // Start polling for payment status
      startPolling(data.sessionId);
      
    } catch (error) {
      console.error('Error creating payment session:', error);
      alert('Failed to create payment session: ' + (error.response?.data?.error || error.message));
      navigate('/billing');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (sessionId) => {
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_URL}/api/payments/status/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.status === 'completed') {
          clearInterval(interval);
          setStatus('completed');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 3000); // Check every 3 seconds
    
    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(interval), 10 * 60 * 1000);
  };

  const verifyPayment = async () => {
    if (!transactionId.trim()) {
      alert('Please enter the transaction ID/UPI Reference');
      return;
    }
    
    setProcessing(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/api/payments/verify`, {
        sessionId: paymentSession.sessionId,
        transactionId: transactionId,
        upiReference: transactionId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReceipt(response.data.receipt);
      setStatus('completed');
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Payment verification failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReceipt = () => {
    if (!receipt) return;
    
    const receiptContent = `
      ========================================
              METERFLOW PAYMENT RECEIPT
      ========================================
      
      Receipt ID: ${receipt.receiptId}
      Invoice Number: ${receipt.invoiceNumber}
      Date: ${new Date(receipt.paidAt).toLocaleString()}
      
      ----------------------------------------
      
      Paid To: MeterFlow Technologies
      Amount: $${receipt.amount} USD (₹${(receipt.amount * 83).toFixed(2)} INR)
      Payment Method: ${receipt.paymentMethod}
      Transaction ID: ${receipt.transactionId}
      
      ----------------------------------------
      
      Customer Details:
      Name: ${receipt.customer.name}
      Email: ${receipt.customer.email}
      
      ----------------------------------------
      
      Thank you for your payment!
      
      For any queries, contact: support@meterflow.com
      
      ========================================
    `;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${receipt.receiptId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Creating payment session...</p>
        </div>
      </div>
    );
  }

  if (status === 'completed' && receipt) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="bg-green-600 px-6 py-4">
              <h1 className="text-2xl font-bold text-white flex items-center">
                <CheckCircleIcon className="h-8 w-8 mr-2" />
                Payment Successful!
              </h1>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-600">Thank you for your payment!</p>
                <p className="text-2xl font-bold text-green-600 mt-2">${receipt.amount} USD</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-2">Receipt Details:</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Receipt ID:</span> {receipt.receiptId}</p>
                  <p><span className="text-gray-500">Transaction ID:</span> {receipt.transactionId}</p>
                  <p><span className="text-gray-500">Payment Date:</span> {new Date(receipt.paidAt).toLocaleString()}</p>
                  <p><span className="text-gray-500">Payment Method:</span> {receipt.paymentMethod}</p>
                </div>
              </div>
              
              <button
                onClick={downloadReceipt}
                className="w-full bg-primary text-white py-3 rounded-md hover:bg-primary-dark transition mb-3"
              >
                Download Receipt
              </button>
              
              <button
                onClick={() => navigate('/billing')}
                className="w-full border border-primary text-primary py-3 rounded-md hover:bg-primary/10 transition"
              >
                View All Invoices
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-primary px-6 py-4">
            <h1 className="text-2xl font-bold text-white">UPI Payment Portal</h1>
            <p className="text-white/80 mt-1">Scan QR code to pay using any UPI app</p>
          </div>
          
          <div className="p-6">
            {/* Amount Display */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
              <p className="text-gray-600">Amount to Pay</p>
              <p className="text-3xl font-bold text-primary">${amount} USD</p>
              <p className="text-sm text-gray-500">≈ ₹{(amount * 83).toFixed(2)} INR</p>
            </div>
            
            {/* QR Code Section */}
            <div className="text-center mb-6">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                {qrCode ? (
                  <img src={qrCode} alt="UPI QR Code" className="w-64 h-64" />
                ) : (
                  <div className="w-64 h-64 bg-gray-100 flex items-center justify-center">
                    <QrCodeIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            
            {/* UPI ID Section */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-2">Or pay manually using this UPI ID:</p>
              <div className="flex items-center justify-between bg-white rounded p-2 border border-blue-200">
                <code className="text-lg font-mono text-blue-800">{upiId}</code>
                <button
                  onClick={copyUpiId}
                  className="p-2 hover:bg-blue-100 rounded transition"
                >
                  {copied ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <ClipboardIcon className="h-5 w-5 text-blue-600" />
                  )}
                </button>
              </div>
              {copied && <p className="text-xs text-green-600 mt-2">✓ UPI ID copied!</p>}
            </div>
            
            {/* Transaction Verification */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">After completing payment:</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter Transaction ID / UPI Reference Number"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
                <button
                  onClick={verifyPayment}
                  disabled={processing || !transactionId}
                  className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition disabled:opacity-50"
                >
                  {processing ? (
                    <span className="flex items-center justify-center">
                      <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                      Verifying...
                    </span>
                  ) : (
                    'I have completed the payment'
                  )}
                </button>
              </div>
            </div>
            
            {/* Instructions */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">📌 Instructions:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>1. Open any UPI app (Google Pay, PhonePe, Paytm, BHIM)</li>
                <li>2. Scan the QR code or enter UPI ID manually</li>
                <li>3. Complete the payment</li>
                <li>4. Enter the transaction ID above and click "I have completed the payment"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentPortal;