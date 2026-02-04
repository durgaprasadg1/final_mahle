# 🚀 MAHLE Inventory Management System - Quick Start Guide

## Overview

A complete professional inventory management system for Mahle automotive manufacturing with 5 units, admin control, and user product/batch management.

---

## ⚡ Quick Start (3 Steps)

### Step 1: Database Setup

```powershell
# Create PostgreSQL database
createdb mahle_inventory

# Run schema
cd backend
psql -U postgres -d mahle_inventory -f config/database.sql
```

### Step 2: Install Dependencies

```powershell
# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

### Step 3: Start Servers

```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**OR use the automated script:**

```powershell
.\start-dev.ps1
```

---

## 🔑 Login

Open browser: `http://localhost:3000`

**Admin Login:**

- Email: `admin@mahle.com`
- Password: `admin123`

---

## 📋 Features Checklist

### ✅ Admin Dashboard

- [x] Create users with email/password
- [x] Assign users to units (5 units available)
- [x] Set permissions (create, read, update, delete)
- [x] Block/unblock users
- [x] Delete users
- [x] View all users and activities
- [x] Monitor all batches across units

### ✅ User Dashboard

- [x] Product CRUD operations
- [x] Products with fractiles, cells, tiers
- [x] Product types: coolers, radiators, pumps, fuel tanks, etc.
- [x] Record 1-hour production batches
- [x] View batch history (unit-specific)
- [x] Unit-isolated data access
- [x] Permission-based actions

### ✅ Technical Features

- [x] MVC architecture (Express.js)
- [x] PostgreSQL database
- [x] JWT authentication
- [x] React + Vite frontend
- [x] shadcn/ui components
- [x] react-toastify notifications
- [x] Tailwind CSS styling
- [x] Role-based access control
- [x] Professional UI/UX

---

## 🏭 Manufacturing Units

1. **Unit Alpha (U-ALPHA)** - Cooling systems
2. **Unit Beta (U-BETA)** - Radiators
3. **Unit Gamma (U-GAMMA)** - Pumps
4. **Unit Delta (U-DELTA)** - Fuel tanks
5. **Unit Epsilon (U-EPSILON)** - Multi-purpose

---

## 🎯 Workflow Example

### Admin Workflow:

1. Login as admin
2. Create user with:
   - Name, email, password
   - Assign to Unit Alpha
   - Grant permissions: create, read, update
3. User can now login and manage Unit Alpha products

### User Workflow:

1. Login with credentials
2. Dashboard shows Unit Alpha products
3. Add product (e.g., "Radiator Model X")
   - Type: Radiators
   - Fractiles: 5
   - Cells: 10
   - Tiers: 3
4. Record batch:
   - Select product
   - Enter quantity produced
   - Set 1-hour time window
5. View batch statistics

---

## 📊 Database Schema

```
users
├── id, email, password, name, role
├── unit_id → units.id
└── permissions (JSONB)

units
├── id, name, code
└── description, location

products
├── id, name, type
├── unit_id → units.id
├── fractiles, cells, tiers
└── created_by → users.id

batches
├── id, batch_number
├── product_id → products.id
├── unit_id → units.id
├── quantity_produced
├── batch_start_time, batch_end_time
└── duration_minutes (default: 60)
```

---

## 🔐 Permission System

Each user can have:

- **create**: Add products/batches
- **read**: View data (always granted)
- **update**: Modify products/batches
- **delete**: Remove products/batches

Admin has all permissions globally.

---

## 🌐 API Endpoints

### Auth

- POST `/api/auth/login` - Login
- GET `/api/auth/profile` - Get profile

### Users (Admin)

- POST `/api/users` - Create user
- GET `/api/users` - List all users
- PATCH `/api/users/:id/status` - Block/unblock
- DELETE `/api/users/:id` - Delete user

### Products

- POST `/api/products` - Create product
- GET `/api/products` - List products (unit-filtered)
- PUT `/api/products/:id` - Update product
- DELETE `/api/products/:id` - Delete product

### Batches

- POST `/api/batches` - Record batch
- GET `/api/batches` - List batches (unit-filtered)
- GET `/api/batches/unit/:unitId/statistics` - Stats

### Units

- GET `/api/units` - List all units

---

## 🐛 Troubleshooting

### Database Connection Error

```powershell
# Check PostgreSQL is running
Get-Service postgresql*

# Verify credentials in backend/.env
```

### Port Already in Use

```powershell
# Backend (port 5000)
netstat -ano | findstr :5000

# Frontend (port 3000)
netstat -ano | findstr :3000
```

### Module Not Found

```powershell
# Reinstall dependencies
cd backend
Remove-Item -Recurse -Force node_modules
npm install

cd frontend
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 📁 Project Structure

```
mhle/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Business logic
│   ├── models/          # Database models
│   ├── middleware/      # Auth & error handling
│   ├── routes/          # API routes
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Admin & User pages
│   │   ├── contexts/    # Auth context
│   │   └── lib/         # API & utilities
│   └── index.html
├── README.md
├── setup.ps1            # Automated setup
└── start-dev.ps1        # Start both servers
```

---

## 🎨 UI Components (shadcn)

- Button
- Input
- Select
- Card
- Table
- Dialog (Modal)
- Badge
- Label
- Textarea

All styled with Tailwind CSS for professional appearance.

---

## 💡 Tips

1. **User Isolation**: Users only see their unit's data
2. **Admin Visibility**: Admin sees everything across all units
3. **Batch Tracking**: Default 1-hour batches with auto-generated numbers
4. **Permissions**: Set granularly per user during creation
5. **Toast Notifications**: Success/error feedback on all actions

---

## 📈 Next Steps

1. **Add More Users**: Create users for each unit
2. **Add Products**: Fill each unit with products
3. **Record Batches**: Track hourly production
4. **Monitor Stats**: View production statistics
5. **Customize**: Modify product types, add features

---

## 🚀 Production Deployment

### Backend

```bash
npm install --production
NODE_ENV=production npm start
```

### Frontend

```bash
npm run build
# Serve dist/ folder
```

### Environment

- Update `DB_PASSWORD` and `JWT_SECRET`
- Set `NODE_ENV=production`
- Use HTTPS
- Set up reverse proxy (nginx)

---

## ✅ System Requirements

- **Node.js**: v16 or higher
- **PostgreSQL**: v12 or higher
- **RAM**: 2GB minimum
- **Disk**: 500MB
- **OS**: Windows/Linux/Mac

---

## 📞 Support

For issues:

1. Check troubleshooting section
2. Verify all dependencies installed
3. Check database connection
4. Review browser console logs

---

**Built with ❤️ for Mahle Automotive**

_Professional, Industry-Level Inventory Management_
