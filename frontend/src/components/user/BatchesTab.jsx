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
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { formatDateOnly } from "../../lib/utils";
import { getCreatorName } from "../../utils/batchUtils";
import { BatchModal } from "./BatchModal";
import { DataTable } from "./table";

const canAccess = (permissions, operation, resource = "cells") => {
  const scoped = permissions?.resources?.[resource]?.[operation];
  if (typeof scoped === "boolean") {
    return scoped;
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

  const handleBatchSubmit = async (batchFormData, selectedSlots) => {
    // Yha pe apne ko  batch createHone ke phle batches timing kaa array bnana hai
    const result = await onCreateBatches(batchFormData, selectedSlots);
    if (result.createdCount > 0) {
      setShowBatchModal(false);
    }
  };

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
        cell: ({ getValue }) => <div className="capitalize">{getValue()}</div>,
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
    [user, onDeleteBatch],
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
        onClose={() => setShowBatchModal(false)}
        onSubmit={handleBatchSubmit}
        products={products}
        batches={batches}
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
