import React, { useState, useEffect } from "react";
import { userAPI, unitAPI } from "../../lib/api";
import ShiftDashboard from "./ShiftDashboard";
import Navbar from "../../components/Navbar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { toast } from "react-toastify";
import {
  Users,
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  Trash2,
  Eye,
} from "lucide-react";
import { formatDate, formatDateOnly } from "../../lib/utils";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentView, setCurrentView] = useState("admin");
  const [activeAdminTab, setActiveAdminTab] = useState("dashboard");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    unit_id: "",
    permissions: {
      create: true,
      read: true,
      update: true,
      delete: false,
    },
  });

  useEffect(() => {
    fetchUsers();
    fetchUnits();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await unitAPI.getAll();
      setUnits(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch units");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    // Basic client-side validations
    if (!formData.name.trim()) {
      toast.error("Full name is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!formData.unit_id) {
      toast.error("Please select a manufacturing unit");
      return;
    }
    try {
      await userAPI.create(formData);
      toast.success("User created successfully");
      setShowCreateModal(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        unit_id: "",
        permissions: { create: true, read: true, update: true, delete: false },
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create user");
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    try {
      await userAPI.updateStatus(userId, newStatus);
      toast.success(
        `User ${newStatus === "blocked" ? "blocked" : "activated"} successfully`,
      );
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await userAPI.delete(userId);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  if (currentView === "shift") {
    return <ShiftDashboard onBack={() => setCurrentView("admin")} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onDashboardClick={() => {
          setCurrentView("admin");
          setActiveAdminTab("dashboard");
        }}
        onUsersClick={() => {
          setCurrentView("admin");
          setActiveAdminTab("users");
        }}
        onShiftMakerClick={() => setCurrentView("shift")}
        activeItem={activeAdminTab}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {activeAdminTab === "dashboard" ? "Admin Dashboard" : "User Management"}
        </h1>
        <p className="text-sm text-gray-500">
          {activeAdminTab === "dashboard"
            ? "Mahle Inventory Management"
            : "Manage users across all manufacturing units"}
        </p>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeAdminTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter((u) => u.role === "user").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    users.filter(
                      (u) => u.status === "active" && u.role === "user",
                    ).length
                  }
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Manufacturing Units
                </CardTitle>
                <Shield className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{units.length}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeAdminTab === "users" && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage users across all manufacturing units
                  </CardDescription>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter((u) => u.role === "user")
                      .map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.unit_code || "N/A"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.status === "active"
                                  ? "success"
                                  : "destructive"
                              }
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDateOnly(user.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDetailsModal(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleStatus(user.id, user.status)}
                              >
                                {user.status === "active" ? (
                                  <UserX className="w-4 h-4 text-orange-600" />
                                ) : (
                                  <UserCheck className="w-4 h-4 text-green-600" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system with specific unit and permissions
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
            {/* Row 1: Full Name and Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Row 2: Password and Manufacturing Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Manufacturing Unit *</Label>
                <Select
                  id="unit"
                  value={formData.unit_id}
                  onChange={(e) =>
                    setFormData({ ...formData, unit_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select Unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.code})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-semibold">Permissions</Label>
                <p className="text-sm text-gray-500 mt-1">
                  Choose what this user can do in their assigned unit.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Create Permission */}
                <label className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.create}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          create: e.target.checked,
                        },
                      })
                    }
                    className="mt-0.5 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium">Create</span>
                    <p className="text-xs text-gray-500">Add new records</p>
                  </div>
                </label>

                {/* Read Permission */}
                <label className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.read}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          read: e.target.checked,
                        },
                      })
                    }
                    className="mt-0.5 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium">Read</span>
                    <p className="text-xs text-gray-500">
                      View assigned records
                    </p>
                  </div>
                </label>

                {/* Update Permission */}
                <label className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.update}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          update: e.target.checked,
                        },
                      })
                    }
                    className="mt-0.5 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium">Update</span>
                    <p className="text-xs text-gray-500">
                      Edit existing records
                    </p>
                  </div>
                </label>

                {/* Delete Permission */}
                <label className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.delete}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permissions: {
                          ...formData.permissions,
                          delete: e.target.checked,
                        },
                      })
                    }
                    className="mt-0.5 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium">Delete</span>
                    <p className="text-xs text-gray-500">Remove records</p>
                  </div>
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create User</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-xs text-gray-500">Name</Label>
                <p className="font-medium">{selectedUser.name}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Email</Label>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Unit</Label>
                <p className="font-medium">
                  {selectedUser.unit_name} ({selectedUser.unit_code})
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Status</Label>
                <Badge
                  variant={
                    selectedUser.status === "active" ? "success" : "destructive"
                  }
                >
                  {selectedUser.status}
                </Badge>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Permissions</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(selectedUser.permissions || {}).map(
                    ([key, value]) =>
                      value && (
                        <Badge key={key} variant="outline">
                          {key}
                        </Badge>
                      ),
                  )}
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Created By</Label>
                <p className="font-medium">
                  {selectedUser.created_by_name || "System"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Last Login</Label>
                <p className="font-medium">
                  {selectedUser.last_login
                    ? formatDate(selectedUser.last_login)
                    : "Never"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
