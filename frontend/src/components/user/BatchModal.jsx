import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { toast } from "react-toastify";
import { formatProductType } from "../../lib/utils";
import { getPreviousBatchesForProduct } from "../../utils/batchUtils";
import {
  loadBatchShiftConfigs,
  DEFAULT_SHIFT_CONFIGS,
  getShiftLabel,
} from "../../utils/shiftUtils";
import { generateTimeSlots } from "../../utils/timeUtils";

/**
 * Batch Modal Component for Creating Batches
 */
export const BatchModal = ({
  isOpen,
  onClose,
  onSubmit,
  products,
  batches,
  productionPlans = [],
  planDate = null,
  isEditMode = false,
  initialBatch = null,
}) => {
  const [batchForm, setBatchForm] = useState({
    product_id: "",
    quantity_produced: "",
    start_time: "",
    end_time: "",
    shift: "morning",
    notes: "",
    had_delay: "no",
    delay_reason: "",
  });

  const [usePreviousBatch, setUsePreviousBatch] = useState(false);
  const [selectedPreviousBatchId, setSelectedPreviousBatchId] = useState("");
  const [filteredPreviousBatches, setFilteredPreviousBatches] = useState([]);
  const [availableShifts, setAvailableShifts] = useState([]);
  const [selectedShiftConfigId, setSelectedShiftConfigId] = useState("");
  const [batchTimeSlots, setBatchTimeSlots] = useState([]);
  const [selectedBatchSlots, setSelectedBatchSlots] = useState([]);
  const [batchInterval, setBatchInterval] = useState("hourwise");
  const [productSearch, setProductSearch] = useState("");
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  const getProductLabel = (product) =>
    `${product.name} (${formatProductType(product.type)})`;

  const [timeValidationError, setTimeValidationError] = useState("");

  const validateTimeInShiftRange = (shift, startTime, endTime) => {
    if (!shift || !startTime || !endTime) {
      return { valid: true };
    }

    const configuredShift =
      (availableShifts || []).find((item) => item.backendShift === shift) ||
      DEFAULT_SHIFT_CONFIGS.find((item) => item.backendShift === shift);

    if (!configuredShift?.startTime || !configuredShift?.endTime) {
      return { valid: true };
    }

    const range = {
      start: configuredShift.startTime,
      end: configuredShift.endTime,
    };

    const timeToMinutes = (time) => {
      const [hour, min] = time.substring(0, 5).split(":").map(Number);
      return hour * 60 + min;
    };

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const shiftStartMin = timeToMinutes(range.start);
    const shiftEndMin = timeToMinutes(range.end);
    const crossesMidnight = shiftEndMin <= shiftStartMin;

    const isInRange = (timeMin) => {
      if (!crossesMidnight) {
        return timeMin >= shiftStartMin && timeMin <= shiftEndMin;
      }
      return timeMin >= shiftStartMin || timeMin <= shiftEndMin;
    };

    const startValid = isInRange(startMin);
    const endValid = isInRange(endMin);

    if (!startValid || !endValid) {
      return {
        valid: false,
        message: `Time slot ${startTime} - ${endTime} must be within ${range.start} - ${range.end}`,
      };
    }

    return { valid: true };
  };

  const getShiftRangeLabel = (shiftType) => {
    const configuredShift =
      (availableShifts || []).find((item) => item.backendShift === shiftType) ||
      DEFAULT_SHIFT_CONFIGS.find((item) => item.backendShift === shiftType);

    if (!configuredShift?.startTime || !configuredShift?.endTime) {
      return "";
    }

    const [startHour, startMin] = configuredShift.startTime.split(":").map(Number);
    const [endHour, endMin] = configuredShift.endTime.split(":").map(Number);
    const crossesMidnight = endHour * 60 + endMin <= startHour * 60 + startMin;
    return `${configuredShift.startTime} - ${configuredShift.endTime}${crossesMidnight ? " (crosses midnight)" : ""}`;
  };

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    const source = products || [];

    if (!query) {
      return source.slice(0, 8);
    }

    return source
      .filter((product) => {
        const label = getProductLabel(product).toLowerCase();
        return label.includes(query);
      })
      .slice(0, 8);
  }, [products, productSearch]);

  const effectivePlanDate = planDate || new Date().toISOString().split("T")[0];

  const normalizeDateKey = (value) => {
    if (!value) return "";
    const text = String(value);
    return text.length >= 10 ? text.substring(0, 10) : text;
  };

  const planningProgress = useMemo(() => {
    const selectedProductId = String(batchForm.product_id || "");
    const selectedShift = batchForm.shift;

    if (!selectedProductId || !selectedShift) {
      return null;
    }

    const targetDateKey = normalizeDateKey(effectivePlanDate);

    const matchingPlanForDate = (productionPlans || []).find((plan) => {
      return (
        String(plan.product_id) === selectedProductId &&
        String(plan.shift) === String(selectedShift) &&
        normalizeDateKey(plan.plan_date) === targetDateKey
      );
    });

    const matchingPlan =
      matchingPlanForDate ||
      (productionPlans || []).find(
        (plan) =>
          String(plan.product_id) === selectedProductId &&
          String(plan.shift) === String(selectedShift),
      );

    if (!matchingPlan) {
      return null;
    }

    const producedQuantity = (batches || []).reduce((total, batch) => {
      const batchDateKey = batch.batch_date
        ? String(batch.batch_date).substring(0, 10)
        : batch.created_at
          ? new Date(batch.created_at).toISOString().split("T")[0]
          : "";

      if (
        String(batch.product_id) === selectedProductId &&
        String(batch.shift) === String(selectedShift) &&
        batchDateKey === effectivePlanDate
      ) {
        return total + Number(batch.quantity_produced || 0);
      }

      return total;
    }, 0);

    const enteredQuantity = Number(batchForm.quantity_produced || 0);
    const selectedSlotCount = selectedBatchSlots.length;
    const previewAddition =
      enteredQuantity > 0
        ? enteredQuantity * (selectedSlotCount > 0 ? selectedSlotCount : 1)
        : 0;
    const producedWithCurrentEntry = producedQuantity + previewAddition;

    const targetQuantity = Number(matchingPlan.target_quantity || 0);
    return {
      target: targetQuantity,
      produced: producedWithCurrentEntry,
      remaining: targetQuantity - producedWithCurrentEntry,
    };
  }, [
    batchForm.product_id,
    batchForm.shift,
    batchForm.quantity_produced,
    selectedBatchSlots.length,
    productionPlans,
    effectivePlanDate,
    batches,
  ]);

  // Load shift configurations on mount
  useEffect(() => {
    if (isOpen) {
      const shifts = loadBatchShiftConfigs();
      setAvailableShifts(shifts);

      // Auto-select first shift config
      if (shifts.length > 0) {
        applyShiftConfigToBatchForm(shifts[0].id, null, shifts);
      }
    }
  }, [isOpen]);

  const resetForm = () => {
    setBatchForm({
      product_id: "",
      quantity_produced: "",
      start_time: "",
      end_time: "",
      shift: "morning",
      notes: "",
      had_delay: "no",
      delay_reason: "",
    });
    setUsePreviousBatch(false);
    setSelectedPreviousBatchId("");
    setFilteredPreviousBatches([]);
    setSelectedBatchSlots([]);
    setBatchTimeSlots([]);
    setSelectedShiftConfigId("");
    setProductSearch("");
    setShowProductSuggestions(false);
    setTimeValidationError("");
  };

  const copyFromPreviousBatch = (batch) => {
    if (!batch) return;

    setBatchForm({
      product_id: String(batch.product_id),
      quantity_produced: String(batch.quantity_produced),
      start_time: "",
      end_time: "",
      shift: batch.shift || "morning",
      notes: batch.notes || "",
      had_delay: batch.had_delay || "no",
      delay_reason: batch.delay_reason || "",
    });

    const selectedProduct = products.find(
      (product) => String(product.id) === String(batch.product_id),
    );
    setProductSearch(selectedProduct ? getProductLabel(selectedProduct) : "");

    const shiftConfig =
      availableShifts.find((s) => s.backendShift === batch.shift) ||
      DEFAULT_SHIFT_CONFIGS.find((s) => s.backendShift === batch.shift);

    if (shiftConfig) {
      setSelectedShiftConfigId(String(shiftConfig.id));
      const slots = generateTimeSlots(
        shiftConfig.startTime,
        shiftConfig.endTime,
        shiftConfig.timeInterval,
      );
      setBatchTimeSlots(slots);
      setBatchInterval(shiftConfig.timeInterval);

      const matchedSlots = slots
        .filter((slot) => {
          const normStartTime = (batch.start_time || "").substring(0, 5);
          const normEndTime = (batch.end_time || "").substring(0, 5);
          return (
            (slot.startTime === normStartTime ||
              slot.startTime === batch.start_time) &&
            (slot.endTime === normEndTime || slot.endTime === batch.end_time)
          );
        })
        .map((s) => s.value);

      setSelectedBatchSlots(matchedSlots);
    }
  };

  const applyShiftConfigToBatchForm = (
    shiftIdentifier,
    intervalOverride = null,
    shiftConfigs = availableShifts,
  ) => {
    const config =
      shiftConfigs.find((s) => String(s.id) === String(shiftIdentifier)) ||
      shiftConfigs.find((s) => s.backendShift === shiftIdentifier) ||
      DEFAULT_SHIFT_CONFIGS.find(
        (s) => String(s.id) === String(shiftIdentifier),
      ) ||
      DEFAULT_SHIFT_CONFIGS.find((s) => s.backendShift === shiftIdentifier) ||
      DEFAULT_SHIFT_CONFIGS[0];

    const resolvedShiftType = config?.backendShift || "morning";
    const nextInterval = intervalOverride || config?.timeInterval || "hourwise";
    const nextSlots = generateTimeSlots(
      config?.startTime,
      config?.endTime,
      nextInterval,
    );

    setSelectedShiftConfigId(config?.id ? String(config.id) : "");
    setBatchInterval(nextInterval);
    setBatchTimeSlots(nextSlots);
    setSelectedBatchSlots([]);

    if (config?.startTime && config?.endTime) {
      setBatchForm((prev) => ({
        ...prev,
        shift: resolvedShiftType,
        start_time: config.startTime,
        end_time: config.endTime,
      }));
    }
  };

  const getShiftChoices = () => {
    if (availableShifts.length > 0) {
      return availableShifts.filter((s) => s.isActive !== false);
    }
    return DEFAULT_SHIFT_CONFIGS;
  };

  const getEditShiftOptions = () => {
    const shiftChoices = getShiftChoices();
    const optionsByShiftType = new Map();

    shiftChoices.forEach((shiftConfig) => {
      if (shiftConfig?.backendShift && !optionsByShiftType.has(shiftConfig.backendShift)) {
        optionsByShiftType.set(shiftConfig.backendShift, shiftConfig);
      }
    });

    if (optionsByShiftType.size === 0) {
      DEFAULT_SHIFT_CONFIGS.forEach((shiftConfig) => {
        if (!optionsByShiftType.has(shiftConfig.backendShift)) {
          optionsByShiftType.set(shiftConfig.backendShift, shiftConfig);
        }
      });
    }

    return Array.from(optionsByShiftType.values());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!batchForm.product_id) {
      toast.error("Please select a product for the batch");
      return;
    }
    const qty = parseInt(batchForm.quantity_produced, 10);
    if (!Number.isFinite(qty) || qty < 1) {
      toast.error("Quantity produced must be at least 1");
      return;
    }

    // For edit mode, validate time inputs
    if (isEditMode) {
      if (!batchForm.start_time || !batchForm.end_time) {
        toast.error("Please provide start and end times");
        return;
      }
      if (batchForm.had_delay === "yes" && !batchForm.delay_reason.trim()) {
        toast.error("Please provide a reason for the delay");
        return;
      }

      const timeValidation = validateTimeInShiftRange(
        batchForm.shift,
        batchForm.start_time,
        batchForm.end_time,
      );
      if (!timeValidation.valid) {
        toast.error(timeValidation.message);
        return;
      }

      // Call onSubmit with batch data for updating
      await onSubmit({
        ...batchForm,
        quantity_produced: qty,
      });
    } else {
      // Create mode - validate slots
    if (selectedBatchSlots.length === 0) {
      toast.error("Please select at least one time slot");
      return;
    }
    if (batchForm.had_delay === "yes" && !batchForm.delay_reason.trim()) {
      toast.error("Please provide a reason for the delay");
      return;
    }

    await onSubmit(batchForm, selectedBatchSlots);
    }
    if (batchForm.had_delay === "yes" && !batchForm.delay_reason.trim()) {
      toast.error("Please provide a reason for the delay");
      return;
    }

    await onSubmit(batchForm, selectedBatchSlots);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleProductChange = (productId) => {
    const selectedProduct = products.find(
      (product) => String(product.id) === String(productId),
    );

    setBatchForm({
      ...batchForm,
      product_id: productId,
    });

    setProductSearch(selectedProduct ? getProductLabel(selectedProduct) : "");
    setShowProductSuggestions(false);

    if (usePreviousBatch) {
      setUsePreviousBatch(false);
      setSelectedPreviousBatchId("");
      setFilteredPreviousBatches([]);
    }
  };

  const handleProductInputChange = (value) => {
    setProductSearch(value);
    setShowProductSuggestions(true);

    const exactMatch = products.find(
      (product) => getProductLabel(product).toLowerCase() === value.trim().toLowerCase(),
    );

    setBatchForm((prev) => ({
      ...prev,
      product_id: exactMatch ? String(exactMatch.id) : "",
    }));
  };

  const handleProductSelect = (product) => {
    handleProductChange(String(product.id));
  };

  const handleProductSuggestionMouseDown = (event, product) => {
    // Select on mousedown so blur on input does not swallow the click.
    event.preventDefault();
    handleProductSelect(product);
  };

  const handlePreviousBatchToggle = (checked) => {
    setUsePreviousBatch(checked);
    if (checked && batchForm.product_id) {
      const productBatches = getPreviousBatchesForProduct(
        batches,
        batchForm.product_id,
      );
      setFilteredPreviousBatches(productBatches);

      if (productBatches.length > 0) {
        setSelectedPreviousBatchId(String(productBatches[0].id));
        copyFromPreviousBatch(productBatches[0]);
      }
    } else {
      const currentProductId = batchForm.product_id;
      setBatchForm({
        product_id: currentProductId,
        quantity_produced: "",
        start_time: "",
        end_time: "",
        shift: "morning",
        notes: "",
        had_delay: "no",
        delay_reason: "",
      });
      setSelectedPreviousBatchId("");
      setFilteredPreviousBatches([]);
      setSelectedBatchSlots([]);
      setBatchTimeSlots([]);
    }
  };

  const previousBatchesCount = batchForm.product_id
    ? getPreviousBatchesForProduct(batches, batchForm.product_id).length
    : 0;

  const availableSlots = useMemo(() => {
    if (isEditMode) {
      return [];
    }

    const today = new Date().toISOString().split("T")[0];
    return batchTimeSlots.filter((slot) => {
      const isCurrentSlotSelected = selectedBatchSlots.includes(slot.value);
      if (isCurrentSlotSelected) return true;

      const isUsed = batches.some((batch) => {
        const batchDate = batch.created_at
          ? new Date(batch.created_at).toISOString().split("T")[0]
          : today;

        const normStartTime = (batch.start_time || "").substring(0, 5);
        const normEndTime = (batch.end_time || "").substring(0, 5);

        return (
          String(batch.product_id) === String(batchForm.product_id) &&
          String(batch.shift || "") === String(batchForm.shift || "") &&
          normStartTime === (slot.startTime || "").substring(0, 5) &&
          normEndTime === (slot.endTime || "").substring(0, 5) &&
          batchDate === today
        );
      });

      return !isUsed;
    });
  }, [isEditMode, batchTimeSlots, selectedBatchSlots, batches, batchForm.product_id, batchForm.shift]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Production Batch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="batchProduct">Product *</Label>
            <div className="relative">
              <Input
                id="batchProduct"
                type="text"
                value={productSearch}
                onChange={(e) => handleProductInputChange(e.target.value)}
                onFocus={() => setShowProductSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowProductSuggestions(false), 180);
                }}
                placeholder="Type product name to search..."
                disabled={usePreviousBatch}
                required
              />
              <input
                type="hidden"
                value={batchForm.product_id}
                required
                readOnly
              />

              {showProductSuggestions && !usePreviousBatch && (
                <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onMouseDown={(event) =>
                          handleProductSuggestionMouseDown(event, product)
                        }
                        className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
                      >
                        {getProductLabel(product)}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No matching products found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Previous Batch Checkbox */}
          <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <label
              className={`flex items-center gap-3 ${
                batchForm.product_id && previousBatchesCount > 0
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50"
              }`}
            >
              <input
                type="checkbox"
                checked={usePreviousBatch}
                onChange={(e) => handlePreviousBatchToggle(e.target.checked)}
                disabled={!batchForm.product_id || previousBatchesCount === 0}
                className="w-5 h-5 cursor-pointer"
              />
              <span className="font-semibold text-sm text-blue-900">
                Same as Previous Batch
                {batchForm.product_id && previousBatchesCount === 0 && (
                  <span className="font-normal text-xs ml-2">
                    (No previous batches for this product)
                  </span>
                )}
                {!batchForm.product_id && (
                  <span className="font-normal text-xs ml-2">
                    (Select a product first)
                  </span>
                )}
              </span>
            </label>

            {usePreviousBatch && (
              <div className="mt-3 ml-8 space-y-2">
                <Label htmlFor="previousBatch">Select Previous Batch *</Label>
                <Select
                  id="previousBatch"
                  value={selectedPreviousBatchId}
                  onChange={(e) => {
                    const batchId = e.target.value;
                    setSelectedPreviousBatchId(batchId);
                    const selectedBatch = filteredPreviousBatches.find(
                      (b) => String(b.id) === batchId,
                    );
                    if (selectedBatch) {
                      copyFromPreviousBatch(selectedBatch);
                    }
                  }}
                  required={usePreviousBatch}
                >
                  <option value="">Select a batch to copy</option>
                  {filteredPreviousBatches.map((batch) => (
                    <option key={batch.id} value={String(batch.id)}>
                      {batch.start_time} to {batch.end_time} (Qty:{" "}
                      {batch.quantity_produced}, Shift: {batch.shift})
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {/* Expected + Quantity */}
          <div className="space-y-2">
            {!isEditMode && (
              <div className="space-y-1">
                <Label htmlFor="expectedQuantity">Expected Quantity</Label>
                <Input
                  id="expectedQuantity"
                  type="number"
                  value={planningProgress ? String(planningProgress.target) : ""}
                  placeholder="No target configured for selected product/shift"
                  readOnly
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Label htmlFor="quantity">Quantity Produced *</Label>
              {usePreviousBatch && (
                <span className="text-xs text-gray-500">
                  (from previous batch)
                </span>
              )}
            </div>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={batchForm.quantity_produced}
              onChange={(e) =>
                setBatchForm({
                  ...batchForm,
                  quantity_produced: e.target.value,
                })
              }
              required
            />
            {!isEditMode && planningProgress && (
              <div className="text-xs bg-violet-50 border border-violet-200 rounded-md p-2 text-violet-800">
                <span className="font-medium">Expected:</span> {planningProgress.target} |{" "}
                <span className="font-medium">Produced:</span> {planningProgress.produced} |{" "}
                <span className="font-medium">Remaining:</span> {planningProgress.remaining}
              </div>
            )}
          </div>

          {/* Shift Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Shift *</Label>
              {usePreviousBatch && (
                <span className="text-xs text-gray-500">
                  (from previous batch)
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {getShiftChoices().map((shiftConfig) => (
                <label
                  key={`${shiftConfig.id}-${shiftConfig.backendShift}`}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer ${
                    (
                      selectedShiftConfigId
                        ? String(selectedShiftConfigId) ===
                          String(shiftConfig.id)
                        : (batchForm.shift || "morning") ===
                          shiftConfig.backendShift
                    )
                      ? "border-primary bg-primary/5"
                      : "border-gray-200"
                  } ${usePreviousBatch ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="radio"
                    name="shift"
                    value={shiftConfig.id}
                    checked={
                      selectedShiftConfigId
                        ? String(selectedShiftConfigId) ===
                          String(shiftConfig.id)
                        : (batchForm.shift || "morning") ===
                          shiftConfig.backendShift
                    }
                    onChange={() => applyShiftConfigToBatchForm(shiftConfig.id)}
                    disabled={usePreviousBatch}
                  />
                  <span className="text-sm">{getShiftLabel(shiftConfig)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Time Slot Selection */}
          <div className="space-y-2">
            <Label>Time Slot *</Label>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-64 overflow-y-auto bg-gray-50">
              {batchTimeSlots
                .filter((slot) => {
                  const isCurrentSlotSelected = selectedBatchSlots.includes(
                    slot.value,
                  );
                  if (isCurrentSlotSelected) return true;

                  const today = new Date().toISOString().split("T")[0];
                  const isUsed = batches.some((b) => {
                    const batchDate = b.created_at
                      ? new Date(b.created_at).toISOString().split("T")[0]
                      : today;

                    const normStartTime = (b.start_time || "").substring(0, 5);
                    const normEndTime = (b.end_time || "").substring(0, 5);

                    return (
                      String(b.product_id) === String(batchForm.product_id) &&
                      normStartTime ===
                        (slot.startTime || "").substring(0, 5) &&
                      normEndTime === (slot.endTime || "").substring(0, 5) &&
                      batchDate === today
                    );
                  });
                  return !isUsed;
                })
                .map((slot) => (
                  <label
                    key={slot.value}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                      selectedBatchSlots.includes(slot.value)
                        ? "border-primary bg-primary/10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBatchSlots.includes(slot.value)}
                      onChange={() => {
                        setSelectedBatchSlots((prev) =>
                          prev.includes(slot.value)
                            ? prev.filter((v) => v !== slot.value)
                            : [...prev, slot.value],
                        );
                      }}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm font-medium">{slot.label}</span>
                  </label>
                ))}
            </div>
          )}

          {/* For Edit Mode: Show simple time and shift inputs */}
          {isEditMode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="editShift">Shift *</Label>
                <Select
                  id="editShift"
                  value={batchForm.shift}
                  onChange={(e) => {
                    const newShift = e.target.value;
                    const nextForm = { ...batchForm, shift: newShift };
                    setBatchForm(nextForm);

                    if (nextForm.start_time && nextForm.end_time) {
                      const validation = validateTimeInShiftRange(
                        newShift,
                        nextForm.start_time,
                        nextForm.end_time,
                      );
                      setTimeValidationError(
                        validation.valid ? "" : validation.message,
                      );
                    } else {
                      setTimeValidationError("");
                    }
                  }}
                  required
                >
                  {getEditShiftOptions().map((shiftConfig) => (
                    <option
                      key={`edit-${shiftConfig.id || shiftConfig.backendShift}`}
                      value={shiftConfig.backendShift}
                    >
                      {getShiftLabel(shiftConfig)}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-gray-500">
                  Valid time range: {getShiftRangeLabel(batchForm.shift)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editStartTime">Start Time *</Label>
                  <Input
                    id="editStartTime"
                    type="time"
                    value={batchForm.start_time}
                    onChange={(e) => {
                      const newStartTime = e.target.value;
                      const nextForm = { ...batchForm, start_time: newStartTime };
                      setBatchForm(nextForm);

                      if (nextForm.end_time) {
                        const validation = validateTimeInShiftRange(
                          nextForm.shift,
                          newStartTime,
                          nextForm.end_time,
                        );
                        setTimeValidationError(
                          validation.valid ? "" : validation.message,
                        );
                      } else {
                        setTimeValidationError("");
                      }
                    }}
                    className={timeValidationError ? "border-red-500" : ""}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEndTime">End Time *</Label>
                  <Input
                    id="editEndTime"
                    type="time"
                    value={batchForm.end_time}
                    onChange={(e) => {
                      const newEndTime = e.target.value;
                      const nextForm = { ...batchForm, end_time: newEndTime };
                      setBatchForm(nextForm);

                      if (nextForm.start_time) {
                        const validation = validateTimeInShiftRange(
                          nextForm.shift,
                          nextForm.start_time,
                          newEndTime,
                        );
                        setTimeValidationError(
                          validation.valid ? "" : validation.message,
                        );
                      } else {
                        setTimeValidationError("");
                      }
                    }}
                    className={timeValidationError ? "border-red-500" : ""}
                    required
                  />
                </div>
              </div>
              {timeValidationError && (
                <p className="text-sm text-red-600">{timeValidationError}</p>
              )}
            </>
          )}

          {/* Time Slot Selection - Only show in create mode */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label>Time Slot *</Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-64 overflow-y-auto bg-gray-50">
                {availableSlots.map((slot) => (
                    <label
                      key={slot.value}
                      className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                        selectedBatchSlots.includes(slot.value)
                          ? "border-primary bg-primary/10"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBatchSlots.includes(slot.value)}
                        onChange={() => {
                          setSelectedBatchSlots((prev) =>
                            prev.includes(slot.value)
                              ? prev.filter((v) => v !== slot.value)
                              : [...prev, slot.value],
                          );
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm font-medium">{slot.label}</span>
                    </label>
                  ))}
              </div>
              {availableSlots.length === 0 && (
                <p className="text-sm text-gray-500">
                  No available slots for this product and shift today.
                </p>
              )}
              <p className="text-xs text-gray-500">
                Slot list is auto-generated from admin shift timing and
                interval.
              </p>
            )}
            <p className="text-xs text-gray-500">
              Slot list is auto-generated from admin shift timing and interval.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={batchForm.notes}
              onChange={(e) =>
                setBatchForm({ ...batchForm, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Delay */}
          <div className="space-y-2">
            <Label>Production Delay Occurred? *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label
                className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                  batchForm.had_delay === "yes"
                    ? "border-primary bg-primary/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={batchForm.had_delay === "yes"}
                  onChange={() =>
                    setBatchForm({ ...batchForm, had_delay: "yes" })
                  }
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm font-medium">Yes, delay occurred</span>
              </label>
              <label
                className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                  batchForm.had_delay === "no"
                    ? "border-primary bg-primary/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={batchForm.had_delay === "no"}
                  onChange={() =>
                    setBatchForm({
                      ...batchForm,
                      had_delay: "no",
                      delay_reason: "",
                    })
                  }
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm font-medium">No delay</span>
              </label>
            </div>
          </div>

          {batchForm.had_delay === "yes" && (
            <div className="space-y-2 animate-in fade-in">
              <Label htmlFor="delayReason">Reason for Delay *</Label>
              <p className="text-xs text-gray-500">
                Describe the cause of the production delay
              </p>
              <Textarea
                id="delayReason"
                placeholder="E.g: Equipment malfunction, Power outage, etc."
                value={batchForm.delay_reason}
                onChange={(e) =>
                  setBatchForm({
                    ...batchForm,
                    delay_reason: e.target.value,
                  })
                }
                rows={3}
                required={batchForm.had_delay === "yes"}
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Record Batch</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
