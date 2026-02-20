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
import { formatProductType, formatTime } from "../../lib/utils";

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

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully");
  };

  useEffect(() => {
    if (showBatchModal) {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const formatTimeValue = (date) => {
        return date.toTimeString().slice(0, 5); // HH:MM format
      };

      setBatchForm((prev) => ({
        ...prev,
        start_time: formatTimeValue(oneHourAgo),
        end_time: formatTimeValue(now),
      }));
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
                            {new Date(product.created_at).toLocaleDateString()}
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
                    <TableHead>Start Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
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
                      <TableCell>{formatTime(batch.start_time)}</TableCell>
                      <TableCell>{batch.duration_minutes} min</TableCell>
                      <TableCell>
                        <Badge variant="success">{batch.status}</Badge>
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
        <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
          <DialogContent className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProductId ? "Update Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProduct} className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 p-3 rounded">
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm({ ...productForm, name: e.target.value })
                    }
                    required
                    className="border border-gray-400"
                  />
                </div>

                <div className="space-y-2 p-3 rounded">
                  <Label htmlFor="productType">Product Type *</Label>
                  <Select
                    id="productType"
                    value={productForm.type}
                    onChange={(e) =>
                      setProductForm({ ...productForm, type: e.target.value })
                    }
                    required
                    className="border border-gray-400"
                  >
                    <option value="">Select Type</option>
                    {productTypes.map((type) => (
                      <option key={type} value={type}>
                        {formatProductType(type)}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2 p-3 rounded">
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
                    rows={1}
                    className="border border-gray-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Fractiles</h3>
                  <div className="flex gap-2 p-3 rounded">
                    <Input
                      id="fractile"
                      value={componentInput.fractile}
                      onChange={(e) =>
                        setComponentInput({
                          ...componentInput,
                          fractile: e.target.value,
                        })
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFractile();
                        }
                      }}
                      placeholder="Enter fractile..."
                      className="border border-gray-400"
                    />
                    <Button type="button" onClick={addFractile} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {productForm.fractiles.map((fractile, index) => (
                      <Badge key={index} variant="secondary">
                        {fractile.name}
                        <button
                          type="button"
                          onClick={() => removeFractile(index)}
                          className="ml-2 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Cells</h3>
                  <div className="flex gap-2 p-3 rounded">
                    <Input
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
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {productForm.cells.map((cell, index) => (
                      <Badge key={index} variant="secondary">
                        {cell.name}
                        <button
                          type="button"
                          onClick={() => removeCell(index)}
                          className="ml-2 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Tiers</h3>
                  <div className="flex gap-2 p-3 rounded">
                    <Input
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
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {productForm.tiers.map((tier, index) => (
                      <Badge key={index} variant="secondary">
                        {tier.name}
                        <button
                          type="button"
                          onClick={() => removeTier(index)}
                          className="ml-2 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
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
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchProduct">Product *</Label>
                  <Select
                    id="batchProduct"
                    value={batchForm.product_id}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, product_id: e.target.value })
                    }
                    required
                    className="border border-gray-400"
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
                    className="border border-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shift">Shift *</Label>
                  <Select
                    id="shift"
                    value={batchForm.shift || getDefaultShift()}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, shift: e.target.value })
                    }
                    required
                    className="border border-gray-400"
                  >
                    {shiftOptions.map((shift) => (
                      <option key={shift.value} value={shift.value}>
                        {shift.label}
                      </option>
                    ))}
                  </Select>
                </div>
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
                    className="border border-gray-400"
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
                    className="border border-gray-400"
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
