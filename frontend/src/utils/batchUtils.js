/**
 * Utility functions for batch operations
 */

/**
 * Get unique previous batches (latest one per product)
 */
export const getUniquePreviousBatches = (batches) => {
  if (batches.length === 0) return [];

  // Sort batches by creation date (newest first)
  const sortedBatches = [...batches].sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return dateB - dateA;
  });

  // Get the latest batch for each product
  const seenProducts = new Set();
  const uniqueBatches = [];

  for (const batch of sortedBatches) {
    if (!seenProducts.has(batch.product_id)) {
      uniqueBatches.push(batch);
      seenProducts.add(batch.product_id);
    }
  }

  return uniqueBatches;
};

/**
 * Get previous batches for a specific product
 */
export const getPreviousBatchesForProduct = (batches, productId) => {
  if (!productId || batches.length === 0) return [];

  // Sort batches by creation date (newest first) for the specific product
  const productBatches = batches
    .filter((b) => String(b.product_id) === String(productId))
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

  return productBatches;
};

/**
 * Get creator name from product or batch
 */
export const getCreatorName = (item, currentUser) => {
  const creatorName =
    item.created_by_name ||
    item.createdByName ||
    item.created_by_user?.name ||
    item.user_name;

  if (creatorName) return creatorName;

  const creatorId = item.created_by || item.createdBy;
  const currentUserId = currentUser?.id || currentUser?.user_id;
  if (
    creatorId &&
    currentUserId &&
    Number(creatorId) === Number(currentUserId)
  ) {
    return currentUser?.name || "You";
  }

  return "Unknown";
};

/**
 * Calculate batch duration in minutes
 */
export const calculateBatchDuration = (batch) => {
  try {
    if (!batch.start_time || !batch.end_time) return 0;

    const [startHour, startMin] = String(batch.start_time)
      .substring(0, 5)
      .split(":")
      .map(Number);
    const [endHour, endMin] = String(batch.end_time)
      .substring(0, 5)
      .split(":")
      .map(Number);

    let startTotal = startHour * 60 + startMin;
    let endTotal = endHour * 60 + endMin;

    if (endTotal < startTotal) {
      endTotal += 24 * 60;
    }

    return endTotal - startTotal;
  } catch (e) {
    return 0;
  }
};
