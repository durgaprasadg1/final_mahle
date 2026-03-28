import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Card, CardHeader, CardContent, CardTitle } from "../ui/card";
import { formatDateOnly } from "../../lib/utils";
import { DataTable } from "./table";

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
  reportFilters,
  setReportFilters,
  allFractiles,
  allCells,
  allTiers,
  isGeneratingReport,
  reportResults,
  onGenerateReport,
  onDownloadExcel,
  onDownloadPDF,
}) => {
  const isPeriodBasedType = ["daily", "weekly", "monthly"].includes(
    reportType,
  );

  const handleClose = () => {
    onClose();
  };

  const handleFilterChange = (field, value) => {
    setReportFilters((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "fractileId" ? { cellId: "", tierId: "" } : {}),
      ...(field === "cellId" ? { tierId: "" } : {}),
    }));
  };

  const filteredCells = useMemo(() => {
    if (!reportFilters.fractileId) return allCells || [];
    return (allCells || []).filter(
      (cell) => String(cell.fractile_id) === String(reportFilters.fractileId),
    );
  }, [allCells, reportFilters.fractileId]);

  const filteredTiers = useMemo(() => {
    if (reportFilters.cellId) {
      return (allTiers || []).filter(
        (tier) => String(tier.cell_id) === String(reportFilters.cellId),
      );
    }
    if (reportFilters.fractileId) {
      return (allTiers || []).filter(
        (tier) => String(tier.fractile_id) === String(reportFilters.fractileId),
      );
    }
    return allTiers || [];
  }, [allTiers, reportFilters.cellId, reportFilters.fractileId]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "created_at",
        header: "Date",
        cell: ({ getValue }) => formatDateOnly(getValue()),
      },
      {
        accessorKey: "shift",
        header: "Shift",
        cell: ({ getValue }) => <div className="capitalize">{getValue()}</div>,
      },
      {
        accessorKey: "product_name",
        header: "Product",
        cell: ({ getValue }) => <div className="font-medium">{getValue()}</div>,
      },
      {
        accessorKey: "quantity_produced",
        header: "Quantity",
        cell: ({ getValue }) => getValue(),
      },
      {
        accessorKey: "created_by_name",
        header: "Worker",
        cell: ({ getValue }) => <div className="text-xs">{getValue()}</div>,
      },
    ],
    [],
  );

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
                  <option value="shiftwise">Shiftwise</option>
                  <option value="created_by">Created By</option>
                  <option value="independent_fractile">Fractilewise</option>
                  <option value="cell">Cellwise</option>
                  <option value="tier">Tierwise</option>
                  {/* <option value="batchwise">Batchwise</option> */}
                </Select>
              </div>
              {isPeriodBasedType ? (
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

            {reportType === "shiftwise" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Shift</Label>
                  <Select
                    value={reportFilters.shift}
                    onChange={(e) => handleFilterChange("shift", e.target.value)}
                  >
                    <option value="">All Shifts</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="night">Night</option>
                  </Select>
                </div>
              </div>
            )}

            {reportType === "created_by" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Created By</Label>
                  <Input
                    type="text"
                    placeholder="Enter worker name"
                    value={reportFilters.createdBy}
                    onChange={(e) =>
                      handleFilterChange("createdBy", e.target.value)
                    }
                  />
                </div>
              </div>
            )}

            {(reportType === "independent_fractile" ||
              reportType === "cell" ||
              reportType === "tier") && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Fractile</Label>
                  <Select
                    value={reportFilters.fractileId}
                    onChange={(e) =>
                      handleFilterChange("fractileId", e.target.value)
                    }
                  >
                    <option value="">All Fractiles</option>
                    {(allFractiles || []).map((fractile) => (
                      <option key={fractile.id} value={fractile.id}>
                        {fractile.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {(reportType === "cell" || reportType === "tier") && (
                  <div className="space-y-2">
                    <Label>Cell</Label>
                    <Select
                      value={reportFilters.cellId}
                      onChange={(e) => handleFilterChange("cellId", e.target.value)}
                    >
                      <option value="">All Cells</option>
                      {filteredCells.map((cell) => (
                        <option key={cell.id} value={cell.id}>
                          {cell.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                {reportType === "tier" && (
                  <div className="space-y-2">
                    <Label>Tier</Label>
                    <Select
                      value={reportFilters.tierId}
                      onChange={(e) => handleFilterChange("tierId", e.target.value)}
                    >
                      <option value="">All Tiers</option>
                      {filteredTiers.map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            )}

            {reportType === "batchwise" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Batch Number In Shift</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Enter batch number"
                    value={reportFilters.batchInShift}
                    onChange={(e) =>
                      handleFilterChange("batchInShift", e.target.value)
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex items-start space-x-2">
              <Button
                className="flex-1"
                onClick={onGenerateReport}
                disabled={isGeneratingReport}
              >
                {isGeneratingReport ? "Generating..." : "Generate"}
              </Button>
              {reportResults.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                    onClick={onDownloadExcel}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                    onClick={onDownloadPDF}
                  >
                    Export PDF
                  </Button>
                </>
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

              <div>
                <DataTable
                  columns={columns}
                  data={reportResults.slice(0, 50)}
                />
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
