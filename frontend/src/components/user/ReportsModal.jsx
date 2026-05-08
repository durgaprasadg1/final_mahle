import React, { useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Card, CardHeader, CardContent, CardTitle } from "../ui/card";
import { formatDateOnly } from "../../lib/utils";
import { DataTable } from "./table";
import { toast } from "react-toastify";
import { resolveShiftType } from "../../utils/shiftUtils";
import { generateTimeSlots } from "../../utils/timeUtils";

/**
 * Reports Modal Component
 */
export const ReportsModal = ({
  isOpen,
  onClose,
  reportType,
  setReportType,
  reportDuration,
  setReportDuration,
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
  products,
  batches,
  isGeneratingReport,
  reportResults,
  onGenerateReport,
  onDownloadExcel,
  onDownloadPDF,
}) => {
  const isPeriodBasedDuration = [
    "daily",
    "weekly",
    "monthly",
    "yearly",
  ].includes(reportDuration);
  const shouldUseDateRange = reportDuration === "custom";

  const handleClose = () => {
    onClose();
  };

  const handleFilterChange = (field, value) => {
    setReportFilters((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "fractileId" ? { cellId: "", tierId: "" } : {}),
      ...(field === "cellId" ? { tierId: "" } : {}),
      ...(field === "shift" ? { timeSlot: "" } : {}),
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

  const workerNameSuggestions = useMemo(() => {
    const namesFromBatches = (batches || [])
      .map((batch) => batch?.created_by_name?.trim())
      .filter(Boolean);
    const namesFromReports = (reportResults || [])
      .map((batch) => batch?.created_by_name?.trim())
      .filter(Boolean);

    return [...new Set([...namesFromBatches, ...namesFromReports])].sort(
      (a, b) => a.localeCompare(b),
    );
  }, [batches, reportResults]);

  const formatTimeLabel = (timeValue) => {
    if (!timeValue) return "";
    return String(timeValue).substring(0, 5);
  };

  const configuredShifts = useMemo(() => {
    try {
      const rawShifts = localStorage.getItem("shifts");
      if (!rawShifts) return [];

      const parsedShifts = JSON.parse(rawShifts);
      if (!Array.isArray(parsedShifts) || parsedShifts.length === 0) return [];

      return parsedShifts
        .filter((shift) => shift?.isActive !== false)
        .map((shift) => {
          const value = resolveShiftType(shift);
          const fallbackLabel = value
            ? value.charAt(0).toUpperCase() + value.slice(1)
            : "";

          return {
            value,
            label: String(shift?.name || "").trim() || fallbackLabel,
            startTime: String(shift?.startTime || "").trim(),
            endTime: String(shift?.endTime || "").trim(),
            timeInterval: String(shift?.timeInterval || "hourwise").trim(),
          };
        })
        .filter((shift) => Boolean(shift.value));
    } catch (error) {
      return [];
    }
  }, [isOpen, batches?.length, reportResults?.length]);

  const configuredShiftOptions = useMemo(() => {
    const optionsByValue = new Map();

    configuredShifts.forEach((shift) => {
      if (!shift.value || optionsByValue.has(shift.value)) return;
      optionsByValue.set(shift.value, {
        value: shift.value,
        label: shift.label,
      });
    });

    return Array.from(optionsByValue.values());
  }, [configuredShifts]);

  const shiftOptions = useMemo(() => {
    const optionsByValue = new Map();

    configuredShiftOptions.forEach((shiftOption) => {
      optionsByValue.set(shiftOption.value, shiftOption);
    });

    [...(batches || []), ...(reportResults || [])].forEach((batch) => {
      const value = String(batch?.shift || "")
        .trim()
        .toLowerCase();
      if (!value || optionsByValue.has(value)) return;

      optionsByValue.set(value, {
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
      });
    });

    return Array.from(optionsByValue.values());
  }, [configuredShiftOptions, batches, reportResults]);

  useEffect(() => {
    if (!reportFilters.shift) return;

    const shiftExists = shiftOptions.some(
      (shiftOption) => shiftOption.value === reportFilters.shift,
    );

    if (shiftExists) return;

    setReportFilters((prev) => ({
      ...prev,
      shift: "",
      timeSlot: "",
    }));
  }, [reportFilters.shift, setReportFilters, shiftOptions]);

  const shiftTimeSlotOptions = useMemo(() => {
    const grouped = new Map();

    configuredShifts.forEach((shiftConfig) => {
      if (
        !shiftConfig?.value ||
        !shiftConfig?.startTime ||
        !shiftConfig?.endTime
      )
        return;

      const generatedSlots = generateTimeSlots(
        shiftConfig.startTime,
        shiftConfig.endTime,
        shiftConfig.timeInterval || "hourwise",
      );

      if (!grouped.has(shiftConfig.value)) {
        grouped.set(shiftConfig.value, new Map());
      }

      generatedSlots.forEach((slot) => {
        grouped.get(shiftConfig.value).set(slot.value, {
          value: slot.value,
          label: slot.label,
        });
      });
    });

    [...(batches || []), ...(reportResults || [])].forEach((batch) => {
      const shift = String(batch?.shift || "")
        .trim()
        .toLowerCase();
      const start = formatTimeLabel(batch?.start_time);
      const end = formatTimeLabel(batch?.end_time);
      if (!shift || !start || !end) return;

      const value = `${start}|${end}`;
      const slot = { value, label: `${start} - ${end}` };

      if (!grouped.has(shift)) {
        grouped.set(shift, new Map());
      }

      grouped.get(shift).set(value, slot);
    });

    const result = {};
    grouped.forEach((slotMap, shift) => {
      result[shift] = Array.from(slotMap.values()).sort((a, b) =>
        a.value.localeCompare(b.value),
      );
    });

    return result;
  }, [configuredShifts, batches, reportResults]);

  const timeSlotOptions = useMemo(() => {
    if (!reportFilters.shift) return [];
    return shiftTimeSlotOptions[reportFilters.shift] || [];
  }, [reportFilters.shift, shiftTimeSlotOptions]);

  const handleGenerate = () => {
    if (reportFilters.timeSlot && !reportFilters.shift) {
      toast.warning("Please select a shift before selecting a time slot");
      return;
    }

    if (reportFilters.shift && reportFilters.timeSlot) {
      const isValidTimeSlotForShift = (
        shiftTimeSlotOptions[reportFilters.shift] || []
      ).some((slot) => slot.value === reportFilters.timeSlot);

      if (!isValidTimeSlotForShift) {
        toast.warning("Selected time slot is not valid for the selected shift");
        return;
      }
    }

    onGenerateReport();
  };

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select
                  value={reportType}
                  onChange={(e) => {
                    setReportType(e.target.value);
                    setReportFilters({
                      shift: "",
                      productId: "",
                      createdBy: "",
                      fractileId: "",
                      cellId: "",
                      tierId: "",
                      timeSlot: "",
                    });
                  }}
                >
                  <option value="production">Production</option>
                  <option value="createdby">Created By</option>
                  <option value="fractile">Fractile</option>
                  <option value="cells">Cells</option>
                  <option value="tiers">Tiers</option>
                  <option value="batchwise">Batchwise</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={reportDuration}
                  onChange={(e) => setReportDuration(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom Range</option>
                </Select>
              </div>
              {shouldUseDateRange ? (
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
              ) : (
                <div className="space-y-2">
                  <Label>
                    Select{" "}
                    {reportDuration === "monthly" || reportDuration === "yearly"
                      ? reportDuration === "monthly"
                        ? "Month"
                        : "Year"
                      : "Date"}
                  </Label>
                  <Input
                    type={
                      reportDuration === "yearly"
                        ? "number"
                        : reportDuration === "monthly"
                          ? "month"
                          : "date"
                    }
                    value={
                      reportDuration === "yearly"
                        ? reportDate.split("-")[0]
                        : reportDate
                    }
                    onChange={(e) => {
                      if (reportDuration === "yearly") {
                        setReportDate(`${e.target.value}-01-01`);
                      } else {
                        setReportDate(e.target.value);
                      }
                    }}
                    {...(reportDuration === "yearly" && {
                      min: "2000",
                      max: "2100",
                    })}
                  />
                </div>
              )}
            </div>

            {reportType === "fractile" && (
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
              </div>
            )}

            {reportType === "cells" && (
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

                <div className="space-y-2">
                  <Label>Cell</Label>
                  <Select
                    value={reportFilters.cellId}
                    onChange={(e) =>
                      handleFilterChange("cellId", e.target.value)
                    }
                  >
                    <option value="">All Cells</option>
                    {filteredCells.map((cell) => (
                      <option key={cell.id} value={cell.id}>
                        {cell.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}

            {reportType === "tiers" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                <div className="space-y-2">
                  <Label>Cell</Label>
                  <Select
                    value={reportFilters.cellId}
                    onChange={(e) =>
                      handleFilterChange("cellId", e.target.value)
                    }
                  >
                    <option value="">All Cells</option>
                    {filteredCells.map((cell) => (
                      <option key={cell.id} value={cell.id}>
                        {cell.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tier</Label>
                  <Select
                    value={reportFilters.tierId}
                    onChange={(e) =>
                      handleFilterChange("tierId", e.target.value)
                    }
                  >
                    <option value="">All Tiers</option>
                    {filteredTiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}

            {reportType === "createdby" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Worker Name</Label>
                  <Input
                    type="text"
                    list="report-worker-name-suggestions"
                    placeholder="Type or select worker name"
                    value={reportFilters.createdBy}
                    onChange={(e) =>
                      handleFilterChange("createdBy", e.target.value)
                    }
                  />
                  {workerNameSuggestions.length > 0 && (
                    <datalist id="report-worker-name-suggestions">
                      {workerNameSuggestions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select
                  value={reportFilters.productId}
                  onChange={(e) =>
                    handleFilterChange("productId", e.target.value)
                  }
                >
                  <option value="">All Products</option>
                  {(products || []).map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Shift</Label>
                <Select
                  value={reportFilters.shift}
                  onChange={(e) => handleFilterChange("shift", e.target.value)}
                >
                  <option value="">All Shifts</option>
                  {shiftOptions.map((shift) => (
                    <option key={shift.value} value={shift.value}>
                      {shift.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time Slot</Label>
                <Select
                  value={reportFilters.timeSlot}
                  onChange={(e) =>
                    handleFilterChange("timeSlot", e.target.value)
                  }
                  disabled={!reportFilters.shift}
                >
                  <option value="">
                    {reportFilters.shift
                      ? "All Time Slots"
                      : "Select Shift First"}
                  </option>
                  {timeSlotOptions.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Button
                className="flex-1"
                onClick={handleGenerate}
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
