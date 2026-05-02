/* eslint-disable no-restricted-globals */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  KeyIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  ServerIcon, 
  CheckCircleIcon,
  ClipboardIcon,
  CheckBadgeIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

function ConsumerDashboard() {
  const [usage, setUsage] = useState({ totalRequests: 0, totalCost: 0 });
  const [availableApis, setAvailableApis] = useState([]);
  const [myApiKeys, setMyApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showFullKey, setShowFullKey] = useState({});
  const [generatingKey, setGeneratingKey] = useState(null);
  const [revokingKey, setRevokingKey] = useState(null);
  const [currentBill, setCurrentBill] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:6005';

  useEffect(() => {
    fetchConsumerData();
    fetchCurrentBill();
  }, []);

  const fetchConsumerData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      
      const usageRes = await axios.get(`${API_URL}/api/consumer/usage`, { headers });
      setUsage(usageRes.data);
      
      const apisRes = await axios.get(`${API_URL}/api/consumer/available-apis`, { headers });
      setAvailableApis(apisRes.data || []);
      
      const keysRes = await axios.get(`${API_URL}/api/consumer/my-keys`, { headers });
      setMyApiKeys(keysRes.data || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentBill = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/billing/current-bill`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentBill(response.data);
    } catch (error) {
      console.error('Error fetching current bill:', error);
    }
  };

  const copyToClipboard = async (key, keyId) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = key;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const toggleKeyVisibility = (keyId) => {
    setShowFullKey(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const generateNewKey = async (apiId) => {
    if (!confirm('⚠️ This will generate a NEW API key. Your old key will be revoked. Continue?')) {
      return;
    }
    
    setGeneratingKey(apiId);
    
    try {
      const token = localStorage.getItem('accessToken');
      
      const existingKey = myApiKeys.find(key => key.apiId?._id === apiId);
      if (existingKey) {
        await axios.delete(`${API_URL}/api/consumer/revoke-key/${existingKey._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      const response = await axios.post(`${API_URL}/api/consumer/request-access`, 
        { apiId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`🔑 New API Key Generated!\n\n${response.data.apiKey}\n\n⚠️ Save this key now! It won't be shown again.`);
      fetchConsumerData();
    } catch (error) {
      console.error('Error generating key:', error);
      alert('Error generating new key: ' + (error.response?.data?.error || error.message));
    } finally {
      setGeneratingKey(null);
    }
  };

  const revokeKey = async (keyId, apiName) => {
    if (!confirm(`⚠️ Are you sure you want to revoke the API key for "${apiName}"?\n\nThis will immediately stop access for this key.`)) {
      return;
    }
    
    setRevokingKey(keyId);
    
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/api/consumer/revoke-key/${keyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('✅ API key revoked successfully!');
      fetchConsumerData();
    } catch (error) {
      console.error('Error revoking key:', error);
      alert('Error revoking key: ' + (error.response?.data?.error || error.message));
    } finally {
      setRevokingKey(null);
    }
  };

  const requestAccess = async (apiId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/api/consumer/request-access`, 
        { apiId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`✅ API Key Generated Successfully!\n\n🔑 ${response.data.apiKey}\n\n⚠️ Save this key now! It won't be shown again.`);
      fetchConsumerData();
    } catch (error) {
      console.error('Error requesting access:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const formatKeyDisplay = (key, showFull = false) => {
    if (showFull) return key;
    if (!key) return '';
    const prefix = key.substring(0, 10);
    const suffix = key.substring(key.length - 6);
    return `${prefix}...${suffix}`;
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
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Consumer Dashboard</h1>
      <p className="text-gray-600 mb-8">Browse, request, and manage your API keys</p>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests (MTD)</p>
              <p className="text-3xl font-bold text-primary">{usage.totalRequests?.toLocaleString() || 0}</p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Cost (MTD)</p>
              <p className="text-3xl font-bold text-green-600">${usage.totalCost?.toFixed(4) || 0}</p>
            </div>
            <CurrencyDollarIcon className="h-12 w-12 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active API Keys</p>
              <p className="text-3xl font-bold text-purple-600">{myApiKeys.length}</p>
            </div>
            <KeyIcon className="h-12 w-12 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Current Bill Section */}
      {currentBill && currentBill.pendingAmount > 0 && (
        <div className="mb-8 bg-gradient-to-r from-primary to-secondary rounded-lg p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">💰 Current Month Bill</h2>
            <span className="text-sm opacity-80">
              {currentBill.period?.start ? new Date(currentBill.period.start).toLocaleDateString() : 'N/A'} - {currentBill.period?.end ? new Date(currentBill.period.end).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm opacity-80">Total Requests</p>
              <p className="text-2xl font-bold">{currentBill.totalRequests?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Total Amount</p>
              <p className="text-2xl font-bold">${currentBill.totalAmount?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Pending Payment</p>
              <p className="text-2xl font-bold">${currentBill.pendingAmount?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = `/payment?amount=${currentBill.pendingAmount}`}
            className="mt-4 bg-white text-primary px-6 py-2 rounded-md hover:bg-gray-100 transition font-semibold"
          >
            Pay Now ${currentBill.pendingAmount.toFixed(2)}
          </button>
        </div>
      )}

      {/* My Active API Keys Section */}
      {myApiKeys.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🔑 My Active API Keys</h2>
          <div className="grid grid-cols-1 gap-4">
            {myApiKeys.map((keyItem) => (
              <div key={keyItem._id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{keyItem.apiId?.icon || '🔑'}</span>
                        <h3 className="text-lg font-semibold text-gray-900">{keyItem.apiId?.name}</h3>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{keyItem.apiId?.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateNewKey(keyItem.apiId?._id)}
                        disabled={generatingKey === keyItem.apiId?._id}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Regenerate New Key"
                      >
                        {generatingKey === keyItem.apiId?._id ? (
                          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        ) : (
                          <ArrowPathIcon className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => revokeKey(keyItem._id, keyItem.apiId?.name)}
                        disabled={revokingKey === keyItem._id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Revoke Key"
                      >
                        {revokingKey === keyItem._id ? (
                          <div className="animate-spin h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full"></div>
                        ) : (
                          <TrashIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* API Key Display with Copy Button */}
                  <div className="bg-gray-50 rounded-lg p-3 mt-3 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">API Key:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-white px-3 py-1.5 rounded border border-gray-200 text-gray-800">
                            {showFullKey[keyItem._id] 
                              ? keyItem.key 
                              : formatKeyDisplay(keyItem.key, false)
                            }
                          </code>
                          <button
                            onClick={() => toggleKeyVisibility(keyItem._id)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                            title={showFullKey[keyItem._id] ? "Hide Key" : "Show Full Key"}
                          >
                            {showFullKey[keyItem._id] ? (
                              <EyeSlashIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(keyItem.key, keyItem._id)}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded transition"
                            title="Copy API Key"
                          >
                            {copiedKey === keyItem._id ? (
                              <CheckBadgeIcon className="h-5 w-5 text-green-600" />
                            ) : (
                              <ClipboardIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    {copiedKey === keyItem._id && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircleIcon className="h-3 w-3" />
                        Copied to clipboard!
                      </p>
                    )}
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>Created: {new Date(keyItem.createdAt).toLocaleDateString()}</span>
                        {keyItem.lastUsedAt && (
                          <span>Last Used: {new Date(keyItem.lastUsedAt).toLocaleDateString()}</span>
                        )}
                        <span>Rate Limit: {keyItem.rateLimit?.perMinute}/min</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Usage Example */}
                  <div className="mt-3 bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-800 font-medium mb-1">📖 Usage Example:</p>
                    <pre className="text-xs bg-blue-900 text-blue-100 p-2 rounded overflow-x-auto">
                      {`curl -X GET "${API_URL}/gateway${keyItem.apiId?.endpoint || '/'}" \\\n  -H "x-api-key: ${formatKeyDisplay(keyItem.key, false)}"`}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available APIs Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📦 Available APIs</h2>
        {availableApis.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ServerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No APIs Available</h3>
            <p className="text-gray-500">Check back later for new APIs</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableApis.map(api => {
              const hasKey = myApiKeys.some(key => key.apiId?._id === api._id);
              
              return (
                <div key={api._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{api.icon || '🔌'}</span>
                          <h3 className="text-lg font-semibold text-gray-900">{api.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{api.description}</p>
                      </div>
                      {hasKey && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm border-t pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Method:</span>
                        <span className="text-gray-900">{api.method || 'GET'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Endpoint:</span>
                        <span className="text-gray-900 font-mono text-xs truncate">{api.endpoint || '/'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Rate Limit:</span>
                        <span className="text-gray-900">{api.rateLimit?.perMinute}/min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Price:</span>
                        <span className="text-gray-900">${api.pricing?.perRequestPrice}/req</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Free Tier:</span>
                        <span className="text-gray-900">{api.pricing?.freeTier?.toLocaleString()}/month</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => hasKey ? generateNewKey(api._id) : requestAccess(api._id)}
                      disabled={generatingKey === api._id}
                      className={`mt-4 w-full flex items-center justify-center px-4 py-2 rounded-md transition ${
                        hasKey 
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-300 hover:bg-yellow-100'
                          : 'bg-primary text-white hover:bg-primary-dark'
                      }`}
                    >
                      {generatingKey === api._id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                      ) : (
                        <KeyIcon className="h-4 w-4 mr-2" />
                      )}
                      {hasKey ? 'Regenerate Key' : 'Request Access'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConsumerDashboard;