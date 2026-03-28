import { useState, useEffect } from "react";
import { batchAPI } from "../lib/api";
import { toast } from "react-toastify";
import { calculateBatchDuration } from "../utils/batchUtils";

/**
 * Custom hook for managing batches
 */
export const useBatches = () => {
  const [batches, setBatches] = useState([]);

  // Fetch batches
  const fetchBatches = async () => {
    try {
      const response = await batchAPI.getAll({ limit: 100 });
      const mapped = response.data.data.map((b) => {
        const duration = calculateBatchDuration(b);
        return {
          ...b,
          duration_minutes: duration,
        };
      });

      setBatches(mapped);
    } catch (error) {
      toast.error("Failed to fetch batches");
    }
  };

  // const createBatches = async (batchFormData, selectedSlots) => {
  //   const toTimeString = (timeValue) => {
  //     if (!timeValue) return null;
  //     return timeValue.length === 5 ? `${timeValue}:00` : timeValue;
  //   };

  //   let createdCount = 0;
  //   const errors = [];

  // -----------  Ye Multiple Insert Kaa Logic

  //   // for (const slotValue of selectedSlots) {
  //   //   const [startTime, endTime] = slotValue.split("|");

  //   //   if (!startTime || !endTime) {
  //   //     errors.push(`Invalid time slot: ${slotValue}`);
  //   //     continue;
  //   //   }

  //   //   const payload = {
  //   //     product_id: parseInt(batchFormData.product_id, 10),
  //   //     quantity_produced: parseInt(batchFormData.quantity_produced, 10),
  //   //     start_time: toTimeString(startTime),
  //   //     end_time: toTimeString(endTime),
  //   //     shift: batchFormData.shift || "morning",
  //   //     notes: batchFormData.notes,
  //   //     had_delay: batchFormData.had_delay,
  //   //     delay_reason:
  //   //       batchFormData.had_delay === "yes" ? batchFormData.delay_reason : "",
  //   //   };

  //   //   try {
  //   //     await batchAPI.create(payload);
  //   //     createdCount++;
  //   //   } catch (err) {
  //   //     errors.push(
  //   //       `Failed to create batch for ${startTime}-${endTime}: ${
  //   //         err.response?.data?.message || err.message
  //   //       }`,
  //   //     );
  //   //   }
  //   // }

  //   // Show results
  //   if (createdCount > 0) {
  //     toast.success(
  //       `${createdCount} batch(es) created successfully${
  //         errors.length > 0 ? ` (${errors.length} failed)` : ""
  //       }`,
  //     );
  //     await fetchBatches();
  //   }

  //   if (errors.length > 0) {
  //     console.error("Batch creation errors:", errors);
  //     if (createdCount === 0) {
  //       toast.error(
  //         `Failed to create batches: ${errors[0]}${
  //           errors.length > 1 ? ` (and ${errors.length - 1} more)` : ""
  //         }`,
  //       );
  //     }
  //   }

  //   return { createdCount, errors };
  // };

  const createBatches = async (batchFormData, selectedSlots) => {
    const toTimeString = (timeValue) => {
      if (!timeValue) return null;
      return timeValue.length === 5 ? `${timeValue}:00` : timeValue;
    };

    const batches = selectedSlots.map((slotValue) => {
      const [startTime, endTime] = slotValue.split("|");

      return {
        product_id: parseInt(batchFormData.product_id, 10),
        quantity_produced: parseInt(batchFormData.quantity_produced, 10),
        start_time: toTimeString(startTime),
        end_time: toTimeString(endTime),
        shift: batchFormData.shift || "morning",
        notes: batchFormData.notes,
        had_delay: batchFormData.had_delay,
        delay_reason:
          batchFormData.had_delay === "yes" ? batchFormData.delay_reason : "",
      };
    });

    try {
      const response = await batchAPI.createBulk(batches);

      toast.success("Batches created successfully");
      if (response.data.errors?.length > 0) {
        console.warn("Some batches failed:", response.data.errors);
      }

      await fetchBatches();
      return {
        createdCount: response.data.data.length,
        errors: response.data.errors || [],
      };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to create batches";
      toast.error(errorMsg);
      return { createdCount: 0, errors: [errorMsg] };
    }
  };
  // Update batch
  const updateBatch = async (batchId, batchData) => {
    try {
      await batchAPI.update(batchId, batchData);
      toast.success("Batch updated successfully");
      await fetchBatches();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update batch");
      return false;
    }
  };

  // Delete batch
  const deleteBatch = async (batchId) => {
    if (!window.confirm("Are you sure you want to delete this batch?"))
      return false;

    try {
      await batchAPI.delete(batchId);
      toast.success("Batch deleted successfully");
      await fetchBatches();
      return true;git 
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete batch");
      return false;
    }
  };

  // Initial load
  useEffect(() => {
    fetchBatches();
  }, []);

  return {
    batches,
    fetchBatches,
    createBatches,
    updateBatch,
    deleteBatch,
  };
};
