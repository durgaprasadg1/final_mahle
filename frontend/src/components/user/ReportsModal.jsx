import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Card, CardHeader, CardContent, CardTitle } from "../ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../ui/table";
import { formatDateOnly } from "../../lib/utils";

/**
 * Reports Modal Component
 */
export const ReportsModal = ({
  isOpen,
  onClose,
  reportType,
  setReportType,
  reportDate,
  setReportDate,
  reportDateFrom,
  setReportDateFrom,
  reportDateTo,
  setReportDateTo,
  isGeneratingReport,
  reportResults,
  onGenerateReport,
  onDownloadExcel,
}) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Production Reports</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="range">Custom Range</option>
                </Select>
              </div>
              {reportType !== "range" ? (
                <div className="space-y-2">
                  <Label>
                    Select {reportType === "monthly" ? "Month" : "Date"}
                  </Label>
                  <Input
                    type={reportType === "monthly" ? "month" : "date"}
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={reportDateFrom}
                      onChange={(e) => setReportDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Input
                      type="date"
                      value={reportDateTo}
                      onChange={(e) => setReportDateTo(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex items-start space-x-2">
              <Button
                className="flex-1"
                onClick={onGenerateReport}
                disabled={isGeneratingReport}
              >
                {isGeneratingReport ? "Generating..." : "Generate"}
              </Button>
              {reportResults.length > 0 && (
                <Button
                  variant="outline"
                  className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                  onClick={onDownloadExcel}
                >
                  Export CSV
                </Button>
              )}
            </div>
          </div>

          {reportResults.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium text-blue-800">
                      Total Batches
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-xl font-bold text-blue-900">
                      {reportResults.length}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium text-green-800">
                      Total Quantity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-xl font-bold text-green-900">
                      {reportResults.reduce(
                        (sum, b) => sum + (b.quantity_produced || 0),
                        0,
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium text-purple-800">
                      Unique Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-xl font-bold text-purple-900">
                      {new Set(reportResults.map((b) => b.product_id)).size}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Worker</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportResults.slice(0, 50).map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{formatDateOnly(b.created_at)}</TableCell>
                        <TableCell className="capitalize">{b.shift}</TableCell>
                        <TableCell className="font-medium">
                          {b.product_name}
                        </TableCell>
                        <TableCell>{b.quantity_produced}</TableCell>
                        <TableCell className="text-xs">
                          {b.created_by_name}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {reportResults.length > 50 && (
                  <div className="p-4 text-center text-sm text-gray-500 italic">
                    Showing first 50 results. Download full CSV for all data.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
