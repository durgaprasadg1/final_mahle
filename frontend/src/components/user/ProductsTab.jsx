import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { formatDateOnly, formatProductType } from "../../lib/utils";
import { getCreatorName } from "../../utils/batchUtils";
import { ProductModal } from "./ProductModal";
import { Link } from "react-router-dom";

/**
 * Product filters component
 */ const ProductFilters = ({
  filters,
  onFilterChange,
  allFractiles,
  allCells,
  allTiers,
  hasActiveFilters,
  onClearFilters,
  filteredCount,
  totalCount,
}) => {
  const getFilteredCells = () => {
    if (!filters.fractile_id) return allCells;
    return allCells.filter(
      (c) => String(c.fractile_id) === String(filters.fractile_id),
    );
  };

  const getFilteredTiers = () => {
    if (!filters.cell_id) {
      if (!filters.fractile_id) return allTiers;
      return allTiers.filter(
        (t) => String(t.fractile_id) === String(filters.fractile_id),
      );
    }
    return allTiers.filter(
      (t) => String(t.cell_id) === String(filters.cell_id),
    );
  };

  const handleFractileChange = (value) => {
    onFilterChange({
      fractile_id: value,
      cell_id: "",
      tier_id: "",
    });
  };

  const handleCellChange = (value) => {
    onFilterChange({
      ...filters,
      cell_id: value,
      tier_id: "",
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
      <span className="text-sm font-medium text-gray-600">Filter by:</span>

      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">Fractile:</label>
        <select
          className="text-sm border rounded px-2 py-1 bg-white min-w-[120px]"
          value={filters.fractile_id}
          onChange={(e) => handleFractileChange(e.target.value)}
        >
          <option value="">All</option>
          {allFractiles.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">Cell:</label>
        <select
          className="text-sm border rounded px-2 py-1 bg-white min-w-[120px]"
          value={filters.cell_id}
          onChange={(e) => handleCellChange(e.target.value)}
        >
          <option value="">All</option>
          {getFilteredCells().map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">Tier:</label>
        <select
          className="text-sm border rounded px-2 py-1 bg-white min-w-[120px]"
          value={filters.tier_id}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              tier_id: e.target.value,
            })
          }
        >
          <option value="">All</option>
          {getFilteredTiers().map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear Filters
          </Button>
          <span className="text-xs text-gray-500 ml-auto">
            Showing {filteredCount} of {totalCount} products
          </span>
        </>
      )}
    </div>
  );
};

/**
 * Products Tab Component
 */
export const ProductsTab = ({
  products,
  productTypes,
  allTiers,
  allFractiles,
  allCells,
  loading,
  user,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFilters, setProductFilters] = useState({
    fractile_id: "",
    cell_id: "",
    tier_id: "",
  });

  // Filter products
  const filteredProducts = products.filter((product) => {
    const fractiles = Array.isArray(product.fractiles) ? product.fractiles : [];
    const cells = Array.isArray(product.cells) ? product.cells : [];
    const tiers = Array.isArray(product.tiers) ? product.tiers : [];

    if (productFilters.fractile_id) {
      const hasFractile = fractiles.some(
        (f) => String(f.id) === String(productFilters.fractile_id),
      );
      if (!hasFractile) return false;
    }

    if (productFilters.cell_id) {
      const hasCell = cells.some(
        (c) => String(c.id) === String(productFilters.cell_id),
      );
      if (!hasCell) return false;
    }

    if (productFilters.tier_id) {
      const hasTier = tiers.some(
        (t) => String(t.id) === String(productFilters.tier_id),
      );
      if (!hasTier) return false;
    }

    return true;
  });

  const hasActiveFilters =
    productFilters.fractile_id ||
    productFilters.cell_id ||
    productFilters.tier_id;

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsEditMode(true);
    setShowProductModal(true);
  };

  const handleCloseModal = () => {
    setShowProductModal(false);
    setIsEditMode(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (productData) => {
    let success;
    if (isEditMode && editingProduct) {
      success = await onUpdateProduct(editingProduct.id, productData);
    } else {
      success = await onCreateProduct(productData);
    }

    if (success) {
      handleCloseModal();
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>Manage products for your unit</CardDescription>
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
          <ProductFilters
            filters={productFilters}
            onFilterChange={setProductFilters}
            allFractiles={allFractiles}
            allCells={allCells}
            allTiers={allTiers}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={() =>
              setProductFilters({
                fractile_id: "",
                cell_id: "",
                tier_id: "",
              })
            }
            filteredCount={filteredProducts.length}
            totalCount={products.length}
          />

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {hasActiveFilters
                ? "No products match the selected filters."
                : "No products found. Add a product to get started."}
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
                {filteredProducts.map((product) => {
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
                          <span className="text-gray-400">No components</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getCreatorName(product, user)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDateOnly(product.created_at)}
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
                              onClick={() => onDeleteProduct(product.id)}
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

      <ProductModal
        isOpen={showProductModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        productTypes={productTypes}
        allTiers={allTiers}
        isEditMode={isEditMode}
        initialProduct={editingProduct}
      />
    </>
  );
};
