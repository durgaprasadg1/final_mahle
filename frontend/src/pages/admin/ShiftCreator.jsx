import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { shiftAPI } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
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
import { toast } from "react-toastify";
import { Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

const ShiftCreator = () => {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    start_time: "",
    end_time: "",
    description: "",
    is_active: true,
    unit_id: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchShifts();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      start_time: "",
      end_time: "",
      description: "",
      is_active: true,
      unit_id: "",
    });
    setEditingShiftId(null);
  };

  const formatTimeForInput = (timeValue) => {
    if (!timeValue) return "";
    return timeValue.slice(0, 5);
  };

  const fetchShifts = async () => {
    try {
      const response = await shiftAPI.getAll();
      setShifts(response.data?.data || []);
    } catch (err) {
      toast.error("Failed to fetch shifts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        description: form.description || null,
        is_active: form.is_active,
        unit_id: form.unit_id || null,
      };

      if (editingShiftId) {
        await shiftAPI.update(editingShiftId, payload);
        toast.success("Shift updated");
      } else {
        await shiftAPI.create(payload);
        toast.success("Shift created");
      }

      resetForm();
      setShowForm(false);
      fetchShifts();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          `Failed to ${editingShiftId ? "update" : "create"} shift`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditShift = (shift) => {
    setEditingShiftId(shift.id);
    setForm({
      name: shift.name || "",
      start_time: formatTimeForInput(shift.start_time),
      end_time: formatTimeForInput(shift.end_time),
      description: shift.description || "",
      is_active: !!shift.is_active,
      unit_id: shift.unit_id ? String(shift.unit_id) : "",
    });
    setShowForm(true);
  };

  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm("Are you sure you want to delete this shift?")) return;

    try {
      await shiftAPI.delete(shiftId);
      toast.success("Shift deleted");

      if (editingShiftId === shiftId) {
        resetForm();
        setShowForm(false);
      }

      fetchShifts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete shift");
    }
  };

  const handleToggleActive = async (shift) => {
    try {
      await shiftAPI.update(shift.id, { is_active: !shift.is_active });
      toast.success(`Shift ${shift.is_active ? "deactivated" : "activated"}`);

      if (editingShiftId === shift.id) {
        setForm((prev) => ({ ...prev, is_active: !shift.is_active }));
      }

      fetchShifts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update shift status");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Shift Management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              View all created shifts and add new ones.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/admin")}>Back</Button>
            <Button
              type="button"
              onClick={() => {
                if (showForm) {
                  resetForm();
                  setShowForm(false);
                  return;
                }
                setShowForm(true);
              }}
            >
              {showForm ? "Close" : "Create Shift"}
            </Button>
          </div>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingShiftId ? "Update Shift" : "Create Shift"}</CardTitle>
              <CardDescription>
                {editingShiftId
                  ? "Edit shift details and save changes"
                  : "Add a new production shift"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Shift Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start">Start Time</Label>
                    <Input
                      id="start"
                      type="time"
                      value={form.start_time}
                      onChange={(e) =>
                        setForm({ ...form, start_time: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">End Time</Label>
                    <Input
                      id="end"
                      type="time"
                      value={form.end_time}
                      onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting
                      ? editingShiftId
                        ? "Updating..."
                        : "Creating..."
                      : editingShiftId
                        ? "Update Shift"
                        : "Create Shift"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Shifts</CardTitle>
            <CardDescription>Total shifts: {shifts.length}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : shifts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No shifts created yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">{shift.name}</TableCell>
                      <TableCell>{shift.start_time || "-"}</TableCell>
                      <TableCell>{shift.end_time || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={shift.is_active ? "success" : "secondary"}>
                          {shift.is_active ? "active" : "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {shift.created_at
                          ? new Date(shift.created_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            title="Update shift"
                            aria-label="Update shift"
                            onClick={() => handleEditShift(shift)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            title={shift.is_active ? "Set inactive" : "Set active"}
                            aria-label={shift.is_active ? "Set shift inactive" : "Set shift active"}
                            onClick={() => handleToggleActive(shift)}
                          >
                            {shift.is_active ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            title="Delete shift"
                            aria-label="Delete shift"
                            onClick={() => handleDeleteShift(shift.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
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
      </main>
    </div>
  );
};

export default ShiftCreator;
