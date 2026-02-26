import Product from "../models/Product.js";
import ProductComponent from "../models/ProductComponent.js";
import ComponentTemplate from "../models/ComponentTemplate.js";

class ProductController {
  // Create product with components
  static async createProduct(req, res) {
    try {
      const {
        name,
        type,
        description,
        specifications,
        tier_id,
      } = req.body;

      if (!name || !type || !tier_id) {
        return res.status(400).json({
          success: false,
          message: "Product name, type, and tier_id are required",
        });
      }

      // Get hierarchy from tier_templates (not product_tiers)
      const hierarchy = await ComponentTemplate.getTierHierarchy(tier_id);

      if (!hierarchy) {
        return res.status(404).json({
          success: false,
          message: "Tier template not found",
        });
      }

      // Use user's unit_id since templates don't have unit_id
      const unit_id = req.user.unit_id;

      if (!unit_id) {
        return res.status(400).json({
          success: false,
          message: "User must be assigned to a unit",
        });
      }

      const productData = {
        name,
        type,
        unit_id,
        description,
        specifications,
        created_by: req.user.id,
        tier_id,
        // Pass hierarchy info for creating product components
        tierName: hierarchy.tier.name,
        tierDescription: hierarchy.tier.description,
        cellName: hierarchy.cell.name,
        cellDescription: hierarchy.cell.description,
        fractileName: hierarchy.fractile.name,
        fractileDescription: hierarchy.fractile.description,
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
      const { type, search, with_components } = req.query;
      const filters = {};

      // If user is not admin, filter by their unit
      if (req.user.role !== "admin") {
        filters.unit_id = req.user.unit_id;
      } else if (req.query.unit_id) {
        filters.unit_id = parseInt(req.query.unit_id);
      }

      if (type) filters.type = type;
      if (search) filters.search = search;

      // Get products with or without components based on query param
      const products =
        with_components === "true"
          ? await Product.findAllWithComponents(filters)
          : await Product.findAll(filters);

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
        description,
        specifications,
        fractiles,
        cells,
        tiers,
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
      if (description !== undefined) updateData.description = description;
      if (specifications !== undefined)
        updateData.specifications = specifications;
      if (fractiles !== undefined) updateData.fractiles = fractiles;
      if (cells !== undefined) updateData.cells = cells;
      if (tiers !== undefined) updateData.tiers = tiers;

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

  // Get product components
  static async getProductComponents(req, res) {
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

      const components = await ProductComponent.getAllComponentsByProduct(id);

      res.json({
        success: true,
        data: components,
      });
    } catch (error) {
      console.error("Get product components error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching product components",
        error: error.message,
      });
    }
  }

  // Add fractile to product
  static async addFractile(req, res) {
    try {
      const { id } = req.params;
      const { name, count, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Fractile name is required",
        });
      }

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      if (req.user.role !== "admin" && product.unit_id !== req.user.unit_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this product",
        });
      }

      const fractile = await ProductComponent.createFractile(id, {
        name,
        count: count || 0,
        description,
      });

      res.status(201).json({
        success: true,
        message: "Fractile added successfully",
        data: fractile,
      });
    } catch (error) {
      console.error("Add fractile error:", error);
      res.status(500).json({
        success: false,
        message: "Error adding fractile",
        error: error.message,
      });
    }
  }

  // Add cell to product
  static async addCell(req, res) {
    try {
      const { id } = req.params;
      const { name, count, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Cell name is required",
        });
      }

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      if (req.user.role !== "admin" && product.unit_id !== req.user.unit_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this product",
        });
      }

      const cell = await ProductComponent.createCell(id, {
        name,
        count: count || 0,
        description,
      });

      res.status(201).json({
        success: true,
        message: "Cell added successfully",
        data: cell,
      });
    } catch (error) {
      console.error("Add cell error:", error);
      res.status(500).json({
        success: false,
        message: "Error adding cell",
        error: error.message,
      });
    }
  }

  // Add tier to product
  static async addTier(req, res) {
    try {
      const { id } = req.params;
      const { name, count, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Tier name is required",
        });
      }

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      if (req.user.role !== "admin" && product.unit_id !== req.user.unit_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this product",
        });
      }

      const tier = await ProductComponent.createTier(id, {
        name,
        count: count || 0,
        description,
      });

      res.status(201).json({
        success: true,
        message: "Tier added successfully",
        data: tier,
      });
    } catch (error) {
      console.error("Add tier error:", error);
      res.status(500).json({
        success: false,
        message: "Error adding tier",
        error: error.message,
      });
    }
  }
}

export default ProductController;
