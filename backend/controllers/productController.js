import Product from "../models/Product.js";

class ProductController {
  // Create product
  static async createProduct(req, res) {
    try {
      const {
        name,
        type,
        fractiles,
        cells,
        tiers,
        description,
        specifications,
      } = req.body;

      if (!name || !type) {
        return res.status(400).json({
          success: false,
          message: "Product name and type are required",
        });
      }

      const unit_id =
        req.user.role === "admin" ? req.body.unit_id : req.user.unit_id;

      if (!unit_id) {
        return res.status(400).json({
          success: false,
          message: "Unit ID is required",
        });
      }

      const productData = {
        name,
        type,
        unit_id,
        fractiles: fractiles || 0,
        cells: cells || 0,
        tiers: tiers || 0,
        description,
        specifications,
        created_by: req.user.id,
      };

      const product = await Product.create(productData);

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({
        success: false,
        message: "Error creating product",
        error: error.message,
      });
    }
  }

  // Get all products
  static async getAllProducts(req, res) {
    try {
      const { type, search } = req.query;
      const filters = {};

      // If user is not admin, filter by their unit
      if (req.user.role !== "admin") {
        filters.unit_id = req.user.unit_id;
      } else if (req.query.unit_id) {
        filters.unit_id = parseInt(req.query.unit_id);
      }

      if (type) filters.type = type;
      if (search) filters.search = search;

      const products = await Product.findAll(filters);

      res.json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (error) {
      console.error("Get all products error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching products",
        error: error.message,
      });
    }
  }

  // Get product by ID
  static async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check if user has access to this product
      if (req.user.role !== "admin" && product.unit_id !== req.user.unit_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this product",
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching product",
        error: error.message,
      });
    }
  }

  // Update product
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        type,
        fractiles,
        cells,
        tiers,
        description,
        specifications,
      } = req.body;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check if user has access to this product
      if (req.user.role !== "admin" && product.unit_id !== req.user.unit_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this product",
        });
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (type) updateData.type = type;
      if (fractiles !== undefined) updateData.fractiles = fractiles;
      if (cells !== undefined) updateData.cells = cells;
      if (tiers !== undefined) updateData.tiers = tiers;
      if (description !== undefined) updateData.description = description;
      if (specifications !== undefined)
        updateData.specifications = specifications;

      const updatedProduct = await Product.update(id, updateData);

      res.json({
        success: true,
        message: "Product updated successfully",
        data: updatedProduct,
      });
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating product",
        error: error.message,
      });
    }
  }

  // Delete product
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check if user has access to this product
      if (req.user.role !== "admin" && product.unit_id !== req.user.unit_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this product",
        });
      }

      await Product.delete(id);

      res.json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting product",
        error: error.message,
      });
    }
  }

  // Get product types
  static async getProductTypes(req, res) {
    try {
      const types = await Product.getProductTypes();

      res.json({
        success: true,
        data: types,
      });
    } catch (error) {
      console.error("Get product types error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching product types",
        error: error.message,
      });
    }
  }

  // Get products by unit
  static async getProductsByUnit(req, res) {
    try {
      const { unitId } = req.params;

      // Check if user has access to this unit
      if (req.user.role !== "admin" && parseInt(unitId) !== req.user.unit_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this unit",
        });
      }

      const products = await Product.findByUnit(unitId);

      res.json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (error) {
      console.error("Get products by unit error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching products",
        error: error.message,
      });
    }
  }
}

export default ProductController;
