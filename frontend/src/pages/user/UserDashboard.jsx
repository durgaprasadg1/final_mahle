import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { productAPI, batchAPI } from "../../lib/api";
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
  Calendar,
} from "lucide-react";
import { formatDate, formatProductType } from "../../lib/utils";
import { Link } from "react-router-dom";

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [availableShifts, setAvailableShifts] = useState([]);
  const [batchInterval, setBatchInterval] = useState("hourwise");
  const [batchTimeSlots, setBatchTimeSlots] = useState([]);
  const [selectedBatchSlot, setSelectedBatchSlot] = useState("");
  const [selectedShiftConfigId, setSelectedShiftConfigId] = useState("");
  const [reportType, setReportType] = useState("daily");
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportResults, setReportResults] = useState([]);

  const VALID_SHIFT_TYPES = ["morning", "afternoon", "night"];

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      let dateFrom, dateTo;
      const selectedDate = new Date(reportDate);

      if (reportType === "daily") {
        dateFrom = reportDate;
        dateTo = reportDate;
      } else if (reportType === "weekly") {
        // Start from Monday
        const day = selectedDate.getDay();
        const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(selectedDate.setDate(diff));
        const end = new Date(selectedDate.setDate(diff + 6));
        dateFrom = start.toISOString().split("T")[0];
        dateTo = end.toISOString().split("T")[0];
      } else if (reportType === "monthly") {
        const firstDay = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1,
        );
        const lastDay = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0,
        );
        dateFrom = firstDay.toISOString().split("T")[0];
        dateTo = lastDay.toISOString().split("T")[0];
      }

      const response = await batchAPI.getAll({
        date_from: dateFrom,
        date_to: dateTo,
        limit: 1000,
      });

      setReportResults(response.data.data);
      if (response.data.data.length === 0) {
        toast.info("No batches found for the selected period");
      }
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const downloadExcel = () => {
    if (reportResults.length === 0) {
      toast.warning("No data to download");
      return;
    }

    const headers = [
      "ID",
      "Batch Number",
      "Product",
      "Quantity",
      "Shift",
      "Start Time",
      "End Time",
      "Notes",
      "Filled By",
      "Date",
    ];

    const rows = reportResults.map((b) => [
      b.id,
      b.batch_number,
      b.product_name,
      b.quantity_produced,
      b.shift,
      b.start_time,
      b.end_time,
      (b.notes || "").replace(/,/g, " "),
      b.created_by_name,
      new Date(b.created_at).toLocaleDateString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((r) => r.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Production_Report_${reportType}_${reportDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      endTime: "06:00",
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
  const [componentSelect, setComponentSelect] = useState({
    fractileSelect: "",
    cellSelect: "",
    tierSelect: "",
  });
  const [showCustom, setShowCustom] = useState({
    fractile: false,
    cell: false,
    tier: false,
  });

  const [fractileOptions, setFractileOptions] = useState([
    "Fractile-A",
    "Fractile-B",
    "Fractile-C",
    "Fractile-D",
    "Fractile-E",
  ]);
  const [cellOptions, setCellOptions] = useState([
    "Cell-Type-1",
    "Cell-Type-2",
    "Cell-Type-3",
    "Cell-Type-4",
  ]);
  const [tierOptions, setTierOptions] = useState([
    "Top-Tier",
    "Middle-Tier",
    "Bottom-Tier",
  ]);

  const fetchComponentTemplates = async () => {
    try {
      const api = await import("../../lib/api");
      const [fRes, cRes, tRes] = await Promise.all([
        api.templateAPI.list("fractiles"),
        api.templateAPI.list("cells"),
        api.templateAPI.list("tiers"),
      ]);
      setFractileOptions(fRes.data.data.map((r) => r.name));
      setCellOptions(cRes.data.data.map((r) => r.name));
      setTierOptions(tRes.data.data.map((r) => r.name));
    } catch (e) {
      // keep defaults if backend unavailable
    }
  };

  useEffect(() => {
    fetchComponentTemplates();
  }, []);

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
  }, []);

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
      const response = await batchAPI.getAll({ limit: 100 });
      const mapped = response.data.data.map((b) => {
        let duration = 0;
        try {
          const dateStr = b.created_at
            ? new Date(b.created_at).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];
          const start = new Date(`${dateStr}T${b.start_time}`);
          let end = new Date(`${dateStr}T${b.end_time}`);

          // Handle overnight shifts
          if (end <= start) {
            end.setDate(end.getDate() + 1);
          }

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
    const value = componentInput.fractile.trim();
    if (value) {
      setProductForm({
        ...productForm,
        fractiles: [...productForm.fractiles, { name: value, count: 0 }],
      });
      setComponentInput({ ...componentInput, fractile: "" });
      setShowCustom({ ...showCustom, fractile: false });
      setComponentSelect({ ...componentSelect, fractileSelect: "" });
    }
  };

  const addCell = () => {
    const value = componentInput.cell.trim();
    if (value) {
      setProductForm({
        ...productForm,
        cells: [...productForm.cells, { name: value, count: 0 }],
      });
      setComponentInput({ ...componentInput, cell: "" });
      setShowCustom({ ...showCustom, cell: false });
      setComponentSelect({ ...componentSelect, cellSelect: "" });
    }
  };

  const addTier = () => {
    const value = componentInput.tier.trim();
    if (value) {
      setProductForm({
        ...productForm,
        tiers: [...productForm.tiers, { name: value, count: 0 }],
      });
      setComponentInput({ ...componentInput, tier: "" });
      setShowCustom({ ...showCustom, tier: false });
      setComponentSelect({ ...componentSelect, tierSelect: "" });
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

  const handleEditProduct = (product) => {
    setIsEditMode(true);
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      type: product.type,
      description: product.description || "",
      fractiles: Array.isArray(product.fractiles) ? product.fractiles : [],
      cells: Array.isArray(product.cells) ? product.cells : [],
      tiers: Array.isArray(product.tiers) ? product.tiers : [],
    });
    setShowProductModal(true);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    // Client-side validations for product
    if (!productForm.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!productForm.type) {
      toast.error("Please select a product type");
      return;
    }
    try {
      const payload = {
        name: productForm.name,
        type: productForm.type,
        description: productForm.description,
        fractiles: productForm.fractiles,
        cells: productForm.cells,
        tiers: productForm.tiers,
      };

      if (isEditMode && editingProductId) {
        await productAPI.update(editingProductId, payload);
        toast.success("Product updated successfully");
      } else {
        await productAPI.create(payload);
        toast.success("Product created successfully");
      }

      setShowProductModal(false);
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
      fetchProducts();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} product`,
      );
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      // Client-side validations for batch
      if (!batchForm.product_id) {
        toast.error("Please select a product for the batch");
        return;
      }
      const qty = parseInt(batchForm.quantity_produced, 10);
      if (!Number.isFinite(qty) || qty < 1) {
        toast.error("Quantity produced must be at least 1");
        return;
      }
      if (!batchForm.start_time || !batchForm.end_time) {
        toast.error("Start time and end time are required");
        return;
      }
      // allow end < start (cross-midnight), but disallow equal times
      if (batchForm.start_time === batchForm.end_time) {
        toast.error("End time must be different from start time");
        return;
      }
      const toTimeString = (timeValue) => {
        if (!timeValue) return null;
        return timeValue.length === 5 ? `${timeValue}:00` : timeValue;
      };

      const payload = {
        product_id: parseInt(batchForm.product_id, 10),
        quantity_produced: parseInt(batchForm.quantity_produced, 10),
        start_time: toTimeString(batchForm.start_time),
        end_time: toTimeString(batchForm.end_time),
        shift: batchForm.shift || "morning",
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
        shift: "morning",
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
          slot.startTime === batch.start_time &&
          slot.endTime === batch.end_time,
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
      toast.error(error.response?.data?.message || "Failed to delete batch");
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
      DEFAULT_SHIFT_CONFIGS.find(
        (s) => String(s.id) === String(shiftIdentifier),
      ) ||
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
    if (
      creatorId &&
      currentUserId &&
      Number(creatorId) === Number(currentUserId)
    ) {
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
    if (
      creatorId &&
      currentUserId &&
      Number(creatorId) === Number(currentUserId)
    ) {
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReportModal(true)}
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Reports
              </Button>
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
                  <div className="flex items-center gap-2">
                    <Button onClick={() => setShowProductModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                    <Link to="/templates/fractiles">
                      <Button variant="outline">Manage Components</Button>
                    </Link>
                  </div>
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
                      <TableHead>Created By</TableHead>
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
                              {getProductCreatorName(product)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(
                                product.created_at,
                              ).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {user?.permissions?.update && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditProduct(product)}
                                >
                                  <Edit className="w-4 h-4 text-blue-600" />
                                </Button>
                              )}
                              {user?.permissions?.delete && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleDeleteProduct(product.id)
                                  }
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              )}
                            </div>
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
                    <TableHead>Filled By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                          {getBatchCreatorName(batch)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(batch.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {user?.permissions?.update && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditBatch(batch)}
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                          {user?.permissions?.delete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteBatch(batch.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
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

      {/* Create/Edit Product Modal */}
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
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProduct} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="cell" className="text-sm">
                      Cells
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        id="cell"
                        value={componentSelect.cellSelect}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "create_new") {
                            setShowCustom({ ...showCustom, cell: true });
                            setComponentSelect({
                              ...componentSelect,
                              cellSelect: "",
                            });
                          } else if (val) {
                            setProductForm({
                              ...productForm,
                              cells: [
                                ...productForm.cells,
                                { name: val, count: 0 },
                              ],
                            });
                            setComponentSelect({
                              ...componentSelect,
                              cellSelect: "",
                            });
                          }
                        }}
                      >
                        <option value="">Select Cell</option>
                        {cellOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
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

                  <div className="space-y-2">
                    <Label htmlFor="tier" className="text-sm">
                      Tiers
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        id="tier"
                        value={componentSelect.tierSelect}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "create_new") {
                            setShowCustom({ ...showCustom, tier: true });
                            setComponentSelect({
                              ...componentSelect,
                              tierSelect: "",
                            });
                          } else if (val) {
                            setProductForm({
                              ...productForm,
                              tiers: [
                                ...productForm.tiers,
                                { name: val, count: 0 },
                              ],
                            });
                            setComponentSelect({
                              ...componentSelect,
                              tierSelect: "",
                            });
                          }
                        }}
                      >
                        <option value="">Select Tier</option>
                        {tierOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
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
                  onClick={() => setShowProductModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditMode ? "Update Product" : "Create Product"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Batch Modal */}
      {activeTab === "batches" && (
        <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Production Batch</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateBatch} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              <div className="space-y-2">
                <Label>Shift *</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {getShiftChoices().map((shiftConfig) => (
                    <label
                      key={`${shiftConfig.id}-${shiftConfig.backendShift}`}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer ${
                        (
                          selectedShiftConfigId
                            ? String(selectedShiftConfigId) ===
                              String(shiftConfig.id)
                            : (batchForm.shift || "morning") ===
                              shiftConfig.backendShift
                        )
                          ? "border-primary bg-primary/5"
                          : "border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shift"
                        value={shiftConfig.id}
                        checked={
                          selectedShiftConfigId
                            ? String(selectedShiftConfigId) ===
                              String(shiftConfig.id)
                            : (batchForm.shift || "morning") ===
                              shiftConfig.backendShift
                        }
                        onChange={() =>
                          applyShiftConfigToBatchForm(shiftConfig.id)
                        }
                      />
                      <span className="text-sm">
                        {getShiftLabel(shiftConfig)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeSlot">Time Slot *</Label>
                <Select
                  id="timeSlot"
                  value={selectedBatchSlot}
                  onChange={(e) => {
                    const slotValue = e.target.value;
                    setSelectedBatchSlot(slotValue);

                    const selectedSlot = batchTimeSlots.find(
                      (slot) => slot.value === slotValue,
                    );

                    if (!selectedSlot) return;

                    setBatchForm((prev) => ({
                      ...prev,
                      start_time: selectedSlot.startTime,
                      end_time: selectedSlot.endTime,
                    }));
                  }}
                  required
                >
                  <option value="">Select slot</option>
                  {batchTimeSlots
                    .filter((slot) => {
                      // Don't show slots that have already been used for this product TODAY
                      const isCurrentSlotSelected =
                        batchForm.start_time === slot.startTime &&
                        batchForm.end_time === slot.endTime;
                      if (isCurrentSlotSelected) return true;

                      const today = new Date().toISOString().split("T")[0];
                      const isUsed = batches.some((b) => {
                        const batchDate = b.created_at
                          ? new Date(b.created_at).toISOString().split("T")[0]
                          : today;

                        const normStartTime = (b.start_time || "").substring(
                          0,
                          5,
                        );
                        const normEndTime = (b.end_time || "").substring(0, 5);

                        return (
                          String(b.product_id) ===
                            String(batchForm.product_id) &&
                          normStartTime ===
                            (slot.startTime || "").substring(0, 5) &&
                          normEndTime ===
                            (slot.endTime || "").substring(0, 5) &&
                          batchDate === today
                        );
                      });
                      return !isUsed;
                    })
                    .map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                </Select>
                <p className="text-xs text-gray-500">
                  Slot list is auto-generated from admin shift timing and
                  interval.
                </p>
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

      {/* Reports Modal */}
      <Dialog
        open={showReportModal}
        onOpenChange={(open) => {
          setShowReportModal(open);
          if (!open) setReportResults([]);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Production Reports</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Select {reportType === "monthly" ? "Month" : "Date"}
                </Label>
                <Input
                  type={reportType === "monthly" ? "month" : "date"}
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </div>
              <div className="flex items-end space-x-2">
                <Button
                  className="flex-1"
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                >
                  {isGeneratingReport ? "Generating..." : "Generate"}
                </Button>
                {reportResults.length > 0 && (
                  <Button
                    variant="outline"
                    className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                    onClick={downloadExcel}
                  >
                    Export CSV
                  </Button>
                )}
              </div>
            </div>

            {reportResults.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm font-medium text-blue-800">
                        Total Batches
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="text-xl font-bold text-blue-900">
                        {reportResults.length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm font-medium text-green-800">
                        Total Quantity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="text-xl font-bold text-green-900">
                        {reportResults.reduce(
                          (sum, b) => sum + (b.quantity_produced || 0),
                          0,
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 border-purple-200">
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm font-medium text-purple-800">
                        Unique Products
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="text-xl font-bold text-purple-900">
                        {new Set(reportResults.map((b) => b.product_id)).size}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Worker</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportResults.slice(0, 50).map((b) => (
                        <TableRow key={b.id}>
                          <TableCell>
                            {new Date(b.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="capitalize">
                            {b.shift}
                          </TableCell>
                          <TableCell className="font-medium">
                            {b.product_name}
                          </TableCell>
                          <TableCell>{b.quantity_produced}</TableCell>
                          <TableCell className="text-xs">
                            {b.created_by_name}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {reportResults.length > 50 && (
                    <div className="p-4 text-center text-sm text-gray-500 italic">
                      Showing first 50 results. Download full CSV for all data.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDashboard;
