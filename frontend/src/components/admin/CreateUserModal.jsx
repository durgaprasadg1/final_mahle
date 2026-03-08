import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { toast } from "react-toastify";
import { userAPI, unitAPI } from "../../lib/api";

/**
 * Create User Modal Component
 * Configure identity details and resource-level CRUD permissions
 */
export const CreateUserModal = ({ isOpen, onClose, onSuccess }) => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    unit_id: "",
  });

  const [permissions, setPermissions] = useState({
    product: { create: false, read: false, update: false, delete: false },
    fracticle: { create: false, read: false, update: false, delete: false },
    tier: { create: false, read: false, update: false, delete: false },
    cells: { create: false, read: false, update: false, delete: false },
    batch: { create: false, read: false, update: false, delete: false },
  });

  // Fetch units when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUnits();
    }
  }, [isOpen]);

  const fetchUnits = async () => {
    try {
      const response = await unitAPI.getAll();
      setUnits(response.data || []);
    } catch (error) {
      console.error("Failed to fetch units:", error);
      toast.error("Failed to load manufacturing units");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePermissionChange = (resource, operation) => {
    setPermissions((prev) => ({
      ...prev,
      [resource]: {
        ...prev[resource],
        [operation]: !prev[resource][operation],
      },
    }));
  };

  const handleSelectAll = () => {
    const allSelected = {};
    Object.keys(permissions).forEach((resource) => {
      allSelected[resource] = {
        create: true,
        read: true,
        update: true,
        delete: true,
      };
    });
    setPermissions(allSelected);
  };

  const handleClearAll = () => {
    const allCleared = {};
    Object.keys(permissions).forEach((resource) => {
      allCleared[resource] = {
        create: false,
        read: false,
        update: false,
        delete: false,
      };
    });
    setPermissions(allCleared);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
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

    setLoading(true);
    try {
      const payload = {
        ...formData,
        permissions,
      };

      await userAPI.create(payload);
      toast.success("User created successfully!");
      handleClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to create user:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create user";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      name: "",
      email: "",
      password: "",
      unit_id: "",
    });
    setPermissions({
      product: { create: false, read: false, update: false, delete: false },
      fracticle: { create: false, read: false, update: false, delete: false },
      tier: { create: false, read: false, update: false, delete: false },
      cells: { create: false, read: false, update: false, delete: false },
      batch: { create: false, read: false, update: false, delete: false },
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} className="w-full">
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New User</DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Configure identity details and resource-level CRUD permissions.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_id">Manufacturing Unit *</Label>
              <Select
                id="unit_id"
                name="unit_id"
                value={formData.unit_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Permissions Matrix</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-teal-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b">
                        Resource
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 border-b">
                        Create
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 border-b">
                        Read
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 border-b">
                        Update
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 border-b">
                        Delete
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {Object.entries(permissions).map(([resource, ops]) => (
                      <tr key={resource} className="border-b last:border-b-0">
                        <td className="py-3 px-4 text-sm font-medium capitalize">
                          {resource}
                        </td>
                        {["create", "read", "update", "delete"].map(
                          (operation) => (
                            <td
                              key={operation}
                              className="py-3 px-4 text-center"
                            >
                              <input
                                type="checkbox"
                                checked={ops[operation]}
                                onChange={() =>
                                  handlePermissionChange(resource, operation)
                                }
                                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                              />
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {loading ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;
