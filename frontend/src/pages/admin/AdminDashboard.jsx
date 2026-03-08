import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { userAPI, unitAPI } from "../../lib/api";
import ShiftDashboard from "./ShiftDashboard";
import UnitsManagement from "./UnitsManagement";
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
  LogOut,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { formatDate, formatDateOnly } from "../../lib/utils";
import { DataTable } from "../../components/user/table";

const PERMISSION_OPERATIONS = [
  { key: "create", label: "CREATE", description: "Add records" },
  { key: "read", label: "READ", description: "View records" },
  { key: "update", label: "UPDATE", description: "Edit records" },
  { key: "delete", label: "DELETE", description: "Remove records" },
];

const RESOURCE_ROWS = [
  {
    key: "product",
    label: "Product",
    badgeClass: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  {
    key: "fracticl",
    label: "Fracticl",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    key: "tier",
    label: "Tier",
    badgeClass: "bg-sky-100 text-sky-700 border-sky-200",
  },
  {
    key: "cells",
    label: "Cells",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
];

const getDefaultPermissionsMatrix = () => ({
  product: { create: true, read: true, update: true, delete: false },
  fracticl: { create: false, read: false, update: false, delete: false },
  tier: { create: false, read: false, update: false, delete: false },
  cells: { create: false, read: false, update: false, delete: false },
});

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentView, setCurrentView] = useState("admin");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    unit_id: "",
    permissions: getDefaultPermissionsMatrix(),
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
        permissions: getDefaultPermissionsMatrix(),
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create user");
    }
  };

  const updatePermissionCell = (resource, operation, checked) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [resource]: {
          ...prev.permissions[resource],
          [operation]: checked,
        },
      },
    }));
  };

  const setAllMatrixPermissions = (checked) => {
    setFormData((prev) => {
      const nextPermissions = {};
      RESOURCE_ROWS.forEach((resource) => {
        nextPermissions[resource.key] = {};
        PERMISSION_OPERATIONS.forEach((operation) => {
          nextPermissions[resource.key][operation.key] = checked;
        });
      });

      return {
        ...prev,
        permissions: nextPermissions,
      };
    });
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

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully");
  };

  const userColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }) => <div className="font-medium">{getValue()}</div>,
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ getValue }) => getValue(),
      },
      {
        id: "unit",
        header: "Unit",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.unit_code || "N/A"}</Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => (
          <Badge variant={getValue() === "active" ? "success" : "destructive"}>
            {getValue()}
          </Badge>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ getValue }) => formatDateOnly(getValue()),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const user = row.original;
          return (
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
          );
        },
      },
    ],
    [],
  );

  if (currentView === "shift") {
    return <ShiftDashboard onBack={() => setCurrentView("admin")} />;
  }

  if (currentView === "units") {
    return <UnitsManagement onBack={() => setCurrentView("admin")} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Mahle Inventory Management
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentView("units")}
              >
                Manage Units
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentView("shift")}
              >
                ShiftMaker
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>

              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
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
              <DataTable
                columns={userColumns}
                data={users.filter((u) => u.role === "user")}
              />
            )}
          </CardContent>
        </Card>
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

            {/* Permissions Matrix */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="text-base font-semibold">Permissions</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Choose what this user can do across each resource in their assigned unit.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAllMatrixPermissions(true)}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAllMatrixPermissions(false)}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold tracking-wide text-xs">
                        RESOURCE
                      </th>
                      {PERMISSION_OPERATIONS.map((operation) => (
                        <th
                          key={operation.key}
                          className="px-3 py-3 text-left font-semibold tracking-wide text-xs"
                        >
                          <div>{operation.label}</div>
                          <div className="mt-1 text-[11px] font-normal text-slate-400">
                            {operation.description}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RESOURCE_ROWS.map((resource) => (
                      <tr key={resource.key} className="border-t border-slate-200">
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`rounded-full font-semibold ${resource.badgeClass}`}
                          >
                            {resource.label}
                          </Badge>
                        </td>
                        {PERMISSION_OPERATIONS.map((operation) => (
                          <td key={operation.key} className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={Boolean(
                                formData.permissions?.[resource.key]?.[operation.key],
                              )}
                              onChange={(e) =>
                                updatePermissionCell(
                                  resource.key,
                                  operation.key,
                                  e.target.checked,
                                )
                              }
                              className="h-5 w-5 rounded border-slate-300"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  {RESOURCE_ROWS.flatMap((resource) =>
                    PERMISSION_OPERATIONS.map((operation) => {
                      const hasPermission = Boolean(
                        selectedUser.permissions?.resources?.[resource.key]?.[
                          operation.key
                        ],
                      );
                      if (!hasPermission) return null;

                      return (
                        <Badge key={`${resource.key}-${operation.key}`} variant="outline">
                          {resource.label}: {operation.key}
                        </Badge>
                      );
                    }),
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
