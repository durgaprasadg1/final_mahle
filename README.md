# Mahle Inventory Management System

A professional full-stack inventory management system for Mahle automotive manufacturing units.

## 🚀 Features

### Admin Features

- ✅ Create, block, and delete users
- ✅ Assign users to specific manufacturing units (5 units)
- ✅ Set granular permissions (create, read, update, delete)
- ✅ View all users and their activities
- ✅ Monitor all batches across all units

### User Features

- ✅ CRUD operations for products (coolers, radiators, pumps, fuel tanks, etc.)
- ✅ Product contains: fractiles, cells, and tiers
- ✅ Record and track 1-hour production batches
- ✅ View batch history for their unit only
- ✅ Unit-specific product management

### Technical Stack

- **Backend**: Node.js, Express.js (MVC Architecture)
- **Database**: PostgreSQL
- **Frontend**: React, Vite
- **UI**: shadcn/ui, Tailwind CSS
- **Notifications**: react-toastify
- **Authentication**: JWT

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🛠️ Installation

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb mahle_inventory

# Or using psql
psql -U postgres
CREATE DATABASE mahle_inventory;
\q

# Run the SQL schema
cd backend
psql -U postgres -d mahle_inventory -f config/database.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Update .env file with your database credentials
# Edit backend/.env and update:
# DB_USER=your_postgres_username
# DB_PASSWORD=your_postgres_password

# Start backend server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## 🔑 Default Login Credentials

### Admin Account

- **Email**: admin@mahle.com
- **Password**: admin123

### Test User Account (Create via Admin Dashboard)

- Admin can create users with custom credentials

## 🏭 Manufacturing Units

The system comes with 5 pre-configured units:

1. **Unit Alpha** (U-ALPHA) - Cooling systems
2. **Unit Beta** (U-BETA) - Radiators
3. **Unit Gamma** (U-GAMMA) - Pumps
4. **Unit Delta** (U-DELTA) - Fuel tanks
5. **Unit Epsilon** (U-EPSILON) - Multi-purpose

## 📊 Database Schema

### Tables

- `users` - Admin and unit users
- `units` - Manufacturing units
- `products` - Products with fractiles, cells, tiers
- `batches` - 1-hour production batches

## 🎨 Product Types

- Coolers
- Radiators
- Pumps
- Fuel Tanks
- Other

## 🔐 Permissions System

Users can be assigned these permissions:

- **Create**: Add new products and batches
- **Read**: View products and batches (always enabled)
- **Update**: Modify existing products and batches
- **Delete**: Remove products and batches

## 📱 Features Overview

### Admin Dashboard

- User management interface
- Create users with email and password
- Assign units and permissions
- Block/unblock users
- Delete users
- View all system activities

### User Dashboard

- Product management (CRUD based on permissions)
- Batch recording and tracking
- Unit-specific data isolation
- Real-time statistics
- Production monitoring

## 🚦 API Endpoints

### Authentication

- `POST /api/auth/login` - Login (admin/user)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/change-password` - Change password

### Users (Admin Only)

- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/status` - Block/unblock user
- `DELETE /api/users/:id` - Delete user

### Products

- `GET /api/products` - Get products (unit-filtered for users)
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Batches

- `GET /api/batches` - Get batches (unit-filtered for users)
- `POST /api/batches` - Create batch
- `GET /api/batches/unit/:unitId/statistics` - Get unit statistics

### Units

- `GET /api/units` - Get all units

## 🔧 Configuration

### Backend Environment Variables

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mahle_inventory
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
```

## 🏗️ Project Structure

```
mhle/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── database.sql
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── productController.js
│   │   ├── batchController.js
│   │   └── unitController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Batch.js
│   │   └── Unit.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── productRoutes.js
│   │   ├── batchRoutes.js
│   │   └── unitRoutes.js
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── lib/
│   │   │   ├── api.js
│   │   │   └── utils.js
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── admin/
│   │   │   │   └── AdminDashboard.jsx
│   │   │   └── user/
│   │   │       └── UserDashboard.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## 🧪 Testing

1. **Login as Admin**
   - Email: admin@mahle.com
   - Password: admin123

2. **Create a User**
   - Go to Admin Dashboard
   - Click "Create User"
   - Fill in details and assign to a unit
   - Set permissions

3. **Login as User**
   - Use the created user credentials
   - View user dashboard
   - Create products
   - Record batches

4. **Test Permissions**
   - Try operations based on assigned permissions
   - Verify unit-level data isolation

## 🚀 Production Deployment

### Backend

```bash
cd backend
npm install --production
NODE_ENV=production npm start
```

### Frontend

```bash
cd frontend
npm run build
# Serve the dist folder with your preferred web server
```

## 📝 Notes

- Admin cannot be blocked or deleted
- Users can only see data from their assigned unit
- Admin can see all data across all units
- Batch numbers are auto-generated
- Default batch duration is 60 minutes (1 hour)
- All timestamps are stored in UTC

## 🤝 Support

For issues or questions, please create an issue in the repository.

## 📄 License

Private - Mahle Automotive

---

**Built with ❤️ for Mahle Automotive Manufacturing**
