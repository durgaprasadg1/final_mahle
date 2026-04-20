import jwt from "jsonwebtoken";
import User from "../models/User.js";

const RESOURCE_ALIASES = {
  product: "product",
  products: "product",
  fracticl: "fracticle",
  fracticle: "fracticle",
  fractile: "fracticle",
  fractiles: "fracticle",
  tier: "tier",
  tiers: "tier",
  cell: "cells",
  cells: "cells",
  batch: "batch",
  batches: "batch",
  planning: "planning",
  productionplanning: "planning",
  production_planning: "planning",
  production_plan: "planning",
  production_plans: "planning",
};

const normalizeResource = (resource) => {
  const key = String(resource || "")
    .trim()
    .toLowerCase();
  return RESOURCE_ALIASES[key] || null;
};

const resolveResourcePermissions = (resources = {}, resourceKey = null) => {
  if (!resourceKey || !resources || typeof resources !== "object") {
    return undefined;
  }

  if (resources[resourceKey] && typeof resources[resourceKey] === "object") {
    return resources[resourceKey];
  }

  for (const [key, value] of Object.entries(resources)) {
    if (normalizeResource(key) === resourceKey && typeof value === "object") {
      return value;
    }
  }

  return undefined;
};

const resolvePermissionFlag = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  if (value === 1 || value === "1") {
    return true;
  }

  if (value === 0 || value === "0") {
    return false;
  }

  return undefined;
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
      const resourcePermissions = resolveResourcePermissions(
        userPermissions.resources,
        resolvedResource,
      );
      const productPermissions =
        resolvedResource === "fracticle" ||
        resolvedResource === "cells" ||
        resolvedResource === "tier"
          ? resolveResourcePermissions(userPermissions.resources, "product")
          : undefined;
      const legacyBatchPermissions =
        resolvedResource === "batch"
          ? userPermissions.resources?.cells
          : undefined;
      const batchFallbackPermissions =
        resolvedResource === "planning"
          ? (userPermissions.resources?.batch ??
            userPermissions.resources?.cells)
          : undefined;
      const resourceFlag = resolvePermissionFlag(
        resourcePermissions?.[permission],
      );
      const legacyFlag = resolvePermissionFlag(
        legacyBatchPermissions?.[permission],
      );
      const fallbackFlag = resolvePermissionFlag(
        batchFallbackPermissions?.[permission],
      );
      const productFlag = resolvePermissionFlag(productPermissions?.[permission]);
      const globalFlag = resolvePermissionFlag(userPermissions[permission]);
      const isAllowed =
        resourceFlag ??
        legacyFlag ??
        fallbackFlag ??
        productFlag ??
        globalFlag ??
        false;

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
