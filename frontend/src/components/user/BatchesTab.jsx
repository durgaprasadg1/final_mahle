import React, { useState, useMemo } from "react";
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
import { BatchModal } from "./BatchModal";
import { DataTable } from "./table";

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
        setShowBatchModal(false);
        setIsEditMode(false);
        setEditingBatch(null);
      }
    } else {
      // Create mode: ek saath multiple batches bana sakte hain (slots ke hisaab se)
      const result = await onCreateBatches(batchFormData, selectedSlots);
      if (result.createdCount > 0) {
        setShowBatchModal(false);
      }
    }
  };

  // Edit button dabane par batch modal open karo aur edit mode set karo
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

  // Table ke columns define kar rahe hain, useMemo se optimize kiya hai
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
        cell: ({ getValue }) => <div className="capitalize">{getValue()}</div>, // Shift ka naam
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
            {canAccess(user?.permissions, "update", "cells") && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEditBatch(row.original)}
              >
                <Edit className="w-4 h-4 text-blue-600" />
              </Button>
            )}
            {canAccess(user?.permissions, "delete", "cells") && (
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
    [user, onDeleteBatch], // Dependencies: user ya delete function change ho toh columns dobara bano
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
            {canAccess(user?.permissions, "create", "cells") && (
              <Button onClick={() => setShowBatchModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Record Batch
              </Button>
            )}
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
      />

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
                {delayDialogBatch?.shift}
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
