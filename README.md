## 🎨 **Frontend README.md** (`frontend/README.md`)

```markdown
# 🎨 MeterFlow Frontend

React dashboard for API billing platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

🔧 Environment
Create .env file:
REACT_APP_API_URL=https://meterflow-api.onrender.com

🎯 Features
Admin - User management, system analytics, all APIs
API Owner - Create/manage APIs, generate keys, view revenue
Consumer - Browse APIs, request keys, test APIs, view billing

🔐 Test Credentials
Role	Email	Password
Admin	admin@meterflow.com	Admin@123
API Owner	owner@meterflow.com	Owner@123
Consumer	consumer@meterflow.com	Consumer@123


📁 Project Structure
text
src/
├── components/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── ConsumerDashboard.jsx
│   ├── AdminDashboard.jsx
│   ├── ApiManager.jsx
│   ├── ApiKeyManager.jsx
│   ├── BillingPage.jsx
│   ├── PaymentPortal.jsx
│   └── Layout.jsx
├── App.js
└── index.js


🚀 Deployment
Deploy to Vercel with environment variable:
REACT_APP_API_URL=https://your-backend-url.onrender.com
