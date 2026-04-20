import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { userAPI, unitAPI, productAPI, productionPlanAPI } from "../../lib/api";
import ShiftDashboard from "./ShiftDashboard";
import UnitsManagement from "./UnitsManagement";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
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
  {
    key: "batch",
    label: "Batch",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
  },
  {
    key: "planning",
    label: "Production Planning",
    badgeClass: "bg-violet-100 text-violet-700 border-violet-200",
  },
];

const getDefaultPermissionsMatrix = () => ({
  product: { create: true, read: false, update: false, delete: false },
  fracticl: { create: false, read: false, update: false, delete: false },
  tier: { create: false, read: false, update: false, delete: false },
  cells: { create: false, read: false, update: false, delete: false },
  batch: { create: false, read: false, update: false, delete: false },
  planning: { create: false, read: false, update: false, delete: false },
});

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [products, setProducts] = useState([]);
  const [productionPlans, setProductionPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentView, setCurrentView] = useState("admin");
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const [planForm, setPlanForm] = useState({
    unit_id: "",
    product_id: "",
    shift: "morning",
    plan_date: new Date().toISOString().split("T")[0],
    target_quantity: "",
    notes: "",
  });

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
    fetchProducts();
    fetchProductionPlans();
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

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(response.data?.data || []);
    } catch (error) {
      toast.error("Failed to fetch products");
    }
  };

  const fetchProductionPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await productionPlanAPI.getAll();
      setProductionPlans(response.data?.data || []);
    } catch (error) {
      toast.error("Failed to fetch production plans");
    } finally {
      setPlansLoading(false);
    }
  };

  const normalizePermissionsForForm = (permissionsInput) => {
    const flatPermissions = {
      create: Boolean(permissionsInput?.create),
      read: Boolean(permissionsInput?.read),
      update: Boolean(permissionsInput?.update),
      delete: Boolean(permissionsInput?.delete),
    };

    const resourcePermissions =
      permissionsInput?.resources && typeof permissionsInput.resources === "object"
        ? permissionsInput.resources
        : {};

    const resolveResourcePermissions = (resourceKey) => {
      if (
        resourcePermissions[resourceKey] &&
        typeof resourcePermissions[resourceKey] === "object"
      ) {
        return resourcePermissions[resourceKey];
      }

      if (resourceKey === "fracticl") {
        return (
          resourcePermissions.fracticle ||
          resourcePermissions.fractile ||
          resourcePermissions.fracticl
        );
      }

      return null;
    };

    const normalized = {};
    RESOURCE_ROWS.forEach((resource) => {
      const resolvedPermissions =
        resolveResourcePermissions(resource.key) || flatPermissions;

      normalized[resource.key] = {
        create: Boolean(resolvedPermissions?.create),
        read: Boolean(resolvedPermissions?.read),
        update: Boolean(resolvedPermissions?.update),
        delete: Boolean(resolvedPermissions?.delete),
      };
    });

    return normalized;
  };

  const resetUserForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      unit_id: "",
      permissions: getDefaultPermissionsMatrix(),
    });
    setEditingUser(null);
  };

  const handleOpenCreateUser = () => {
    resetUserForm();
    setShowCreateModal(true);
  };

  const handleOpenEditUser = (targetUser) => {
    setEditingUser(targetUser);
    setFormData({
      name: targetUser.name || "",
      email: targetUser.email || "",
      password: "",
      unit_id: targetUser.unit_id ? String(targetUser.unit_id) : "",
      permissions: normalizePermissionsForForm(targetUser.permissions),
    });
    setShowCreateModal(true);
  };

  const handleCloseUserModal = () => {
    setShowCreateModal(false);
    resetUserForm();
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const isEditMode = Boolean(editingUser?.id);

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

    if (!formData.unit_id) {
      toast.error("Please select a manufacturing unit");
      return;
    }

    if (!isEditMode && (!formData.password || formData.password.length < 6)) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (isEditMode && formData.password && formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        unit_id: formData.unit_id,
        permissions: formData.permissions,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (isEditMode) {
        await userAPI.update(editingUser.id, payload);
        toast.success("User updated successfully");
      } else {
        await userAPI.create(payload);
        toast.success("User created successfully");
      }

      handleCloseUserModal();
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} user`,
      );
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

  const resetPlanForm = () => {
    setPlanForm({
      unit_id: "",
      product_id: "",
      shift: "morning",
      plan_date: new Date().toISOString().split("T")[0],
      target_quantity: "",
      notes: "",
    });
    setEditingPlan(null);
  };

  const handleOpenCreatePlan = () => {
    resetPlanForm();
    setShowPlanModal(true);
  };

  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      unit_id: String(plan.unit_id || ""),
      product_id: String(plan.product_id || ""),
      shift: plan.shift || "morning",
      plan_date: String(plan.plan_date || "").substring(0, 10),
      target_quantity: String(plan.target_quantity || ""),
      notes: plan.notes || "",
    });
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();

    if (!planForm.product_id || !planForm.shift || !planForm.plan_date) {
      toast.error("Please select product, shift and plan date");
      return;
    }

    const targetQty = Number(planForm.target_quantity);
    if (!Number.isFinite(targetQty) || targetQty <= 0) {
      toast.error("Target quantity must be greater than 0");
      return;
    }

    try {
      if (editingPlan?.id) {
        await productionPlanAPI.update(editingPlan.id, {
          target_quantity: targetQty,
          notes: planForm.notes,
        });
      } else {
        await productionPlanAPI.createOrUpdate({
          unit_id: Number(planForm.unit_id),
          product_id: Number(planForm.product_id),
          shift: planForm.shift,
          plan_date: planForm.plan_date,
          target_quantity: targetQty,
          notes: planForm.notes,
        });
      }

      toast.success(
        editingPlan?.id
          ? "Production target updated successfully"
          : "Production target saved successfully",
      );
      setShowPlanModal(false);
      resetPlanForm();
      fetchProductionPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save production target");
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this production target?")) {
      return;
    }

    try {
      await productionPlanAPI.delete(planId);
      toast.success("Production target deleted successfully");
      fetchProductionPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete production target");
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
                onClick={() => handleOpenEditUser(user)}
              >
                <Edit className="w-4 h-4 text-blue-600" />
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

  const planColumns = useMemo(
    () => [
      {
        accessorKey: "plan_date",
        header: "Plan Date",
        cell: ({ getValue }) => formatDateOnly(getValue()),
      },
      {
        accessorKey: "unit_code",
        header: "Unit",
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.unit_code || "N/A"}
          </Badge>
        ),
      },
      {
        accessorKey: "product_name",
        header: "Product",
      },
      {
        accessorKey: "shift",
        header: "Shift",
        cell: ({ getValue }) => <span className="capitalize">{getValue()}</span>,
      },
      {
        accessorKey: "target_quantity",
        header: "Target",
      },
      {
        accessorKey: "produced_quantity",
        header: "Produced",
      },
      {
        id: "remaining_quantity",
        header: "Remaining",
        cell: ({ row }) => {
          const target = Number(row.original.target_quantity || 0);
          const produced = Number(row.original.produced_quantity || 0);
          const remaining = target - produced;
          return <span className={remaining < 0 ? "text-red-600" : ""}>{remaining}</span>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleOpenEditPlan(row.original)}
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeletePlan(row.original.id)}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        ),
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
              <Button onClick={handleOpenCreateUser}>
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

        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Production Planning</CardTitle>
                <CardDescription>
                  Set and manage target quantity by product, shift, and date.
                </CardDescription>
              </div>
              <Button onClick={handleOpenCreatePlan}>Add Target</Button>
            </div>
          </CardHeader>
          <CardContent>
            {plansLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <DataTable columns={planColumns} data={productionPlans} />
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseUserModal();
            return;
          }
          setShowCreateModal(true);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Update User" : "Create New User"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update user details and permissions for this account"
                : "Add a new user to the system with specific unit and permissions"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveUser} className="space-y-4 mt-4">
            {/*  */}
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

            {/*  */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  {editingUser ? "Password (Optional)" : "Password *"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={
                    editingUser
                      ? "Leave blank to keep current password"
                      : "Minimum 6 characters"
                  }
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingUser}
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
                  <Label className="text-base font-semibold">Permissions Matrix</Label>
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
                onClick={handleCloseUserModal}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingUser ? "Update User" : "Create User"}
              </Button>
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

      <Dialog
        open={showPlanModal}
        onOpenChange={(open) => {
          setShowPlanModal(open);
          if (!open) {
            resetPlanForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlan?.id ? "Edit Production Target" : "Add Production Target"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePlan} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planUnit">Manufacturing Unit *</Label>
                <Select
                  id="planUnit"
                  value={planForm.unit_id}
                  onChange={(e) =>
                    setPlanForm((prev) => ({ ...prev, unit_id: e.target.value }))
                  }
                  required
                  disabled={Boolean(editingPlan?.id)}
                >
                  <option value="">Select Unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={String(unit.id)}>
                      {unit.name} ({unit.code})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="planProduct">Product *</Label>
                <Select
                  id="planProduct"
                  value={planForm.product_id}
                  onChange={(e) =>
                    setPlanForm((prev) => ({ ...prev, product_id: e.target.value }))
                  }
                  required
                  disabled={Boolean(editingPlan?.id)}
                >
                  <option value="">Select Product</option>
                  {products
                    .filter((product) =>
                      !planForm.unit_id || String(product.unit_id) === String(planForm.unit_id),
                    )
                    .map((product) => (
                      <option key={product.id} value={String(product.id)}>
                        {product.name}
                      </option>
                    ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planShift">Shift *</Label>
                <Select
                  id="planShift"
                  value={planForm.shift}
                  onChange={(e) =>
                    setPlanForm((prev) => ({ ...prev, shift: e.target.value }))
                  }
                  required
                  disabled={Boolean(editingPlan?.id)}
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="night">Night</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="planDate">Plan Date *</Label>
                <Input
                  id="planDate"
                  type="date"
                  value={planForm.plan_date}
                  onChange={(e) =>
                    setPlanForm((prev) => ({ ...prev, plan_date: e.target.value }))
                  }
                  required
                  disabled={Boolean(editingPlan?.id)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planTargetQty">Target Quantity *</Label>
              <Input
                id="planTargetQty"
                type="number"
                min="1"
                value={planForm.target_quantity}
                onChange={(e) =>
                  setPlanForm((prev) => ({ ...prev, target_quantity: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planNotes">Notes</Label>
              <Textarea
                id="planNotes"
                rows={3}
                value={planForm.notes}
                onChange={(e) =>
                  setPlanForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPlanModal(false);
                  resetPlanForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingPlan?.id ? "Update Target" : "Save Target"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
