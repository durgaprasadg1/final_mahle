import express from "express";
import TemplateController from "../controllers/templateController.js";
import { authenticate, checkPermission } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

// endpoints: /api/templates/fractiles, /api/templates/cells, /api/templates/tiers
router.get("/:type", TemplateController.listTemplates);
router.post(
  "/:type",
  checkPermission("create"),
  TemplateController.createTemplate,
);
router.put(
  "/:type/:id",
  checkPermission("update"),
  TemplateController.updateTemplate,
);
router.delete(
  "/:type/:id",
  checkPermission("delete"),
  TemplateController.deleteTemplate,
);

export default router;
