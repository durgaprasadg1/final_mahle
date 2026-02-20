import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { productAPI } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { toast } from "react-toastify";
import { ArrowLeft, Plus, X } from "lucide-react";

const AddProductAndBatch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [productTypes, setProductTypes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    type: "",
    specifications: "",
    fractiles: [],
    cells: [],
    tiers: [],
  });

  const [componentInput, setComponentInput] = useState({
    fractile: "",
    cell: "",
    tier: "",
  });

  useEffect(() => {
    fetchProductTypes();
  }, []);

  const fetchProductTypes = async () => {
    try {
      const response = await productAPI.getTypes();
      setProductTypes(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch product types");
      console.error(error);
    }
  };

  // Product handlers
  const addFractile = () => {
    if (!componentInput.fractile.trim()) {
      toast.warning("Please enter a fractile name");
      return;
    }
    setProductForm({
      ...productForm,
      fractiles: [
        ...productForm.fractiles,
        { name: componentInput.fractile, count: 0 },
      ],
    });
    setComponentInput({ ...componentInput, fractile: "" });
  };

  const addCell = () => {
    if (!componentInput.cell.trim()) {
      toast.warning("Please enter a cell name");
      return;
    }
    setProductForm({
      ...productForm,
      cells: [...productForm.cells, { name: componentInput.cell, count: 0 }],
    });
    setComponentInput({ ...componentInput, cell: "" });
  };

  const addTier = () => {
    if (!componentInput.tier.trim()) {
      toast.warning("Please enter a tier name");
      return;
    }
    setProductForm({
      ...productForm,
      tiers: [...productForm.tiers, { name: componentInput.tier, count: 0 }],
    });
    setComponentInput({ ...componentInput, tier: "" });
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

  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setProductForm({
      ...productForm,
      [name]: value,
    });
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();

    // Validation
    if (!productForm.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!productForm.type) {
      toast.error("Product type is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: productForm.name,
        type: productForm.type,
        specifications: productForm.specifications,
        fractiles: productForm.fractiles,
        cells: productForm.cells,
        tiers: productForm.tiers,
      };

      await productAPI.create(payload);
      toast.success("Product created successfully!");

      // Reset form
      setProductForm({
        name: "",
        type: "",
        specifications: "",
        fractiles: [],
        cells: [],
        tiers: [],
      });
      setComponentInput({ fractile: "", cell: "", tier: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create product");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Add Product</h1>
          <p className="text-gray-600 mt-1">
            Create a new product for {user?.unit || "your unit"}
          </p>
        </div>

        {/* Two Column Layout - Separate Containers */}
        <div className="w-full">
          {/* Product Form */}
          <Card className="w-full border-2 border-black shadow-lg">
            <CardHeader>
              <CardTitle>Add Product</CardTitle>
              {/* <CardDescription>Create a new product</CardDescription> */}
            </CardHeader>
            <CardContent className="max-h-[72vh] overflow-y-auto">
              <form onSubmit={handleCreateProduct} className="space-y-6">
                {/* Row 1: Product Name, Type, and Specifications */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 p-3 rounded">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Automotive Cooler"
                      value={productForm.name}
                      onChange={handleProductInputChange}
                      required
                      className="border border-gray-600"
                    />
                  </div>

                  <div className="space-y-2 p-3 rounded">
                    <Label htmlFor="type">Product Type *</Label>
                    <Select
                      value={productForm.type}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          type: e.target.value,
                        })
                      }
                      className="border border-gray-600"
                    >
                      <option value="">Select a type</option>
                      {productTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2 p-3 rounded">
                    <Label htmlFor="specifications">Specifications</Label>
                    <Textarea
                      id="specifications"
                      name="specifications"
                      placeholder="Enter product specifications..."
                      value={productForm.specifications}
                      onChange={handleProductInputChange}
                      rows={1}
                      className="border border-gray-600"
                    />
                  </div>
                </div>

                {/* Row 2: Fractiles, Cells, and Tiers */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Fractiles Column */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Fractiles</h3>
                    <div className="flex gap-2 p-3 rounded">
                      <Input
                        placeholder="Enter fractile..."
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
                        className="border border-gray-600"
                      />
                      <Button
                        type="button"
                        onClick={addFractile}
                        variant="secondary"
                        size="sm"
                        className = "border-2 border-green-500"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {productForm.fractiles.map((fractile, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm whitespace-nowrap"
                        >
                          <span>{fractile.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFractile(index)}
                            className="hover:text-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cells Column */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Cells</h3>
                    <div className="flex gap-2 p-3 rounded">
                      <Input
                        placeholder="Enter cell..."
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
                        className="border border-gray-600"
                      />
                      <Button
                        type="button"
                        onClick={addCell}
                        variant="secondary"
                        size="sm"
                        className = "border-2 border-green-500"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {productForm.cells.map((cell, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm whitespace-nowrap"
                        >
                          <span>{cell.name}</span>
                          <button
                            type="button"
                            onClick={() => removeCell(index)}
                            className="hover:text-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tiers Column */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Tiers</h3>
                    <div className="flex gap-2 p-3 rounded">
                      <Input
                        placeholder="Enter tier..."
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
                        className="border border-gray-600"
                      />
                      <Button
                        type="button"
                        onClick={addTier}
                        variant="secondary"
                        size="sm"
                        className = "border-2 border-green-500"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {productForm.tiers.map((tier, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm whitespace-nowrap"
                        >
                          <span>{tier.name}</span>
                          <button
                            type="button"
                            onClick={() => removeTier(index)}
                            className="hover:text-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/dashboard")}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Product"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddProductAndBatch;
