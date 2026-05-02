// frontend/src/components/ApiManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  PlusIcon, 
  KeyIcon, 
  PencilIcon, 
  TrashIcon,
  ServerIcon  // ← This was missing
} from '@heroicons/react/24/outline';

function ApiManager() {
  const [apis, setApis] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingApi, setEditingApi] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseUrl: '',
    endpoint: '',
    method: 'GET',
    rateLimit: { perMinute: 60, perHour: 1000, perDay: 10000 },
    pricing: { freeTier: 1000, perRequestPrice: 0.005, currency: 'USD' }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchApis();
  }, []);

  const fetchApis = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/apis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApis(response.data.data);
    } catch (error) {
      console.error('Error fetching APIs:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('API name is required');
      }
      if (!formData.baseUrl.trim()) {
        throw new Error('Base URL is required');
      }
      
      // Prepare data for API
      const apiData = {
        name: formData.name.trim(),
        description: formData.description || '',
        baseUrl: formData.baseUrl.trim(),
        endpoint: formData.endpoint || '/',
        method: formData.method,
        rateLimit: {
          perMinute: parseInt(formData.rateLimit.perMinute) || 60,
          perHour: parseInt(formData.rateLimit.perHour) || 1000,
          perDay: parseInt(formData.rateLimit.perDay) || 10000
        },
        pricing: {
          freeTier: parseInt(formData.pricing.freeTier) || 1000,
          perRequestPrice: parseFloat(formData.pricing.perRequestPrice) || 0.005,
          currency: formData.pricing.currency || 'USD'
        }
      };
      
      console.log('Saving API data:', apiData);
      
      const url = editingApi 
        ? `${API_URL}/api/apis/${editingApi._id}`
        : `${API_URL}/api/apis`;
      const method = editingApi ? 'put' : 'post';
      
      const response = await axios[method](url, apiData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API saved successfully:', response.data);
      
      // Reset form and refresh
      setShowModal(false);
      setEditingApi(null);
      resetForm();
      fetchApis();
      
    } catch (error) {
      console.error('Error saving API:', error);
      
      if (error.response) {
        // Server responded with error
        console.error('Error response:', error.response.data);
        setError(error.response.data.error || error.response.data.message || 'Failed to save API');
      } else if (error.request) {
        // No response from server
        setError('Cannot connect to server. Make sure backend is running.');
      } else {
        // Other error
        setError(error.message || 'An error occurred');
      }
    } finally {
      setSaving(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      baseUrl: '',
      endpoint: '',
      method: 'GET',
      rateLimit: { perMinute: 60, perHour: 1000, perDay: 10000 },
      pricing: { freeTier: 1000, perRequestPrice: 0.005, currency: 'USD' }
    });
    setError('');
  };
  
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this API? This will also delete all associated API keys.')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/api/apis/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchApis();
    } catch (error) {
      console.error('Error deleting API:', error);
      alert('Error deleting API: ' + (error.response?.data?.error || error.message));
    }
  };
  
  const handleEdit = (api) => {
    setEditingApi(api);
    setFormData({
      name: api.name,
      description: api.description || '',
      baseUrl: api.baseUrl,
      endpoint: api.endpoint || '/',
      method: api.method,
      rateLimit: api.rateLimit || { perMinute: 60, perHour: 1000, perDay: 10000 },
      pricing: api.pricing || { freeTier: 1000, perRequestPrice: 0.005, currency: 'USD' }
    });
    setShowModal(true);
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Management</h1>
          <p className="text-gray-600 mt-1">Create and manage your APIs</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingApi(null);
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create API
        </button>
      </div>
      
      {apis.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ServerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No APIs Yet</h3>
          <p className="text-gray-500 mb-4">Create your first API to start monetizing</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
          >
            Create Your First API
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apis.map(api => (
            <div key={api._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{api.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{api.description || 'No description'}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(api)}
                      className="p-1 text-gray-600 hover:text-gray-900"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(api._id)}
                      className="p-1 text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Method:</span>
                    <span className="text-gray-900">{api.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Endpoint:</span>
                    <span className="text-gray-900 truncate">{api.endpoint || '/'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Base URL:</span>
                    <span className="text-gray-900 truncate">{api.baseUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Rate Limit:</span>
                    <span className="text-gray-900">{api.rateLimit?.perMinute}/min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Pricing:</span>
                    <span className="text-gray-900">${api.pricing?.perRequestPrice}/req</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Free Tier:</span>
                    <span className="text-gray-900">{api.pricing?.freeTier?.toLocaleString()}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate(`/apis/${api._id}/keys`)}
                  className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary hover:text-white transition"
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Manage API Keys
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingApi ? 'Edit API' : 'Create New API'}</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">API Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  placeholder="Weather API"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  rows="3"
                  placeholder="Brief description of your API"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Base URL *</label>
                <input
                  type="url"
                  required
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({...formData, baseUrl: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  placeholder="https://api.example.com/v1"
                />
                <p className="text-xs text-gray-500 mt-1">The actual API endpoint URL</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Endpoint Path</label>
                <input
                  type="text"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({...formData, endpoint: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  placeholder="/weather"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">HTTP Method</label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({...formData, method: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                  <option>PATCH</option>
                </select>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Rate Limits</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Per Minute</label>
                    <input
                      type="number"
                      value={formData.rateLimit.perMinute}
                      onChange={(e) => setFormData({
                        ...formData, 
                        rateLimit: {...formData.rateLimit, perMinute: parseInt(e.target.value) || 0}
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Per Hour</label>
                    <input
                      type="number"
                      value={formData.rateLimit.perHour}
                      onChange={(e) => setFormData({
                        ...formData, 
                        rateLimit: {...formData.rateLimit, perHour: parseInt(e.target.value) || 0}
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Per Day</label>
                    <input
                      type="number"
                      value={formData.rateLimit.perDay}
                      onChange={(e) => setFormData({
                        ...formData, 
                        rateLimit: {...formData.rateLimit, perDay: parseInt(e.target.value) || 0}
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Pricing</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Free Tier (requests)</label>
                    <input
                      type="number"
                      value={formData.pricing.freeTier}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: {...formData.pricing, freeTier: parseInt(e.target.value) || 0}
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Price per Request ($)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.pricing.perRequestPrice}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: {...formData.pricing, perRequestPrice: parseFloat(e.target.value) || 0}
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingApi(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingApi ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiManager;