import Tier from "../models/Tier.js";

class TierController {
  static async getTierDetails(req, res) {
    try {
      const { tierId } = req.params;

      const hierarchy = await Tier.getHierarchyDetailsById(tierId);

      if (!hierarchy) {
        return res.status(404).json({
          success: false,
          message: "Tier not found",
        });
      }

      if (!hierarchy.cell || !hierarchy.fractile) {
        return res.status(404).json({
          success: false,
          message: "Tier hierarchy is incomplete",
        });
      }

      if (
        req.user.role !== "admin" &&
        hierarchy.tier.unit_id !== req.user.unit_id
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this tier",
        });
      }

      return res.json({
        success: true,
        data: hierarchy,
      });
    } catch (error) {
      console.error("Get tier details error:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching tier details",
        error: error.message,
      });
    }
  }
}

export default TierController;