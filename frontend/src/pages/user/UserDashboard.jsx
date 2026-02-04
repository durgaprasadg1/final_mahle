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

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [activeTab, setActiveTab] = useState("products");

  const [productForm, setProductForm] = useState({
    name: "",
    type: "",
    fractiles: 0,
    cells: 0,
    tiers: 0,
    description: "",
  });

  const [batchForm, setBatchForm] = useState({
    product_id: "",
    quantity_produced: "",
    batch_start_time: "",
    batch_end_time: "",
    notes: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchBatches();
    fetchProductTypes();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll();
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
      setBatches(response.data.data);
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

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await productAPI.create(productForm);
      toast.success("Product created successfully");
      setShowProductModal(false);
      setProductForm({
        name: "",
        type: "",
        fractiles: 0,
        cells: 0,
        tiers: 0,
        description: "",
      });
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create product");
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      await batchAPI.create(batchForm);
      toast.success("Batch created successfully");
      setShowBatchModal(false);
      setBatchForm({
        product_id: "",
        quantity_produced: "",
        batch_start_time: "",
        batch_end_time: "",
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

  // Set default dates for batch form
  useEffect(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    setBatchForm((prev) => ({
      ...prev,
      batch_start_time: oneHourAgo.toISOString().slice(0, 16),
      batch_end_time: now.toISOString().slice(0, 16),
    }));
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
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
                  <Button onClick={() => setShowProductModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
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
                      <TableHead>Fractiles</TableHead>
                      <TableHead>Cells</TableHead>
                      <TableHead>Tiers</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatProductType(product.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{product.fractiles}</TableCell>
                        <TableCell>{product.cells}</TableCell>
                        <TableCell>{product.tiers}</TableCell>
                        <TableCell>
                          {new Date(product.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {user?.permissions?.delete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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
                      <TableCell>
                        {formatDate(batch.batch_start_time)}
                      </TableCell>
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
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent onClose={() => setShowProductModal(false)}>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fractiles">Fractiles</Label>
                <Input
                  id="fractiles"
                  type="number"
                  min="0"
                  value={productForm.fractiles}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      fractiles: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cells">Cells</Label>
                <Input
                  id="cells"
                  type="number"
                  min="0"
                  value={productForm.cells}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      cells: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiers">Tiers</Label>
                <Input
                  id="tiers"
                  type="number"
                  min="0"
                  value={productForm.tiers}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      tiers: parseInt(e.target.value) || 0,
                    })
                  }
                />
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
              <Button type="submit">Create Product</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Batch Modal */}
      <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
        <DialogContent onClose={() => setShowBatchModal(false)}>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={batchForm.batch_start_time}
                  onChange={(e) =>
                    setBatchForm({
                      ...batchForm,
                      batch_start_time: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={batchForm.batch_end_time}
                  onChange={(e) =>
                    setBatchForm({
                      ...batchForm,
                      batch_end_time: e.target.value,
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
    </div>
  );
};

export default UserDashboard;
