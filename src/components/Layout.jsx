import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  KeyIcon, 
  CreditCardIcon, 
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  UserGroupIcon,
  ServerIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

function Layout({ children }) {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName');
  const userEmail = localStorage.getItem('userEmail');
  
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };
  
  // Navigation based on role
  const getNavigation = () => {
    const commonNav = [
      { name: 'Dashboard', href: '/', icon: HomeIcon },
      { name: 'Billing', href: '/billing', icon: CreditCardIcon },
    ];
    
    if (userRole === 'admin') {
      return [
        { name: 'Admin Dashboard', href: '/admin', icon: ChartBarIcon },
        { name: 'User Management', href: '/admin/users', icon: UserGroupIcon },
        { name: 'All APIs', href: '/admin/apis', icon: ServerIcon },
        { name: 'System Settings', href: '/admin/settings', icon: KeyIcon },
        ...commonNav
      ];
    } else if (userRole === 'api_owner') {
      return [
        { name: 'My APIs', href: '/apis', icon: ServerIcon },
        ...commonNav
      ];
    } else if (userRole === 'consumer') {
      return [
        ...commonNav
      ];
    }
    return commonNav;
  };
  
  const navigation = getNavigation();
  
  // Get role display name and color
  const getRoleDisplay = () => {
    switch(userRole) {
      case 'admin':
        return { name: 'Administrator', color: 'bg-red-100 text-red-800', icon: '👑' };
      case 'api_owner':
        return { name: 'API Owner', color: 'bg-blue-100 text-blue-800', icon: '🔧' };
      case 'consumer':
        return { name: 'Consumer', color: 'bg-green-100 text-green-800', icon: '👤' };
      default:
        return { name: 'User', color: 'bg-gray-100 text-gray-800', icon: '👤' };
    }
  };
  
  const roleDisplay = getRoleDisplay();
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 border-b bg-primary">
          <h1 className="text-2xl font-bold text-white">MeterFlow</h1>
        </div>
        
        {/* User Info Section */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                <UserCircleIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userName || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userEmail || 'user@example.com'}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleDisplay.color}`}>
              <span className="mr-1">{roleDisplay.icon}</span>
              {roleDisplay.name}
            </span>
          </div>
        </div>
        
        <nav className="mt-5 px-2 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="mt-10 w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
            Logout
          </button>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="pl-64">
        <main className="py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;