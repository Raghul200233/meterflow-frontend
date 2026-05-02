import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  ClipboardIcon, 
  TrashIcon, 
  ArrowPathIcon,  // ← This replaces RefreshIcon
  KeyIcon 
} from '@heroicons/react/24/outline';

function ApiKeyManager() {
  const { apiId } = useParams();
  const [keys, setKeys] = useState([]);
  const [newKey, setNewKey] = useState(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiName, setApiName] = useState('');

  useEffect(() => {
    fetchApiDetails();
    fetchKeys();
  }, [apiId]);

  const fetchApiDetails = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/apis/${apiId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiName(response.data.data.name);
    } catch (error) {
      console.error('Error fetching API details:', error);
    }
  };

  const fetchKeys = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/apis/${apiId}/keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKeys(response.data.data);
    } catch (error) {
      console.error('Error fetching keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateKey = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/apis/${apiId}/keys`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewKey(response.data.data.key);
      setShowNewKey(true);
      fetchKeys();
      
      // Auto hide after 30 seconds
      setTimeout(() => {
        setShowNewKey(false);
        setNewKey(null);
      }, 30000);
    } catch (error) {
      console.error('Error generating key:', error);
      alert('Error generating API key');
    }
  };

  const revokeKey = async (keyId) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/keys/${keyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchKeys();
    } catch (error) {
      console.error('Error revoking key:', error);
      alert('Error revoking API key');
    }
  };

  const rotateKey = async (keyId) => {
    if (!confirm('Rotating this key will generate a new key and revoke the old one. Continue?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/keys/${keyId}/rotate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewKey(response.data.data.newKey);
      setShowNewKey(true);
      fetchKeys();
    } catch (error) {
      console.error('Error rotating key:', error);
      alert('Error rotating API key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('API key copied to clipboard!');
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
        <p className="text-gray-600 mt-1">Manage keys for: {apiName}</p>
      </div>

      {/* New Key Alert */}
      {showNewKey && newKey && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-green-800 mb-2">🎉 New API Key Generated!</h3>
              <p className="text-sm text-green-700 mb-2">Make sure to copy this key now. It won't be shown again!</p>
              <div className="flex items-center space-x-2 bg-white rounded p-2 border border-green-300">
                <code className="text-sm font-mono flex-1 break-all">{newKey}</code>
                <button
                  onClick={() => copyToClipboard(newKey)}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  <ClipboardIcon className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowNewKey(false)}
              className="text-green-700 hover:text-green-900"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Generate Key Button */}
      <div className="mb-6">
        <button
          onClick={generateKey}
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors flex items-center space-x-2"
        >
          <KeyIcon className="h-5 w-5" />
          <span>Generate New API Key</span>
        </button>
      </div>

      {/* Keys List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">Active API Keys</h2>
        </div>
        
        {keys.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No API keys generated yet. Click the button above to create your first key.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {keys.map(key => (
              <div key={key._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {key.keyPrefix}...{key.key?.slice(-6) || '******'}
                      </code>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        key.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {key.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 space-x-4">
                      <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                      {key.lastUsedAt && <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
                      {key.expiresAt && <span>Expires: {new Date(key.expiresAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(key.key)}
                      className="p-2 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100"
                      title="Copy full key"
                    >
                      <ClipboardIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => rotateKey(key._id)}
                      className="p-2 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50"
                      title="Rotate key"
                    >
                      <ArrowPathIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => revokeKey(key._id)}
                      className="p-2 text-red-600 hover:text-red-900 rounded hover:bg-red-50"
                      title="Revoke key"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📖 How to use API keys</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>Include the API key in your request headers:</p>
          <pre className="bg-blue-900 text-blue-100 p-3 rounded-md overflow-x-auto text-xs">
            {`curl -X GET "http://localhost:5000/gateway/your-endpoint" \\\n  -H "x-api-key: YOUR_API_KEY_HERE" \\\n  -H "Content-Type: application/json"`}
          </pre>
          <p className="text-xs mt-2">⚠️ Keep your API keys secure. Never expose them in client-side code or public repositories.</p>
        </div>
      </div>
    </div>
  );
}

export default ApiKeyManager;