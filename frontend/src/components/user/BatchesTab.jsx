import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Plus, Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { formatDateOnly } from "../../lib/utils";
import { getCreatorName } from "../../utils/batchUtils";
import { loadBatchShiftConfigs } from "../../utils/shiftUtils";
import { generateTimeSlots } from "../../utils/timeUtils";
import { productionPlanAPI } from "../../lib/api";
import { BatchModal } from "./BatchModal";
import { DataTable } from "./table";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { toast } from "react-toastify";

// User ke permissions check karne ka helper function
const canAccess = (permissions, operation, resource = "batch") => {
  const scoped = permissions?.resources?.[resource]?.[operation];
  if (typeof scoped === "boolean") {
    return scoped;
  }
  // Purane users ke liye: agar batch rights 'cells' ke andar mile toh bhi allow karo
  if (resource === "batch") {
    const legacyScoped = permissions?.resources?.cells?.[operation];
    if (typeof legacyScoped === "boolean") {
      return legacyScoped;
    }
  }
  // Fallback: direct permission property check
  return Boolean(permissions?.[operation]);
};

// BatchesTab: Production batches ka main tab component
export const BatchesTab = ({
  batches,
  products,
  user,
  onCreateBatches,
  onUpdateBatch,
  onDeleteBatch,
}) => {
  // Modal open/close, edit mode, kis batch ko edit kar rahe hain, delay dialog ke liye state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [delayDialogBatch, setDelayDialogBatch] = useState(null);
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [productionPlans, setProductionPlans] = useState([]);
  const [planningForm, setPlanningForm] = useState({
    product_id: "",
    shift: "morning",
    planning_days: "1",
    planning_dates: [new Date().toISOString().split("T")[0]],
    target_quantity: "",
    selected_slots: [],
    notes: "",
  });

  const todayDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const canManagePlanning =
    canAccess(user?.permissions, "create", "planning") ||
    canAccess(user?.permissions, "update", "planning");
  const canReadPlanning = canAccess(user?.permissions, "read", "planning");
  const canReadBatch = canAccess(user?.permissions, "read", "batch");
  const canCreateBatch = canAccess(user?.permissions, "create", "batch");
  const canViewPlanningTargets = canReadPlanning || canReadBatch || canCreateBatch;

  const shiftNameByType = useMemo(() => {
    const map = new Map();
    loadBatchShiftConfigs().forEach((shiftConfig) => {
      if (shiftConfig?.backendShift && !map.has(shiftConfig.backendShift)) {
        map.set(
          shiftConfig.backendShift,
          shiftConfig.name || shiftConfig.backendShift,
        );
      }
    });
    return map;
  }, []);

  const getShiftDisplayName = (shiftType) => {
    return shiftNameByType.get(shiftType) || shiftType;
  };

  const getShiftChoices = () => {
    const configuredShifts = loadBatchShiftConfigs();
    return configuredShifts.filter((shift) => shift?.isActive !== false);
  };

  const shiftChoices = useMemo(() => getShiftChoices(), []);

  const availablePlanSlots = useMemo(() => {
    const selectedShiftConfig = shiftChoices.find(
      (shiftConfig) => String(shiftConfig.backendShift) === String(planningForm.shift),
    );

    if (!selectedShiftConfig?.startTime || !selectedShiftConfig?.endTime) {
      return [];
    }

    return generateTimeSlots(
      selectedShiftConfig.startTime,
      selectedShiftConfig.endTime,
      selectedShiftConfig.timeInterval || "hourwise",
    );
  }, [planningForm.shift, shiftChoices]);

  const fetchProductionPlans = async (targetDate = todayDate) => {
    if (!canViewPlanningTargets) return;

    try {
      const response = await productionPlanAPI.getAll({ plan_date: targetDate });
      setProductionPlans(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch production plans", error);
    }
  };

  useEffect(() => {
    fetchProductionPlans(todayDate);
  }, [todayDate, canViewPlanningTargets]);

  // Batch create/update form submit handle karta hai
  const handleBatchSubmit = async (batchFormData, selectedSlots) => {
    if (isEditMode && editingBatch) {
      // Edit mode: ek batch update karo
      const success = await onUpdateBatch(editingBatch.id, {
        quantity_produced: parseInt(batchFormData.quantity_produced, 10),
        shift: batchFormData.shift,
        start_time:
          batchFormData.start_time.length === 5
            ? `${batchFormData.start_time}:00`
            : batchFormData.start_time,
        end_time:
          batchFormData.end_time.length === 5
            ? `${batchFormData.end_time}:00`
            : batchFormData.end_time,
        notes: batchFormData.notes,
        had_delay: batchFormData.had_delay,
        delay_reason:
          batchFormData.had_delay === "yes" ? batchFormData.delay_reason : "",
      });

      if (success) {
        fetchProductionPlans(todayDate);
        setShowBatchModal(false);
        setIsEditMode(false);
        setEditingBatch(null);
      }
    } else {
      // Create mode: ek saath multiple batches bana sakte hain (slots ke hisaab se)
      const result = await onCreateBatches(batchFormData, selectedSlots);
      if (result.createdCount > 0) {
        fetchProductionPlans(todayDate);
        setShowBatchModal(false);
      }
    }
  };

  const handleOpenPlanningDialog = () => {
    setPlanningForm({
      product_id: "",
      shift: "morning",
      planning_days: "1",
      planning_dates: [todayDate],
      target_quantity: "",
      selected_slots: [],
      notes: "",
    });
    setShowPlanningDialog(true);
  };

  const addDaysToDateKey = (dateText, daysToAdd) => {
    const date = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(date.getTime())) return todayDate;
    date.setDate(date.getDate() + daysToAdd);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const syncPlanningDatesCount = (nextCountRaw) => {
    const parsed = Number(nextCountRaw);
    const safeCount = Number.isInteger(parsed)
      ? Math.min(Math.max(parsed, 1), 20)
      : 1;

    setPlanningForm((prev) => {
      const nextDates = [...(prev.planning_dates || [])];

      if (nextDates.length === 0) {
        nextDates.push(todayDate);
      }

      if (nextDates.length < safeCount) {
        for (let i = nextDates.length; i < safeCount; i += 1) {
          const previousDate = nextDates[i - 1] || todayDate;
          nextDates.push(addDaysToDateKey(previousDate, 1));
        }
      }

      return {
        ...prev,
        planning_days: String(nextCountRaw),
        planning_dates: nextDates.slice(0, safeCount),
      };
    });
  };

  const handleSavePlan = async (event) => {
    event.preventDefault();

    if (!planningForm.product_id || !planningForm.shift) {
      toast.error("Please select product and shift");
      return;
    }

    const targetQty = Number(planningForm.target_quantity);
    if (!Number.isFinite(targetQty) || targetQty <= 0) {
      toast.error("Target quantity must be greater than 0");
      return;
    }

    const planningDays = Number(planningForm.planning_days || 1);
    if (!Number.isInteger(planningDays) || planningDays < 1 || planningDays > 20) {
      toast.error("Planning days must be between 1 and 20");
      return;
    }

    const selectedDates = (planningForm.planning_dates || [])
      .slice(0, planningDays)
      .map((dateText) => String(dateText || "").substring(0, 10));

    if (selectedDates.length !== planningDays || selectedDates.some((dateText) => !dateText)) {
      toast.error(`Please select exactly ${planningDays} plan date${planningDays > 1 ? "s" : ""}`);
      return;
    }

    const uniqueDates = new Set(selectedDates);
    if (uniqueDates.size !== selectedDates.length) {
      toast.error("Please select unique dates only");
      return;
    }

    setSavingPlan(true);
    try {
      const basePayload = {
        product_id: Number(planningForm.product_id),
        shift: planningForm.shift,
        target_quantity: targetQty,
        notes: planningForm.notes,
      };

      for (const planDate of selectedDates) {
        if (planningForm.selected_slots.length > 0) {
          for (const slotValue of planningForm.selected_slots) {
            const [slot_start_time, slot_end_time] = String(slotValue).split("|");
            await productionPlanAPI.createOrUpdate({
              ...basePayload,
              plan_date: planDate,
              slot_start_time,
              slot_end_time,
            });
          }
        } else {
          await productionPlanAPI.createOrUpdate({
            ...basePayload,
            plan_date: planDate,
          });
        }
      }

      toast.success(
        planningForm.selected_slots.length > 0
          ? `Slot-wise production targets saved for ${planningDays} day${planningDays > 1 ? "s" : ""}`
          : `Production target saved for ${planningDays} day${planningDays > 1 ? "s" : ""}`,
      );
      setShowPlanningDialog(false);
      await fetchProductionPlans(todayDate);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save production target");
    } finally {
      setSavingPlan(false);
    }
  };

  const handleEditBatch = (batch) => {
    setEditingBatch(batch);
    setIsEditMode(true);
    setShowBatchModal(true);
  };

  // Modal band karne par sab state reset ho jati hai
  const handleCloseModal = () => {
    setShowBatchModal(false);
    setIsEditMode(false);
    setEditingBatch(null);
  };
  const columns = useMemo(
    () => [
      {
        accessorKey: "product_name",
        header: "Product",
        cell: ({ getValue }) => <div>{getValue()}</div>, // Product ka naam
      },
      {
        accessorKey: "product_type",
        header: "Product Type",
        cell: ({ getValue }) => (
          <div className="capitalize">
            {getValue()?.replace(/_/g, " ") || "-"}
          </div>
        ), // Product ka type (underscore ko space se replace kiya)
      },
      {
        accessorKey: "quantity_produced",
        header: "Quantity",
        cell: ({ getValue }) => (
          <div className="font-semibold">{getValue()}</div>
        ), // Kitna produce hua
      },
      {
        id: "slot",
        header: "Slot",
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.start_time} - {row.original.end_time}
          </div>
        ), // Kis time slot mein batch bana
      },
      {
        accessorKey: "shift",
        header: "Shift",
        cell: ({ getValue }) => (
          <div className="capitalize">{getShiftDisplayName(getValue())}</div>
        ),
      },
      {
        id: "delay",
        header: "Delay",
        cell: ({ row }) => {
          // Agar delay hua toh reason dekh sakte hain
          const batch = row.original;
          return batch.had_delay === "yes" ? (
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Yes</Badge>
              {batch.delay_reason && (
                <button
                  onClick={() => setDelayDialogBatch(batch)}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  View Reason
                </button>
              )}
            </div>
          ) : (
            <Badge variant="secondary">No</Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <Badge variant="success">{getValue()}</Badge>, // Batch ka status
      },
      {
        id: "filled_by",
        header: "Filled By",
        cell: ({ row }) => {
          // Kis user ne batch fill kiya aur kab
          const batch = row.original;
          return (
            <div>
              <div className="text-sm">{getCreatorName(batch, user)}</div>
              <div className="text-xs text-gray-400">
                {formatDateOnly(batch.created_at)}
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          // Edit aur delete buttons, permission ke hisaab se
          <div className="flex justify-end space-x-2">
            {canAccess(user?.permissions, "update", "batch") && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEditBatch(row.original)}
              >
                <Edit className="w-4 h-4 text-blue-600" />
              </Button>
            )}
            {canAccess(user?.permissions, "delete", "batch") && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDeleteBatch(row.original.id)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [user, onDeleteBatch, shiftNameByType],
  );

  // Main render: Card, DataTable, BatchModal, Delay Reason Dialog
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Production Batches</CardTitle>
              <CardDescription>
                Track manufacturing batches (1-hour production cycles)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {canManagePlanning && (
                <Button variant="outline" onClick={handleOpenPlanningDialog}>
                  Set Production Target
                </Button>
              )}
              {canCreateBatch && (
                <Button onClick={() => setShowBatchModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Batch
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={batches} />
        </CardContent>
      </Card>

      <BatchModal
        isOpen={showBatchModal}
        onClose={handleCloseModal}
        onSubmit={handleBatchSubmit}
        products={products}
        batches={batches}
        isEditMode={isEditMode}
        initialBatch={editingBatch}
        productionPlans={canViewPlanningTargets ? productionPlans : []}
        planDate={todayDate}
      />

      <Dialog open={showPlanningDialog} onOpenChange={setShowPlanningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Production Target</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePlan} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="planProduct">Product *</Label>
              <Select
                id="planProduct"
                value={planningForm.product_id}
                onChange={(e) =>
                  setPlanningForm((prev) => ({ ...prev, product_id: e.target.value }))
                }
                required
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={String(product.id)}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planShift">Shift *</Label>
                <Select
                  id="planShift"
                  value={planningForm.shift}
                  onChange={(e) => {
                    const nextShift = e.target.value;
                    const nextShiftConfig = shiftChoices.find(
                      (shiftConfig) =>
                        String(shiftConfig.backendShift) === String(nextShift),
                    );
                    const nextSlots = generateTimeSlots(
                      nextShiftConfig?.startTime,
                      nextShiftConfig?.endTime,
                      nextShiftConfig?.timeInterval || "hourwise",
                    );
                    const allowedSlotValues = new Set(nextSlots.map((slot) => slot.value));

                    setPlanningForm((prev) => {
                      return {
                        ...prev,
                        shift: nextShift,
                        selected_slots: prev.selected_slots.filter((slot) =>
                          allowedSlotValues.has(slot),
                        ),
                      };
                    });
                  }}
                  required
                >
                  {shiftChoices.map((shift) => (
                    <option key={`plan-${shift.id || shift.backendShift}`} value={shift.backendShift}>
                      {getShiftDisplayName(shift.backendShift)} ({shift.startTime} - {shift.endTime})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planningDays">Days (max 20) *</Label>
                <Input
                  id="planningDays"
                  type="number"
                  min="1"
                  max="20"
                  value={planningForm.planning_days}
                  onChange={(e) => syncPlanningDatesCount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Plan Dates *</Label>
              <div className="grid grid-cols-2 gap-3 max-h-52 overflow-y-auto border rounded-md p-2">
                {Array.from({
                  length: Math.min(
                    Math.max(Number(planningForm.planning_days) || 1, 1),
                    20,
                  ),
                }).map((_, index) => (
                  <div className="space-y-1" key={`plan-date-${index + 1}`}>
                    <Label htmlFor={`planDate-${index + 1}`} className="text-xs text-gray-600">
                      Date {index + 1}
                    </Label>
                    <Input
                      id={`planDate-${index + 1}`}
                      type="date"
                      value={planningForm.planning_dates[index] || ""}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setPlanningForm((prev) => {
                          const nextDates = [...(prev.planning_dates || [])];
                          nextDates[index] = nextValue;
                          return { ...prev, planning_dates: nextDates };
                        });
                      }}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Plan Slots (Optional, multi-select)</Label>
              {availablePlanSlots.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No slots configured for selected shift.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto border rounded-md p-2">
                  {availablePlanSlots.map((slot) => {
                    const isChecked = planningForm.selected_slots.includes(slot.value);
                    return (
                      <label
                        key={`plan-slot-${slot.value}`}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            setPlanningForm((prev) => {
                              const next = e.target.checked
                                ? [...prev.selected_slots, slot.value]
                                : prev.selected_slots.filter((value) => value !== slot.value);
                              return { ...prev, selected_slots: next };
                            });
                          }}
                        />
                        <span>{slot.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-gray-500">
                Leave empty for shift-wise planning. If slots are selected, target quantity is saved per selected slot.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetQuantity">Target Quantity *</Label>
              <Input
                id="targetQuantity"
                type="number"
                min="1"
                value={planningForm.target_quantity}
                onChange={(e) =>
                  setPlanningForm((prev) => ({ ...prev, target_quantity: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planNotes">Notes</Label>
              <Textarea
                id="planNotes"
                value={planningForm.notes}
                onChange={(e) =>
                  setPlanningForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowPlanningDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingPlan}>
                {savingPlan ? "Saving..." : "Save Target"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delay Reason Dialog */}
      <Dialog
        open={!!delayDialogBatch}
        onOpenChange={() => setDelayDialogBatch(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delay Reason</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Product:</p>
              <p className="font-medium">{delayDialogBatch?.product_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Shift:</p>
              <p className="font-medium capitalize">
                {getShiftDisplayName(delayDialogBatch?.shift)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Time Slot:</p>
              <p className="font-medium">
                {delayDialogBatch?.start_time} - {delayDialogBatch?.end_time}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Delay Reason:</p>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm whitespace-pre-wrap">
                  {delayDialogBatch?.delay_reason}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
