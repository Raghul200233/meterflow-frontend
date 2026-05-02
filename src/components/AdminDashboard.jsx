import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  ServerIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  UserGroupIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalApis: 0,
    totalRequests: 0,
    totalRevenue: 0,
    activeKeys: 0,
    errorRate: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [topApis, setTopApis] = useState([]);
  const [usersByRole, setUsersByRole] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    fetchAdminStats();
    fetchRecentActivity();
    fetchTopApis();
    fetchUsersByRole();
  }, [selectedPeriod]);

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentActivity(response.data);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopApis = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/top-apis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTopApis(response.data);
    } catch (error) {
      console.error('Error fetching top APIs:', error);
    }
  };

  const fetchUsersByRole = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/users-by-role`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersByRole(response.data);
    } catch (error) {
      console.error('Error fetching users by role:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon className={`h-8 w-8 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  );

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">System-wide analytics and management</p>
      </div>

      {/* Period Selector */}
      <div className="mb-6 flex space-x-2">
        {['day', 'week', 'month', 'year'].map(period => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-md capitalize ${
              selectedPeriod === period
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={UsersIcon} 
          color="bg-blue-500"
          trend={12}
        />
        <StatCard 
          title="Total APIs" 
          value={stats.totalApis} 
          icon={ServerIcon} 
          color="bg-green-500"
          trend={8}
        />
        <StatCard 
          title="Total Requests" 
          value={stats.totalRequests} 
          icon={ChartBarIcon} 
          color="bg-purple-500"
          trend={23}
        />
        <StatCard 
          title="Revenue (MTD)" 
          value={`$${stats.totalRevenue.toFixed(2)}`} 
          icon={CurrencyDollarIcon} 
          color="bg-yellow-500"
          trend={15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top APIs Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Performing APIs</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topApis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="requests" fill="#6366f1" name="Total Requests" />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Users by Role Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Users by Role</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={usersByRole}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {usersByRole.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.map((activity, index) => (
            <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                {activity.type === 'api_created' && <ServerIcon className="h-5 w-5 text-green-500" />}
                {activity.type === 'user_joined' && <UserGroupIcon className="h-5 w-5 text-blue-500" />}
                {activity.type === 'key_generated' && <KeyIcon className="h-5 w-5 text-purple-500" />}
                {activity.type === 'error' && <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />}
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.user}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">{activity.time}</span>
                {activity.status === 'success' && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-primary text-white p-4 rounded-lg hover:bg-primary-dark transition-colors">
          <UsersIcon className="h-6 w-6 mx-auto mb-2" />
          <p className="font-semibold">Manage Users</p>
          <p className="text-xs opacity-90">Add, edit, or remove users</p>
        </button>
        <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors">
          <ServerIcon className="h-6 w-6 mx-auto mb-2" />
          <p className="font-semibold">Manage APIs</p>
          <p className="text-xs opacity-90">Review and approve APIs</p>
        </button>
        <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
          <CurrencyDollarIcon className="h-6 w-6 mx-auto mb-2" />
          <p className="font-semibold">Revenue Report</p>
          <p className="text-xs opacity-90">Download financial reports</p>
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;