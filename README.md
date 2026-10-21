# ChallanOne 🚗💳

A modern, full-stack web application for checking and paying traffic challans (e-challans) online across India. Built with React, Node.js, and integrated with Supabase and Razorpay for seamless user experience.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)

## ✨ Features

### Core Functionality
- **🔍 Challan Lookup** - Search and view pending traffic challans by vehicle number
- **💳 Secure Payments** - Pay challans online via Razorpay (UPI, cards, net banking, wallets)
- **📄 Instant Receipts** - Generate and download digital payment receipts
- **📍 Track Status** - Monitor challan payment status in real-time

### Vehicle Services
- **🚗 Vehicle Information** - Get complete RC details, ownership info, and registration status
- **📋 Challan History** - View complete challan history for any vehicle

### User Features
- **👤 User Authentication** - Secure login/signup with OTP verification
- **📱 Responsive Design** - Optimized for mobile and desktop
- **🎧 24/7 Support** - Integrated support ticket system

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **React Router DOM 7** - Client-side routing
- **Tailwind CSS 4** - Styling
- **Vite 7** - Build tool & dev server

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Supabase** - Database & authentication
- **JWT** - Token-based authentication

### Integrations
- **Razorpay** - Payment gateway
- **Nodemailer** - Email service (OTP)
- **External APIs** - Vehicle & challan data

## 📁 Project Structure

```
ChallanOne/
├── client/                    # Frontend React application
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── assets/            # Images and media
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # Base UI components
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── config/            # Client configuration
│   │   ├── pages/             # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── PayChallan.jsx
│   │   │   ├── TrackChallan.jsx
│   │   │   ├── VehicleInfo.jsx
│   │   │   ├── PaymentSuccess.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── Support.jsx
│   │   ├── App.jsx            # Main app component
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Backend Node.js application
│   ├── config/                # Server configuration
│   ├── data/                  # Data files/mock data
│   ├── routes/                # API routes
│   │   ├── auth.js            # Authentication endpoints
│   │   ├── challan.js         # Challan operations
│   │   ├── vehicle.js         # Vehicle information
│   │   ├── payment.js         # Payment processing
│   │   └── externalApi.js     # Third-party API integration
│   ├── utils/                 # Utility functions
│   ├── server.js              # Server entry point
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Supabase** account
- **Razorpay** account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ChallanOne.git
   cd ChallanOne
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Configuration

1. **Backend Environment Variables**
   
   Create a `.env` file in the `server/` directory:
   ```env
   # Server Configuration
   PORT=5000

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_here

   # Supabase Configuration
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_SERVICE_KEY=your_supabase_service_key_here

   # Email Configuration - Brevo (formerly Sendinblue)
   BREVO_API_KEY=your_brevo_api_key_here

   # Razorpay Configuration (use matching test keys locally; live keys in production)
   RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
   RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXX

   # External API Configuration
   APICLUB_API_KEY=your_apiclub_key_here
   ```

2. **Frontend Environment Variables**
   
   Create a `.env` file in the `client/` directory:
   ```env
   # Backend API URL
   VITE_API_URL=http://localhost:5000
   ```

   In production, set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` on the backend
   deployment to the matching Live Mode credentials from Razorpay Dashboard.
   The secret must remain server-side; production checkout rejects test-mode keys.

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd client
   npm run dev
   ```
   Client will run on `http://localhost:5173`

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/send-otp` | Send OTP for verification |
| POST | `/api/auth/verify-otp` | Verify OTP |

### Challans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/challan/:vehicleNumber` | Get challans by vehicle |
| GET | `/api/challan/track/:challanId` | Track challan status |

### Vehicle
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicle/:vehicleNumber` | Get vehicle information |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create-order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment |
| GET | `/api/payment/receipt/:paymentId` | Get payment receipt |

### External APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/external/vehicle/:vehicleNumber` | Get vehicle from external API |
| GET | `/api/external/challan/:vehicleNumber` | Get challans from external API |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health status |

## 🔒 Security

- **256-bit SSL encryption** for all data transmission
- **JWT-based authentication** with secure token handling
- **Input validation** and sanitization
- **CORS protection** enabled
- **RBI-approved payment gateway** (Razorpay)

## 📱 Deployment

### Frontend (Vercel)
The frontend is configured for Vercel deployment with SPA routing support.

```bash
cd client
npm run build
```

### Backend
Deploy the server to any Node.js hosting platform (Railway, Render, Heroku, etc.)

```bash
cd server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://react.dev/) - UI Library
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [Razorpay](https://razorpay.com/) - Payment Gateway
- [Supabase](https://supabase.com/) - Backend as a Service

---

<div align="center">
  <p>Made with ❤️ for safer roads in India</p>
  <p>
    <a href="https://challanone.com">Website</a> •
    <a href="mailto:support@challanone.com">Support</a>
  </p>
</div>
