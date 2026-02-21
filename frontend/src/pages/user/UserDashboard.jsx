import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { productAPI, batchAPI, shiftAPI } from "../../lib/api";
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
} from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { toast } from "react-toastify";
import {
  Package,
  Plus,
  LogOut,
  Clock,
  TrendingUp,
  Edit,
  Trash2,
} from "lucide-react";
import { formatDate, formatProductType } from "../../lib/utils";
import { Link } from "react-router-dom";

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [shiftOptions, setShiftOptions] = useState([
    { value: "morning", label: "Morning" },
    { value: "afternoon", label: "Afternoon" },
    { value: "night", label: "Night" },
  ]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [editingProductId, setEditingProductId] = useState(null);
  const [availableShifts, setAvailableShifts] = useState([]);
  const [batchInterval, setBatchInterval] = useState("hourwise");
  const [batchTimeSlots, setBatchTimeSlots] = useState([]);
  const [selectedBatchSlot, setSelectedBatchSlot] = useState("");
  const [selectedShiftConfigId, setSelectedShiftConfigId] = useState("");

  const VALID_SHIFT_TYPES = ["morning", "afternoon", "night"];
  const DEFAULT_SHIFT_CONFIGS = [
    {
      id: "shift-morning",
      name: "Morning",
      startTime: "06:00",
      endTime: "14:00",
      timeInterval: "hourwise",
      backendShift: "morning",
      isActive: true,
    },
    {
      id: "shift-afternoon",
      name: "Afternoon",
      startTime: "14:00",
      endTime: "22:00",
      timeInterval: "hourwise",
      backendShift: "afternoon",
      isActive: true,
    },
    {
      id: "shift-night",
      name: "Night",
      startTime: "22:00",
      endTime: "23:59",
      timeInterval: "hourwise",
      backendShift: "night",
      isActive: true,
    },
  ];

  const [productForm, setProductForm] = useState({
    name: "",
    type: "",
    description: "",
    fractiles: [],
    cells: [],
    tiers: [],
  });

  const [componentInput, setComponentInput] = useState({
    fractile: "",
    cell: "",
    tier: "",
  });

  const [batchForm, setBatchForm] = useState({
    product_id: "",
    quantity_produced: "",
    start_time: "",
    end_time: "",
    shift: "morning",
    notes: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchBatches();
    fetchProductTypes();
    fetchShifts();
  }, []);

  const normalizeShiftValue = (shiftName) => {
    const normalized = String(shiftName || "")
      .trim()
      .toLowerCase();

    if (normalized.includes("morning")) return "morning";
    if (normalized.includes("afternoon")) return "afternoon";
    if (normalized.includes("night")) return "night";

    return normalized;
  };

  const getDefaultShift = () => shiftOptions[0]?.value || "morning";

  useEffect(() => {
    if (!shiftOptions.some((shift) => shift.value === batchForm.shift)) {
      setBatchForm((prev) => ({ ...prev, shift: getDefaultShift() }));
    }
  }, [shiftOptions]);

  const fetchShifts = async () => {
    try {
      const response = await shiftAPI.getAll({ is_active: true });
      const shifts = response.data?.data || [];
      const validValues = new Set(["morning", "afternoon", "night"]);

      const mapped = shifts
        .map((shift) => {
          const value = normalizeShiftValue(shift.name);
          return {
            value,
            label: shift.name,
          };
        })
        .filter((shift) => validValues.has(shift.value));

      const unique = mapped.filter(
        (shift, index, arr) =>
          arr.findIndex((item) => item.value === shift.value) === index,
      );

      if (unique.length > 0) {
        setShiftOptions(unique);
      }
    } catch (error) {
      console.error("Failed to fetch shifts");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({ with_components: true });
      setProducts(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await batchAPI.getAll({ limit: 50 });
      const mapped = response.data.data.map((b) => {
        let duration = 0;
        try {
          const today = new Date().toISOString().split("T")[0];
          const start = new Date(`${today}T${b.start_time}`);
          const end = new Date(`${today}T${b.end_time}`);
          duration = Math.round((end - start) / 60000);
        } catch (e) {
          duration = 0;
        }

        return {
          ...b,
          duration_minutes: duration,
        };
      });

      setBatches(mapped);
    } catch (error) {
      toast.error("Failed to fetch batches");
    }
  };

  const fetchProductTypes = async () => {
    try {
      const response = await productAPI.getTypes();
      setProductTypes(response.data.data);
    } catch (error) {
      console.error("Failed to fetch product types");
    }
  };

  const addFractile = () => {
    if (componentInput.fractile.trim()) {
      setProductForm({
        ...productForm,
        fractiles: [
          ...productForm.fractiles,
          { name: componentInput.fractile, count: 0 },
        ],
      });
      setComponentInput({ ...componentInput, fractile: "" });
    }
  };

  const addCell = () => {
    if (componentInput.cell.trim()) {
      setProductForm({
        ...productForm,
        cells: [...productForm.cells, { name: componentInput.cell, count: 0 }],
      });
      setComponentInput({ ...componentInput, cell: "" });
    }
  };

  const addTier = () => {
    if (componentInput.tier.trim()) {
      setProductForm({
        ...productForm,
        tiers: [...productForm.tiers, { name: componentInput.tier, count: 0 }],
      });
      setComponentInput({ ...componentInput, tier: "" });
    }
  };

  const removeFractile = (index) => {
    setProductForm({
      ...productForm,
      fractiles: productForm.fractiles.filter((_, i) => i !== index),
    });
  };

  const removeCell = (index) => {
    setProductForm({
      ...productForm,
      cells: productForm.cells.filter((_, i) => i !== index),
    });
  };

  const removeTier = (index) => {
    setProductForm({
      ...productForm,
      tiers: productForm.tiers.filter((_, i) => i !== index),
    });
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      type: "",
      description: "",
      fractiles: [],
      cells: [],
      tiers: [],
    });
    setComponentInput({ fractile: "", cell: "", tier: "" });
    setEditingProductId(null);
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || "",
      type: product.type || "",
      description: product.description || "",
      fractiles: Array.isArray(product.fractiles) ? product.fractiles : [],
      cells: Array.isArray(product.cells) ? product.cells : [],
      tiers: Array.isArray(product.tiers) ? product.tiers : [],
    });
    setComponentInput({ fractile: "", cell: "", tier: "" });
    setShowProductModal(true);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: productForm.name,
        type: productForm.type,
        description: productForm.description,
        fractiles: productForm.fractiles,
        cells: productForm.cells,
        tiers: productForm.tiers,
      };

      if (editingProductId) {
        await productAPI.update(editingProductId, payload);
        toast.success("Product updated successfully");
      } else {
        await productAPI.create(payload);
        toast.success("Product created successfully");
      }

      setShowProductModal(false);
      resetProductForm();
      fetchProducts();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${editingProductId ? "update" : "create"} product`,
      );
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      const toTimeString = (timeValue) => {
        if (!timeValue) return null;
        return timeValue.length === 5 ? `${timeValue}:00` : timeValue;
      };

      const payload = {
        product_id: parseInt(batchForm.product_id, 10),
        quantity_produced: parseInt(batchForm.quantity_produced, 10),
        start_time: toTimeString(batchForm.start_time),
        end_time: toTimeString(batchForm.end_time),
        shift: batchForm.shift || getDefaultShift(),
        notes: batchForm.notes,
      };

      await batchAPI.create(payload);
      toast.success("Batch created successfully");
      setShowBatchModal(false);
      setBatchForm({
        product_id: "",
        quantity_produced: "",
        start_time: "",
        end_time: "",
        shift: getDefaultShift(),
        notes: "",
      });
      setSelectedBatchSlot("");
      setBatchTimeSlots([]);
      setBatchInterval("hourwise");
      fetchBatches();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create batch");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    try {
      await productAPI.delete(productId);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleEditBatch = (batch) => {
    setBatchForm({
      product_id: String(batch.product_id),
      quantity_produced: String(batch.quantity_produced),
      start_time: batch.start_time || "",
      end_time: batch.end_time || "",
      shift: batch.shift || "morning",
      notes: batch.notes || "",
    });

    const shiftConfig =
      availableShifts.find((s) => s.backendShift === batch.shift) ||
      DEFAULT_SHIFT_CONFIGS.find((s) => s.backendShift === batch.shift);

    if (shiftConfig) {
      setSelectedShiftConfigId(String(shiftConfig.id));
      const slots = generateTimeSlots(
        shiftConfig.startTime,
        shiftConfig.endTime,
        shiftConfig.timeInterval,
      );
      setBatchTimeSlots(slots);

      const matchedSlot = slots.find(
        (slot) =>
          slot.startTime === batch.start_time && slot.endTime === batch.end_time,
      );
      setSelectedBatchSlot(matchedSlot?.value || "");
    }

    setShowBatchModal(true);
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm("Are you sure you want to delete this batch?")) return;

    try {
      await batchAPI.delete(batchId);
      toast.success("Batch deleted successfully");
      fetchBatches();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete batch"
      );
    }
  };

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully");
  };

  const resolveShiftType = (shiftConfig = {}) => {
    const shiftLabel = String(
      shiftConfig.shiftType || shiftConfig.type || shiftConfig.name || "",
    )
      .toLowerCase()
      .trim();

    if (VALID_SHIFT_TYPES.includes(shiftLabel)) {
      return shiftLabel;
    }

    if (shiftLabel.includes("morn")) return "morning";
    if (shiftLabel.includes("after")) return "afternoon";
    if (shiftLabel.includes("night")) return "night";

    const [startHour] = String(shiftConfig.startTime || "")
      .split(":")
      .map(Number);
    if (Number.isFinite(startHour)) {
      if (startHour < 12) return "morning";
      if (startHour < 19) return "afternoon";
      return "night";
    }

    return "morning";
  };

  const getIntervalMinutes = (interval = "hourwise") => {
    if (interval === "halfhourwise" || interval === "30minutes") return 30;
    return 60;
  };

  const generateTimeSlots = (start, end, interval) => {
    if (!start || !end) return [];

    const stepMinutes = getIntervalMinutes(interval);
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);

    let startTotal = startHour * 60 + startMin;
    let endTotal = endHour * 60 + endMin;
    if (endTotal <= startTotal) {
      endTotal += 24 * 60;
    }

    const formatClock = (minutesTotal) => {
      const hour = Math.floor(minutesTotal / 60) % 24;
      const minute = minutesTotal % 60;
      return `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
    };

    const slots = [];
    let current = startTotal;

    while (current < endTotal) {
      const next = Math.min(current + stepMinutes, endTotal);
      slots.push({
        value: `${formatClock(current)}|${formatClock(next)}`,
        label: `${formatClock(current)} - ${formatClock(next)}`,
        startTime: formatClock(current),
        endTime: formatClock(next),
      });
      current = next;
    }

    return slots;
  };

  const loadBatchShiftConfigs = () => {
    try {
      const rawShifts = localStorage.getItem("shifts");
      if (!rawShifts) return DEFAULT_SHIFT_CONFIGS;

      const parsedShifts = JSON.parse(rawShifts);
      if (!Array.isArray(parsedShifts) || parsedShifts.length === 0) {
        return DEFAULT_SHIFT_CONFIGS;
      }

      const mapped = parsedShifts
        .filter((shift) => shift?.isActive !== false)
        .map((shift, index) => ({
          id: shift.id || `${shift.name || "shift"}-${index}`,
          name: shift.name || "Shift",
          description: shift.description || "",
          startTime: shift.startTime || "",
          endTime: shift.endTime || "",
          timeInterval: shift.timeInterval || "hourwise",
          backendShift: resolveShiftType(shift),
          isActive: shift.isActive !== false,
        }));

      return mapped.length > 0 ? mapped : DEFAULT_SHIFT_CONFIGS;
    } catch (error) {
      return DEFAULT_SHIFT_CONFIGS;
    }
  };

  const applyShiftConfigToBatchForm = (
    shiftIdentifier,
    intervalOverride = null,
    shiftConfigs = availableShifts,
  ) => {
    const config =
      shiftConfigs.find((s) => String(s.id) === String(shiftIdentifier)) ||
      shiftConfigs.find((s) => s.backendShift === shiftIdentifier) ||
      DEFAULT_SHIFT_CONFIGS.find((s) => String(s.id) === String(shiftIdentifier)) ||
      DEFAULT_SHIFT_CONFIGS.find((s) => s.backendShift === shiftIdentifier) ||
      DEFAULT_SHIFT_CONFIGS[0];

    const resolvedShiftType = config?.backendShift || "morning";

    const nextInterval = intervalOverride || config?.timeInterval || "hourwise";
    const nextSlots = generateTimeSlots(
      config?.startTime,
      config?.endTime,
      nextInterval,
    );

    setSelectedShiftConfigId(config?.id ? String(config.id) : "");
    setBatchInterval(nextInterval);
    setBatchTimeSlots(nextSlots);
    setSelectedBatchSlot("");

    if (config?.startTime && config?.endTime) {
      setBatchForm((prev) => ({
        ...prev,
        shift: resolvedShiftType,
        start_time: config.startTime,
        end_time: config.endTime,
      }));
      return;
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const toTimeValue = (date) => date.toTimeString().slice(0, 5);

    setBatchForm((prev) => ({
      ...prev,
      shift: resolvedShiftType,
      start_time: toTimeValue(oneHourAgo),
      end_time: toTimeValue(now),
    }));
  };

  const getShiftLabel = (shiftConfig) => {
    const timeText =
      shiftConfig.startTime && shiftConfig.endTime
        ? ` (${shiftConfig.startTime} - ${shiftConfig.endTime})`
        : "";
    return `${shiftConfig.name}${timeText}`;
  };

  const getProductCreatorName = (product) => {
    const creatorName =
      product.created_by_name ||
      product.createdByName ||
      product.created_by_user?.name ||
      product.user_name;

    if (creatorName) return creatorName;

    const creatorId = product.created_by || product.createdBy;
    const currentUserId = user?.id || user?.user_id;
    if (creatorId && currentUserId && Number(creatorId) === Number(currentUserId)) {
      return user?.name || "You";
    }

    return "Unknown";
  };

  const getBatchCreatorName = (batch) => {
    const creatorName =
      batch.created_by_name ||
      batch.createdByName ||
      batch.created_by_user?.name ||
      batch.user_name;

    if (creatorName) return creatorName;

    const creatorId = batch.created_by || batch.createdBy;
    const currentUserId = user?.id || user?.user_id;
    if (creatorId && currentUserId && Number(creatorId) === Number(currentUserId)) {
      return user?.name || "You";
    }

    return "Unknown";
  };

  const formatSlotStart = (timeValue) => {
    if (!timeValue) return "-";
    const str = String(timeValue);
    const parts = str.split(":");
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    }
    return str;
  };

  const getShiftChoices = () => {
    return availableShifts.length > 0 ? availableShifts : DEFAULT_SHIFT_CONFIGS;
  };

  useEffect(() => {
    if (showBatchModal) {
      const shiftConfigs = loadBatchShiftConfigs();
      setAvailableShifts(shiftConfigs);

      const defaultShiftConfig =
        shiftConfigs.find((s) => s.backendShift === batchForm.shift) ||
        shiftConfigs[0];

      if (defaultShiftConfig) {
        applyShiftConfigToBatchForm(defaultShiftConfig.id, null, shiftConfigs);
      }
    }
  }, [showBatchModal]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Package className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Production Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  {user?.unit_name} - {user?.unit_code}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
              <CardTitle className="text-sm font-medium">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Batches
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{batches.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Production
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {batches.reduce(
                  (sum, batch) => sum + batch.quantity_produced,
                  0,
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("products")}
                className={`${
                  activeTab === "products"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab("batches")}
                className={`${
                  activeTab === "batches"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Batches
              </button>
            </nav>
          </div>
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>
                    Manage products for your unit
                  </CardDescription>
                </div>
                {user?.permissions?.create && (
                  <Button 
                    onClick={() => {
                      resetProductForm();
                      setShowProductModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New
                  </Button>
                )}
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
                      <TableHead>Type</TableHead>
                      <TableHead>Components</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const fractiles = Array.isArray(product.fractiles)
                        ? product.fractiles
                        : [];
                      const cells = Array.isArray(product.cells)
                        ? product.cells
                        : [];
                      const tiers = Array.isArray(product.tiers)
                        ? product.tiers
                        : [];
                      const totalComponents =
                        fractiles.length + cells.length + tiers.length;

                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {formatProductType(product.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {totalComponents > 0 ? (
                              <div className="space-y-1">
                                {fractiles.length > 0 && (
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-xs font-semibold text-blue-600">
                                      Fractiles:
                                    </span>
                                    {fractiles.map((f, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {f.name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {cells.length > 0 && (
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-xs font-semibold text-green-600">
                                      Cells:
                                    </span>
                                    {cells.map((c, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {c.name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {tiers.length > 0 && (
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-xs font-semibold text-purple-600">
                                      Tiers:
                                    </span>
                                    {tiers.map((t, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {t.name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">
                                No components
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {product.created_by_name || "Unknown"}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(
                                product.created_at,
                              ).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {user?.permissions?.update && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={!user?.permissions?.delete}
                              title={
                                user?.permissions?.delete
                                  ? "Delete product"
                                  : "Delete permission required"
                              }
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Batches Tab */}
        {activeTab === "batches" && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Production Batches</CardTitle>
                  <CardDescription>
                    Track manufacturing batches (1-hour production cycles)
                  </CardDescription>
                </div>
                {user?.permissions?.create && (
                  <Button onClick={() => setShowBatchModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Record Batch
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Slot Start</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium font-mono text-xs">
                        {batch.batch_number}
                      </TableCell>
                      <TableCell>{batch.product_name}</TableCell>
                      <TableCell className="font-semibold">
                        {batch.quantity_produced}
                      </TableCell>
                      <TableCell>{formatSlotStart(batch.start_time)}</TableCell>
                      <TableCell>
                        <Badge variant="success">{batch.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {batch.created_by_name || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(batch.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Create Product Modal */}
      {activeTab === "products" && (
        <Dialog
          open={showProductModal}
          onOpenChange={(open) => {
            setShowProductModal(open);
            if (!open) {
              setIsEditMode(false);
              setEditingProductId(null);
              setProductForm({
                name: "",
                type: "",
                description: "",
                fractiles: [],
                cells: [],
                tiers: [],
              });
              setComponentInput({ fractile: "", cell: "", tier: "" });
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProductId ? "Update Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProduct} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productType">Product Type *</Label>
                <Select
                  id="productType"
                  value={productForm.type}
                  onChange={(e) =>
                    setProductForm({ ...productForm, type: e.target.value })
                  }
                  required
                >
                  <option value="">Select Type</option>
                  {productTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatProductType(type)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-4 border-t pt-4">
                <Label className="text-base font-semibold">Components</Label>

                {/* Fractiles */}
                <div className="space-y-2">
                  <Label htmlFor="fractile" className="text-sm">
                    Fractiles
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      id="fractile"
                      value={componentSelect.fractileSelect}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "create_new") {
                          setShowCustom({ ...showCustom, fractile: true });
                          setComponentSelect({
                            ...componentSelect,
                            fractileSelect: "",
                          });
                        } else if (val) {
                          setProductForm({
                            ...productForm,
                            fractiles: [
                              ...productForm.fractiles,
                              { name: val, count: 0 },
                            ],
                          });
                          setComponentSelect({
                            ...componentSelect,
                            fractileSelect: "",
                          });
                        }
                      }}
                    >
                      <option value="">Select Fractile</option>
                      {fractileOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                    
                  </div>
                  {productForm.fractiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {productForm.fractiles.map((f, idx) => (
                        <Badge key={idx} variant="secondary">
                          {f.name}
                          <button
                            type="button"
                            onClick={() => removeFractile(idx)}
                            className="ml-2 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cells */}
                <div className="space-y-2">
                  <Label htmlFor="cell" className="text-sm">
                    Cells
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      id="cell"
                      value={componentInput.cell}
                      onChange={(e) =>
                        setComponentInput({
                          ...componentInput,
                          cell: e.target.value,
                        })
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCell();
                        }
                      }}
                      placeholder="Enter cell..."
                      className="border border-gray-400"
                    />
                    <Button type="button" onClick={addCell} variant="outline">
                      Add
                    </Button>
                  </div>
                  {productForm.cells.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {productForm.cells.map((c, idx) => (
                        <Badge key={idx} variant="secondary">
                          {c.name}
                          <button
                            type="button"
                            onClick={() => removeCell(idx)}
                            className="ml-2 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tiers */}
                <div className="space-y-2">
                  <Label htmlFor="tier" className="text-sm">
                    Tiers
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      id="tier"
                      value={componentInput.tier}
                      onChange={(e) =>
                        setComponentInput({
                          ...componentInput,
                          tier: e.target.value,
                        })
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTier();
                        }
                      }}
                      placeholder="Enter tier..."
                      className="border border-gray-400"
                    />
                    <Button type="button" onClick={addTier} variant="outline">
                      Add
                    </Button>
                  </div>
                  {productForm.tiers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {productForm.tiers.map((t, idx) => (
                        <Badge key={idx} variant="secondary">
                          {t.name}
                          <button
                            type="button"
                            onClick={() => removeTier(idx)}
                            className="ml-2 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowProductModal(false);
                    resetProductForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProductId ? "Update Product" : "Create Product"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Batch Modal */}
      {activeTab === "batches" && (
        <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
          <DialogContent className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Production Batch</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateBatch} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="batchProduct">Product *</Label>
                <Select
                  id="batchProduct"
                  value={batchForm.product_id}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, product_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({formatProductType(product.type)})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Produced *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={batchForm.quantity_produced}
                  onChange={(e) =>
                    setBatchForm({
                      ...batchForm,
                      quantity_produced: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift">Shift *</Label>
                <Select
                  id="shift"
                  value={batchForm.shift || "morning"}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, shift: e.target.value })
                  }
                  required
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="night">Night</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time (HH:MM) *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={batchForm.start_time}
                    onChange={(e) =>
                      setBatchForm({
                        ...batchForm,
                        start_time: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time (HH:MM) *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={batchForm.end_time}
                    onChange={(e) =>
                      setBatchForm({
                        ...batchForm,
                        end_time: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={batchForm.notes}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, notes: e.target.value })
                  }
                  rows={3}
                  className="border border-gray-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBatchModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Record Batch</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserDashboard;
