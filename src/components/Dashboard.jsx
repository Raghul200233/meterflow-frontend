import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { KeyIcon, CurrencyDollarIcon, ServerIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Dashboard() {
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeKeys: 0,
    totalRevenue: 0,
    errorRate: 0
  });
  const [usageData, setUsageData] = useState([]);
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [statsRes, usageRes, apisRes] = await Promise.all([
        axios.get(`${API_URL}/api/stats`, { headers }),
        axios.get(`${API_URL}/api/usage/daily`, { headers }),
        axios.get(`${API_URL}/api/apis`, { headers })
      ]);
      
      setStats(statsRes.data);
      setUsageData(usageRes.data);
      setApis(apisRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Requests" value={stats.totalRequests.toLocaleString()} icon={ServerIcon} color="bg-blue-500" />
        <StatCard title="Active API Keys" value={stats.activeKeys} icon={KeyIcon} color="bg-green-500" />
        <StatCard title="Revenue (MTD)" value={`$${stats.totalRevenue.toFixed(2)}`} icon={CurrencyDollarIcon} color="bg-yellow-500" />
        <StatCard title="Error Rate" value={`${(stats.errorRate * 100).toFixed(2)}%`} icon={ChartBarIcon} color="bg-red-500" />
      </div>
      
      {/* Usage Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">API Usage (Last 30 Days)</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={usageData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="requests" stroke="#6366f1" name="Requests" />
            <Line type="monotone" dataKey="errors" stroke="#ef4444" name="Errors" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* APIs List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Your APIs</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {apis.map(api => (
            <div key={api._id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{api.name}</h3>
                <p className="text-sm text-gray-500">{api.endpoint}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Rate Limit: {api.rateLimit?.perMinute}/min | {api.rateLimit?.perHour}/hour
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  ${api.pricing?.perRequestPrice}/request
                </p>
                <p className="text-xs text-gray-500">
                  Free: {api.pricing?.freeTier.toLocaleString()} requests
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;