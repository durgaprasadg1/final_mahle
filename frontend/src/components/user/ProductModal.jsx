import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { toast } from "react-toastify";
import { formatProductType } from "../../lib/utils";

/**
 * Product Modal Component for Create/Edit
 */
export const ProductModal = ({
  isOpen,
  onClose,
  onSubmit,
  productTypes,
  allTiers,
  isEditMode = false,
  initialProduct = null,
}) => {
  const [productForm, setProductForm] = useState({
    name: "",
    type: "",
    description: "",
    tier_id: "",
  });
  const [selectedTierHierarchy, setSelectedTierHierarchy] = useState(null);
  const [tierSearchInput, setTierSearchInput] = useState("");
  const [showTierSuggestions, setShowTierSuggestions] = useState(false);
  const [tierInputRef, setTierInputRef] = useState(null);

  // Initialize form when editing
  useEffect(() => {
    if (isEditMode && initialProduct) {
      setProductForm({
        name: initialProduct.name,
        type: initialProduct.type,
        description: initialProduct.description || "",
        tier_id: initialProduct.tier_id || "",
      });

      if (initialProduct.tier_id) {
        handleTierSelect(initialProduct.tier_id);
      }
    } else {
      resetForm();
    }
  }, [isEditMode, initialProduct, isOpen]);

  const resetForm = () => {
    setProductForm({
      name: "",
      type: "",
      description: "",
      tier_id: "",
    });
    setSelectedTierHierarchy(null);
    setTierSearchInput("");
    setShowTierSuggestions(false);
  };

  const handleTierSelect = (tierId) => {
    setProductForm((prev) => ({ ...prev, tier_id: tierId }));
    if (!tierId) {
      setSelectedTierHierarchy(null);
      setTierSearchInput("");
      setShowTierSuggestions(false);
      return;
    }

    const tier = allTiers.find((t) => String(t.id) === String(tierId));
    if (tier) {
      setSelectedTierHierarchy({
        tier: { id: tier.id, name: tier.name },
        cell: { id: tier.cell_id, name: tier.cell_name },
        fractile: { id: tier.fractile_id, name: tier.fractile_name },
      });
      setTierSearchInput(`${tier.name} (${tier.fractile_name} → ${tier.cell_name})`);
      setShowTierSuggestions(false);
    }
  };

  const handleTierSearchChange = (value) => {
    setTierSearchInput(value);
    setShowTierSuggestions(true);
    if (!value.trim()) {
      setProductForm((prev) => ({ ...prev, tier_id: "" }));
      setSelectedTierHierarchy(null);
    }
  };

  const filteredTiers = tierSearchInput.trim()
    ? allTiers.filter((t) => {
        const searchLower = tierSearchInput.toLowerCase();
        return (
          t.name.toLowerCase().includes(searchLower) ||
          t.fractile_name.toLowerCase().includes(searchLower) ||
          t.cell_name.toLowerCase().includes(searchLower)
        );
      })
    : allTiers;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validations
    if (!productForm.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!productForm.type) {
      toast.error("Please select a product type");
      return;
    }
    if (!productForm.tier_id) {
      toast.error("Please select a tier");
      return;
    }

    const payload = {
      name: productForm.name,
      type: productForm.type,
      description: productForm.description,
      tier_id: parseInt(productForm.tier_id),
    };

    await onSubmit(payload);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
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
            <div className="space-y-2">
              <Label htmlFor="tier" className="text-sm">
                Tier *
              </Label>
              <p className="text-xs text-gray-500">
                Select a tier - the associated Fractile and Cell will be
                automatically linked
              </p>
              <div className="relative">
                <Input
                  id="tier"
                  type="text"
                  placeholder="Search and select a tier..."
                  value={tierSearchInput}
                  onChange={(e) => handleTierSearchChange(e.target.value)}
                  onFocus={() => setShowTierSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTierSuggestions(false), 300)}
                  ref={setTierInputRef}
                  className="w-full"
                />
                {showTierSuggestions && tierSearchInput && filteredTiers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredTiers.map((tier) => (
                      <div
                        key={tier.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleTierSelect(tier.id);
                        }}
                        className="px-3 py-2 cursor-pointer hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {tier.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {tier.fractile_name} → {tier.cell_name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showTierSuggestions && tierSearchInput && filteredTiers.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                    <p className="text-sm text-gray-500">No tiers found</p>
                  </div>
                )}
              </div>
            </div>

            {selectedTierHierarchy && (
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <p className="text-sm font-medium text-blue-800">
                  Linked Hierarchy:
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-700 mt-1">
                  <Badge className="bg-blue-100 text-blue-800">
                    {selectedTierHierarchy.fractile?.name}
                  </Badge>
                  <span>→</span>
                  <Badge className="bg-green-100 text-green-800">
                    {selectedTierHierarchy.cell?.name}
                  </Badge>
                  <span>→</span>
                  <Badge className="bg-purple-100 text-purple-800">
                    {selectedTierHierarchy.tier?.name}
                  </Badge>
                </div>
              </div>
            )}
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
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
