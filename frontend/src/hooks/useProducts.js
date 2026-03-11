import { useState, useEffect } from "react";
import { productAPI, templateAPI } from "../lib/api";
import { toast } from "react-toastify";

/**
 * Custom hook for managing products
 */
export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allTiers, setAllTiers] = useState([]);
  const [allFractiles, setAllFractiles] = useState([]);
  const [allCells, setAllCells] = useState([]);

  // Fetch products
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

  // Fetch product types
  const fetchProductTypes = async () => {
    try {
      const response = await productAPI.getTypes();
      setProductTypes(response.data.data);
    } catch (error) {
      console.error("Failed to fetch product types");
    }
  };

  // Fetch all tiers with hierarchy info
  const fetchAllTiers = async () => {
    try {
      const res = await templateAPI.list("tiers");
      setAllTiers(res.data.data);
    } catch (e) {
      console.error("Failed to fetch tiers");
    }
  };

  // Fetch all fractiles
  const fetchAllFractiles = async () => {
    try {
      const res = await templateAPI.list("fractiles");
      setAllFractiles(res.data.data);
    } catch (e) {
      console.error("Failed to fetch fractiles");
    }
  };

  // Fetch all cells
  const fetchAllCells = async () => {
    try {
      const res = await templateAPI.list("cells");
      setAllCells(res.data.data);
    } catch (e) {
      console.error("Failed to fetch cells");
    }
  };

  // Create product
  const createProduct = async (productData) => {
    try {
      await productAPI.create(productData);
      toast.success("Product created successfully");
      await fetchProducts();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create product");
      return false;
    }
  };

  // Update product
  const updateProduct = async (productId, productData) => {
    try {
      await productAPI.update(productId, productData);
      toast.success("Product updated successfully");
      await fetchProducts();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update product");
      return false;
    }
  };

  // Delete product
  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return false;

    try {
      await productAPI.delete(productId);
      toast.success("Product deleted successfully");
      await fetchProducts();
      return true;
    } catch (error) {
      toast.error("Failed to delete product");
      return false;
    }
  };

  // Initial load
  useEffect(() => {
    fetchProducts();
    fetchProductTypes();
    fetchAllTiers();
    fetchAllFractiles();
    fetchAllCells();
  }, []);

  return {
    products,
    productTypes,
    loading,
    allTiers,
    allFractiles,
    allCells,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
