import jwt from "jsonwebtoken";
import User from "../models/User.js";

const RESOURCE_ALIASES = {
  product: "product",
  products: "product",
  fracticle: "fracticle",
  fractile: "fracticle",
  fractiles: "fracticle",
  tier: "tier",
  tiers: "tier",
  cell: "cells",
  cells: "cells",
  batch: "batch",
  batches: "batch",
};

const normalizeResource = (resource) => {
  const key = String(resource || "")
    .trim()
    .toLowerCase();
  return RESOURCE_ALIASES[key] || null;
};

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
};

export const authorizeUser = (req, res, next) => {
  if (req.user.role !== "user" && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. User privileges required.",
    });
  }
  next();
};

export const checkPermission = (permission, resourceResolver = null) => {
  return (req, res, next) => {
    if (req.user.role === "admin") {
      return next();
    }

    const userPermissions = req.user.permissions || {};
    const resolvedResource = normalizeResource(
      typeof resourceResolver === "function"
        ? resourceResolver(req)
        : resourceResolver,
    );

    if (resolvedResource) {
      const resourcePermissions = userPermissions.resources?.[resolvedResource];
      const isAllowed =
        typeof resourcePermissions?.[permission] === "boolean"
          ? resourcePermissions[permission]
          : userPermissions[permission];

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: `You don't have permission to ${permission} ${resolvedResource}`,
        });
      }
      return next();
    }

    if (!userPermissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to ${permission}`,
      });
    }
    next();
  };
};
