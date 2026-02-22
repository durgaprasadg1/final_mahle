import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { IoToggle } from "react-icons/io5";
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
import { Clock, Plus, Edit, Trash2, ArrowLeft } from "lucide-react";

const ShiftDashboard = ({ onBack }) => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startTime: "",
    endTime: "",
    timeInterval: "hourwise",
    color: "#3b82f6",
    isActive: true,
  });

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      setLoading(true);

      const savedShifts = localStorage.getItem("shifts");
      if (savedShifts) {
        setShifts(JSON.parse(savedShifts));
      }
    } catch (error) {
      toast.error("Failed to fetch shifts");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.name.trim()) {
      toast.error("Shift name is required");
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error("Start and end times are required");
      return;
    }

    try {
      const newShift = {
        id: editingShift?.id || Date.now(),
        ...formData,
        createdAt: editingShift?.createdAt || new Date().toISOString(),
      };

      let updatedShifts;
      if (editingShift) {
        updatedShifts = shifts.map((s) =>
          s.id === editingShift.id ? newShift : s,
        );
        toast.success("Shift updated successfully");
      } else {
        updatedShifts = [...shifts, newShift];
        toast.success("Shift created successfully");
      }

      setShifts(updatedShifts);
      localStorage.setItem("shifts", JSON.stringify(updatedShifts));

      setShowCreateModal(false);
      setEditingShift(null);
      resetForm();
    } catch (error) {
      toast.error(error.message || "Failed to create shift");
    }
  };

  const handleEditShift = (shift) => {
    setEditingShift(shift);
    setFormData(shift);
    setShowCreateModal(true);
  };

  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm("Are you sure you want to delete this shift?")) return;

    try {
      const updatedShifts = shifts.filter((s) => s.id !== shiftId);
      setShifts(updatedShifts);
      localStorage.setItem("shifts", JSON.stringify(updatedShifts));
      toast.success("Shift deleted successfully");
    } catch (error) {
      toast.error("Failed to delete shift");
    }
  };

  const handleToggleStatus = (shiftId) => {
    const updatedShifts = shifts.map((shift) => {
      if (shift.id === shiftId) {
        const newStatus = !shift.isActive;
        toast.success(`Shift marked as ${newStatus ? "Active" : "Inactive"}`);
        return { ...shift, isActive: newStatus };
      }
      return shift;
    });

    setShifts(updatedShifts);
    localStorage.setItem("shifts", JSON.stringify(updatedShifts));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startTime: "",
      endTime: "",
      timeInterval: "hourwise",
      color: "#3b82f6",
      isActive: true,
    });
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingShift(null);
    resetForm();
  };

  const calculateDuration = (startTime, endTime) => {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    const durationMin = endTotalMin - startTotalMin;

    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;

    return `${hours}h ${mins}m`;
  };

  const generateTimeSlots = (start, end, interval) => {
    if (!start || !end) return [];

    let intervalMin = 60; // Default rahega yeh
    if (interval === "halfhourwise" || interval === "30minutes")
      intervalMin = 30;
    if (interval === "15minutes") intervalMin = 15;

    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);

    let startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;

    //overnight shift ko handle karne ke liye
    if (endTotal <= startTotal) {
      endTotal += 24 * 60;
    }

    const slots = [];
    let current = startTotal;

    const formatTime = (totalMin) => {
      const h = Math.floor(totalMin / 60) % 24;
      const m = totalMin % 60;
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    };

    while (current < endTotal) {
      let next = current + intervalMin;
      if (next > endTotal) next = endTotal; // Cap the last slot at the actual end time

      slots.push(`${formatTime(current)} - ${formatTime(next)}`);
      current = next;
    }

    return slots;
  };

  const timeSlotsPreview = generateTimeSlots(
    formData.startTime,
    formData.endTime,
    formData.timeInterval,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <Clock className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Shift Manager
              </h1>
              <p className="text-sm text-gray-500">
                Manage shift schedules and timings
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Shifts
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shifts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Shifts
              </CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {shifts.filter((s) => s.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Inactive Shifts
              </CardTitle>
              <Clock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {shifts.filter((s) => !s.isActive).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Shift
          </Button>
        </div>

        {/* Shifts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Shifts</CardTitle>
            <CardDescription>
              Manage all shifts and their configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading shifts...</div>
            ) : shifts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No shifts created yet. Click "Create New Shift" to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shift Name</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Interval</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell>
                          <div className="font-medium">{shift.name}</div>
                          {shift.description && (
                            <div className="text-sm text-gray-500">
                              {shift.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {shift.startTime} - {shift.endTime}
                        </TableCell>
                        <TableCell>
                          {calculateDuration(shift.startTime, shift.endTime)  < 0 ? `(Overnight Shift) ${calculateDuration(shift.startTime, shift.endTime)}` : calculateDuration(shift.startTime, shift.endTime)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{shift.timeInterval}</Badge>
                        </TableCell>
                        {/* 1. Status Column */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              shift.isActive
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }
                          >
                            {shift.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>

                        {/* 2. Actions Column */}
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {/* Toggle Status Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(shift.id)}
                              className={
                                shift.isActive
                                  ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                  : "text-green-600 hover:text-green-700 hover:bg-green-50"
                              }
                            >
                              <IoToggle
                                className={`w-7 h-7 transition-transform duration-200 ${
                                  shift.isActive ? "" : "rotate-180 opacity-70"
                                }`}
                              />
                            </Button>

                            {/* Edit Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditShift(shift)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteShift(shift.id)}
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
      </div>

      {/*  */}
      {/* Create/Edit Shift Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col relative">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-600 sticky top-0 bg-white z-10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingShift ? "Edit Shift" : "Create New Shift"}
                </h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Form) */}
            <div className="p-6">
              <form onSubmit={handleCreateShift} className="space-y-6">
                {/* Row 1: Name and Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Shift Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Morning Shift"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Brief description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Row 2: Timing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      name="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Row 3: Division & Color */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeInterval">Divide Time In</Label>
                    <Select
                      name="timeInterval"
                      value={formData.timeInterval}
                      onChange={handleInputChange}
                      className="w-full mt-1"
                    >
                      <option value="hourwise">Hourwise</option>
                      <option value="halfhourwise">Half-Hourwise</option>
                      <option value="15minutes">15 Minutes</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="color">Color Code</Label>
                    <div className="flex items-center space-x-3 mt-1">
                      <Input
                        id="color"
                        name="color"
                        type="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        className="w-14 h-10 p-1 cursor-pointer"
                      />
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 border">
                        {formData.color}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <Label
                    htmlFor="isActive"
                    className="mb-0 cursor-pointer font-medium"
                  >
                    Mark as Active
                  </Label>
                </div>

                {/* Time Slots Preview Box */}
                {timeSlotsPreview.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <Label className="text-gray-700 mb-2 block font-semibold text-sm">
                      Generated Time Slots Preview
                    </Label>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                      {timeSlotsPreview.map((slot, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="font-mono text-xs py-1"
                        >
                          {slot}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingShift ? "Update Shift" : "Create Shift"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftDashboard;
