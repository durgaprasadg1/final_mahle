import React, { useState, useEffect } from "react";
import { unitAPI } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
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
  ArrowLeft,
  Building2,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Package,
} from "lucide-react";

const UnitsManagement = ({ onBack }) => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    location: "",
  });

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await unitAPI.getAll();
      setUnits(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch units");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUnit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Unit name is required");
      return;
    }

    if (!formData.code.trim()) {
      toast.error("Unit code is required");
      return;
    }

    try {
      await unitAPI.create(formData);
      toast.success("Unit created successfully");
      setShowCreateModal(false);
      resetForm();
      fetchUnits();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create unit");
    }
  };

  const handleEditUnit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Unit name is required");
      return;
    }

    if (!formData.code.trim()) {
      toast.error("Unit code is required");
      return;
    }

    try {
      await unitAPI.update(selectedUnit.id, formData);
      toast.success("Unit updated successfully");
      setShowEditModal(false);
      setSelectedUnit(null);
      resetForm();
      fetchUnits();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update unit");
    }
  };

  const handleDeleteUnit = async (unit) => {
    if (
      !window.confirm(
        `Are you sure you want to delete unit "${unit.name}"?\n\nThis action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await unitAPI.delete(unit.id);
      toast.success("Unit deleted successfully");
      fetchUnits();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete unit. It may have associated users or products.",
      );
    }
  };

  const openEditModal = (unit) => {
    setSelectedUnit(unit);
    setFormData({
      name: unit.name,
      code: unit.code,
      description: unit.description || "",
      location: unit.location || "",
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (unit) => {
    setSelectedUnit(unit);
    setShowDetailsModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      location: "",
    });
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedUnit(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <Building2 className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Units Management
                  </h1>
                  <p className="text-sm text-gray-500">
                    Manage manufacturing units
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Unit
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Units</CardTitle>
            <CardDescription>
              {units.length} manufacturing unit{units.length !== 1 ? "s" : ""}{" "}
              registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading units...</p>
              </div>
            ) : units.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No units found</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Unit
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-center">Users</TableHead>
                      <TableHead className="text-center">Products</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">
                          {unit.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{unit.code}</Badge>
                        </TableCell>
                        <TableCell>
                          {unit.location || (
                            <span className="text-gray-400 italic">
                              Not specified
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{unit.user_count || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span>{unit.product_count || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetailsModal(unit)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(unit)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUnit(unit)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Unit Modal */}
      <Dialog open={showCreateModal} onOpenChange={handleCloseCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Unit</DialogTitle>
            <DialogDescription>
              Add a new manufacturing unit to the system
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUnit} className="space-y-4">
            <div>
              <Label htmlFor="name">Unit Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Unit Alpha"
                required
              />
            </div>
            <div>
              <Label htmlFor="code">Unit Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., U-ALPHA"
                required
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g., Building A - Floor 1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the unit"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseCreateModal}
              >
                Cancel
              </Button>
              <Button type="submit">Create Unit</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Modal */}
      <Dialog open={showEditModal} onOpenChange={handleCloseEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
            <DialogDescription>Update unit information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUnit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Unit Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Unit Alpha"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-code">Unit Code *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., U-ALPHA"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g., Building A - Floor 1"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the unit"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEditModal}
              >
                Cancel
              </Button>
              <Button type="submit">Update Unit</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog
        open={showDetailsModal}
        onOpenChange={() => setShowDetailsModal(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unit Details</DialogTitle>
          </DialogHeader>
          {selectedUnit && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500">Unit Name</Label>
                <p className="text-lg font-semibold">{selectedUnit.name}</p>
              </div>
              <div>
                <Label className="text-gray-500">Unit Code</Label>
                <p className="text-lg">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {selectedUnit.code}
                  </Badge>
                </p>
              </div>
              <div>
                <Label className="text-gray-500">Location</Label>
                <p className="text-base">
                  {selectedUnit.location || (
                    <span className="text-gray-400 italic">Not specified</span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">Description</Label>
                <p className="text-base">
                  {selectedUnit.description || (
                    <span className="text-gray-400 italic">No description</span>
                  )}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-gray-500">Users</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-xl font-semibold">
                      {selectedUnit.user_count || 0}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Products</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Package className="w-5 h-5 text-gray-400" />
                    <span className="text-xl font-semibold">
                      {selectedUnit.product_count || 0}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailsModal(false);
                    openEditModal(selectedUnit);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Unit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnitsManagement;
