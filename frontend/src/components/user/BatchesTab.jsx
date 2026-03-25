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
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { formatDateOnly } from "../../lib/utils";
import { getCreatorName } from "../../utils/batchUtils";
import { loadBatchShiftConfigs } from "../../utils/shiftUtils";
import { productionPlanAPI } from "../../lib/api";
import { BatchModal } from "./BatchModal";
import { DataTable } from "./table";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { toast } from "react-toastify";

const canAccess = (permissions, operation, resource = "batch") => {
  const scoped = permissions?.resources?.[resource]?.[operation];
  if (typeof scoped === "boolean") {
    return scoped;
  }
  // Backward compatibility for older users where batch rights were stored under cells.
  if (resource === "batch") {
    const legacyScoped = permissions?.resources?.cells?.[operation];
    if (typeof legacyScoped === "boolean") {
      return legacyScoped;
    }
  }
  return Boolean(permissions?.[operation]);
};

/**
 * Batches Tab Component
 */
export const BatchesTab = ({
  batches,
  products,
  user,
  onCreateBatches,
  onDeleteBatch,
}) => {
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [delayDialogBatch, setDelayDialogBatch] = useState(null);
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [productionPlans, setProductionPlans] = useState([]);
  const [planningForm, setPlanningForm] = useState({
    product_id: "",
    shift: "morning",
    plan_date: new Date().toISOString().split("T")[0],
    target_quantity: "",
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

  const handleBatchSubmit = async (batchFormData, selectedSlots) => {
<<<<<<< Updated upstream
    // Yha pe apne ko  batch createHone ke phle batches timing kaa array bnana hai
    const result = await onCreateBatches(batchFormData, selectedSlots);
    if (result.createdCount > 0) {
      setShowBatchModal(false);
    }
  };

=======
    if (isEditMode && editingBatch) {
      // Edit mode - update single batch
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
      // Create mode - create multiple batches
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
      plan_date: todayDate,
      target_quantity: "",
      notes: "",
    });
    setShowPlanningDialog(true);
  };

  const handleSavePlan = async (event) => {
    event.preventDefault();

    if (!planningForm.product_id || !planningForm.shift || !planningForm.plan_date) {
      toast.error("Please select product, shift and plan date");
      return;
    }

    const targetQty = Number(planningForm.target_quantity);
    if (!Number.isFinite(targetQty) || targetQty <= 0) {
      toast.error("Target quantity must be greater than 0");
      return;
    }

    setSavingPlan(true);
    try {
      await productionPlanAPI.createOrUpdate({
        product_id: Number(planningForm.product_id),
        shift: planningForm.shift,
        plan_date: planningForm.plan_date,
        target_quantity: targetQty,
        notes: planningForm.notes,
      });

      toast.success("Production target saved");
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

  const handleCloseModal = () => {
    setShowBatchModal(false);
    setIsEditMode(false);
    setEditingBatch(null);
  };

>>>>>>> Stashed changes
  const columns = useMemo(
    () => [
      {
        accessorKey: "product_name",
        header: "Product",
        cell: ({ getValue }) => <div>{getValue()}</div>,
      },
      {
        accessorKey: "product_type",
        header: "Product Type",
        cell: ({ getValue }) => (
          <div className="capitalize">
            {getValue()?.replace(/_/g, " ") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "quantity_produced",
        header: "Quantity",
        cell: ({ getValue }) => (
          <div className="font-semibold">{getValue()}</div>
        ),
      },
      {
        id: "slot",
        header: "Slot",
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.start_time} - {row.original.end_time}
          </div>
        ),
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
        cell: ({ getValue }) => <Badge variant="success">{getValue()}</Badge>,
      },
      {
        id: "filled_by",
        header: "Filled By",
        cell: ({ row }) => {
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
          <div className="flex justify-end space-x-2">
<<<<<<< Updated upstream
            {canAccess(user?.permissions, "delete", "cells") && (
=======
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
>>>>>>> Stashed changes
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
        onClose={() => setShowBatchModal(false)}
        onSubmit={handleBatchSubmit}
        products={products}
        batches={batches}
<<<<<<< Updated upstream
=======
        isEditMode={isEditMode}
        initialBatch={editingBatch}
        productionPlans={canViewPlanningTargets ? productionPlans : []}
        planDate={todayDate}
>>>>>>> Stashed changes
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
                  onChange={(e) =>
                    setPlanningForm((prev) => ({ ...prev, shift: e.target.value }))
                  }
                  required
                >
                  {getShiftChoices().map((shift) => (
                    <option key={`plan-${shift.id || shift.backendShift}`} value={shift.backendShift}>
                      {getShiftDisplayName(shift.backendShift)} ({shift.startTime} - {shift.endTime})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planDate">Plan Date *</Label>
                <Input
                  id="planDate"
                  type="date"
                  value={planningForm.plan_date}
                  onChange={(e) =>
                    setPlanningForm((prev) => ({ ...prev, plan_date: e.target.value }))
                  }
                  required
                />
              </div>
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
