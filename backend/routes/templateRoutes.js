import express from "express";
import TemplateController from "../controllers/templateController.js";
import { authenticate, checkPermission } from "../middleware/auth.js";

const router = express.Router();

const getTemplateResource = (req) => {
  const type = String(req.params.type || "").toLowerCase();

  if (type.startsWith("fract")) return "fracticle";
  if (type.startsWith("tier")) return "tier";
  if (type.startsWith("cell")) return "cells";

  return type;
};

router.use(authenticate);

// Get tier hierarchy (for product creation)
router.get("/tiers/:id/hierarchy", TemplateController.getTierHierarchy);

// endpoints: /api/templates/fractiles, /api/templates/cells, /api/templates/tiers
router.get("/:type", TemplateController.listTemplates);
router.post(
  "/:type",
  checkPermission("create", getTemplateResource),
  TemplateController.createTemplate,
);
router.put(
  "/:type/:id",
  checkPermission("update", getTemplateResource),
  TemplateController.updateTemplate,
);
router.delete(
  "/:type/:id",
  checkPermission("delete", getTemplateResource),
  TemplateController.deleteTemplate,
);

export default router;
