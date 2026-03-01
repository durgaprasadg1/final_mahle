import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { formatDateOnly } from "../../lib/utils";
import { getCreatorName } from "../../utils/batchUtils";
import { BatchModal } from "./BatchModal";

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
    const result = await onCreateBatches(batchFormData, selectedSlots);
    if (result.createdCount > 0) {
      setShowBatchModal(false);
    }
  };

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
            {user?.permissions?.create && (
              <Button onClick={() => setShowBatchModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Record Batch
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Product Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Delay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Filled By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>{batch.product_name}</TableCell>
                  <TableCell className="capitalize">
                    {batch.product_type?.replace(/_/g, " ") || "-"}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {batch.quantity_produced}
                  </TableCell>
                  <TableCell className="text-sm">
                    {batch.start_time} - {batch.end_time}
                  </TableCell>
                  <TableCell className="capitalize">{batch.shift}</TableCell>
                  <TableCell>
                    {batch.had_delay === "yes" ? (
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
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">{batch.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{getCreatorName(batch, user)}</div>
                    <div className="text-xs text-gray-400">
                      {formatDateOnly(batch.created_at)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {user?.permissions?.delete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteBatch(batch.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
