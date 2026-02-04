import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Unit from "../models/Unit.js";

class UserController {
  // Create new user (Admin only)
  static async createUser(req, res) {
    try {
      const { email, password, name, unit_id, permissions } = req.body;

      // Validation
      if (!email || !password || !name || !unit_id) {
        return res.status(400).json({
          success: false,
          message: "Email, password, name, and unit are required",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      // Check if email already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      // Verify unit exists
      const unit = await Unit.findById(unit_id);
      if (!unit) {
        return res.status(404).json({
          success: false,
          message: "Unit not found",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userData = {
        email,
        password: hashedPassword,
        name,
        role: "user",
        status: "active",
        unit_id,
        permissions: permissions || {
          create: true,
          read: true,
          update: true,
          delete: false,
        },
        created_by: req.user.id,
      };

      const newUser = await User.create(userData);
      delete newUser.password;

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: newUser,
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({
        success: false,
        message: "Error creating user",
        error: error.message,
      });
    }
  }

  // Get all users (Admin only)
  static async getAllUsers(req, res) {
    try {
      const { unit_id, role, status } = req.query;
      const filters = {};

      if (unit_id) filters.unit_id = parseInt(unit_id);
      if (role) filters.role = role;
      if (status) filters.status = status;

      const users = await User.findAll(filters);

      // Remove passwords
      users.forEach((user) => delete user.password);

      res.json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching users",
        error: error.message,
      });
    }
  }

  // Get user by ID (Admin only)
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      delete user.password;

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching user",
        error: error.message,
      });
    }
  }

  // Update user (Admin only)
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { email, name, unit_id, permissions, password } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.role === "admin") {
        return res.status(403).json({
          success: false,
          message: "Cannot update admin user",
        });
      }

      const updateData = {};
      if (email) updateData.email = email;
      if (name) updateData.name = name;
      if (unit_id) updateData.unit_id = unit_id;
      if (permissions) updateData.permissions = permissions;

      if (password) {
        if (password.length < 6) {
          return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters long",
          });
        }
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await User.update(id, updateData);
      delete updatedUser.password;

      res.json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating user",
        error: error.message,
      });
    }
  }

  // Block/Unblock user (Admin only)
  static async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !["active", "blocked"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Valid status (active/blocked) is required",
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.role === "admin") {
        return res.status(403).json({
          success: false,
          message: "Cannot block/unblock admin user",
        });
      }

      const updatedUser = await User.updateStatus(id, status);
      delete updatedUser.password;

      res.json({
        success: true,
        message: `User ${status === "blocked" ? "blocked" : "activated"} successfully`,
        data: updatedUser,
      });
    } catch (error) {
      console.error("Toggle user status error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating user status",
        error: error.message,
      });
    }
  }

  // Delete user (Admin only)
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.role === "admin") {
        return res.status(403).json({
          success: false,
          message: "Cannot delete admin user",
        });
      }

      await User.delete(id);

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting user",
        error: error.message,
      });
    }
  }

  // Get users by unit
  static async getUsersByUnit(req, res) {
    try {
      const { unitId } = req.params;
      const users = await User.findByUnit(unitId);

      users.forEach((user) => delete user.password);

      res.json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      console.error("Get users by unit error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching users",
        error: error.message,
      });
    }
  }
}

export default UserController;
