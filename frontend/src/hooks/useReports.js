import { useState } from "react";
import { batchAPI } from "../lib/api";
import { toast } from "react-toastify";
import { formatDateOnly } from "../lib/utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Custom hook for report generation
 */
export const useReports = () => {
  const [reportType, setReportType] = useState("production");
  const [reportDuration, setReportDuration] = useState("daily");
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reportDateFrom, setReportDateFrom] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reportDateTo, setReportDateTo] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportResults, setReportResults] = useState([]);
  const [reportFilters, setReportFilters] = useState({
    shift: "",
    productId: "",
    createdBy: "",
    fractileId: "",
    cellId: "",
    tierId: "",
    timeSlot: "",
  });

  const periodBasedDurations = ["daily", "weekly", "monthly", "yearly"];
  const isPeriodBasedDuration = periodBasedDurations.includes(reportDuration);

  const buildReportTypeLabel = () => {
    const labels = {
      production: "Production",
      createdby: "Created By",
      fractile: "Fractilewise",
      cells: "Cellwise",
      tiers: "Tierwise",
      batchwise: "Batchwise",
    };

    return labels[reportType] || reportType;
  };

  const buildReportDurationLabel = () => {
    const labels = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      yearly: "Yearly",
      custom: "Custom Range",
    };

    return labels[reportDuration] || reportDuration;
  };

  const buildReportPeriodLabel = () => {
    if (reportDuration === "daily") {
      return reportDate;
    }

    if (!isPeriodBasedDuration) {
      return `${reportDateFrom} to ${reportDateTo}`;
    }

    return reportDate;
  };

  const buildAdvancedReportParams = () => {
    const params = {};

    params.report_type = reportType;

    if (reportFilters.productId) {
      params.product_id = reportFilters.productId;
    }

    if (reportFilters.shift) {
      params.shift = reportFilters.shift;
    }

    if (reportFilters.timeSlot) {
      const [slot_start_time, slot_end_time] = String(
        reportFilters.timeSlot,
      ).split("|");
      if (slot_start_time) {
        params.slot_start_time = slot_start_time;
      }
      if (slot_end_time) {
        params.slot_end_time = slot_end_time;
      }
    }

    if (reportType === "fractile" && reportFilters.fractileId) {
      params.fractile_id = reportFilters.fractileId;
    }

    if (reportType === "cells" && reportFilters.fractileId) {
      params.fractile_id = reportFilters.fractileId;
      if (reportFilters.cellId) {
        params.cell_id = reportFilters.cellId;
      }
    }

    if (reportType === "tiers" && reportFilters.fractileId) {
      params.fractile_id = reportFilters.fractileId;
      if (reportFilters.cellId) {
        params.cell_id = reportFilters.cellId;
      }
      if (reportFilters.tierId) {
        params.tier_id = reportFilters.tierId;
      }
    }

    if (reportType === "createdby" && reportFilters.createdBy?.trim()) {
      params.created_by_name = reportFilters.createdBy.trim();
    }

    return params;
  };

  // Generate report
  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      let dateFrom, dateTo;
      const selectedDate = new Date(reportDate);

      if (reportDuration === "custom") {
        dateFrom = reportDateFrom;
        dateTo = reportDateTo;

        if (!dateFrom || !dateTo) {
          toast.warning("Please select both From Date and To Date");
          return;
        }

        if (new Date(dateFrom) > new Date(dateTo)) {
          toast.warning("From Date cannot be after To Date");
          return;
        }
      } else if (reportDuration === "daily") {
        dateFrom = reportDate;
        dateTo = reportDate;
      } else if (reportDuration === "weekly") {
        // Start from Monday
        const day = selectedDate.getDay();
        const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(selectedDate.setDate(diff));
        const end = new Date(selectedDate.setDate(diff + 6));
        dateFrom = start.toISOString().split("T")[0];
        dateTo = end.toISOString().split("T")[0];
      } else if (reportDuration === "monthly") {
        const firstDay = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1,
        );
        const lastDay = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0,
        );
        dateFrom = firstDay.toISOString().split("T")[0];
        dateTo = lastDay.toISOString().split("T")[0];
      } else if (reportDuration === "yearly") {
        const firstDay = new Date(selectedDate.getFullYear(), 0, 1);
        const lastDay = new Date(selectedDate.getFullYear(), 11, 31);
        dateFrom = firstDay.toISOString().split("T")[0];
        dateTo = lastDay.toISOString().split("T")[0];
      } else {
        dateFrom = reportDateFrom;
        dateTo = reportDateTo;

        if (!dateFrom || !dateTo) {
          toast.warning("Please select both From Date and To Date");
          return;
        }

        if (new Date(dateFrom) > new Date(dateTo)) {
          toast.warning("From Date cannot be after To Date");
          return;
        }
      }

      if (reportType === "createdby" && !reportFilters.createdBy?.trim()) {
        toast.warning("Please enter worker name");
        return;
      }

      if (reportFilters.timeSlot && !reportFilters.shift) {
        toast.warning("Please select a shift before selecting a time slot");
        return;
      }

      const response = await batchAPI.getAll({
        date_from: dateFrom,
        date_to: dateTo,
        ...buildAdvancedReportParams(),
        limit: 1000,
      });

      const apiResults = response.data.data || [];
      setReportResults(apiResults);
      if (apiResults.length === 0) {
        toast.warning("No batches found for the selected period");
      }
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Download report as Excel/CSV
  const downloadExcel = () => {
    if (reportResults.length === 0) {
      toast.warning("No data to download");
      return;
    }

    const headers = [
      "ID",
      "Product",
      "Quantity",
      "Shift",
      "Start Time",
      "End Time",
      "Delay",
      "Delay Reason",
      "Notes",
      "Filled By",
      "Date",
    ];

    const rows = reportResults.map((b) => [
      b.id,
      b.product_name,
      b.quantity_produced,
      b.shift,
      b.start_time,
      b.end_time,
      b.had_delay || "no",
      (b.delay_reason || "").replace(/,/g, " "),
      (b.notes || "").replace(/,/g, " "),
      b.created_by_name,
      formatDateOnly(b.created_at),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((r) => r.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Production_Report_${buildReportTypeLabel().replace(/\s+/g, "_")}_${buildReportPeriodLabel().replace(/\s+/g, "_")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    if (reportResults.length === 0) {
      toast.warning("No data to download");
      return;
    }

    const buildHierarchyLabel = (batch) => {
      const fractile = batch.fractile_names || "-";
      const cell = batch.cell_names || "-";
      const tier = batch.tier_names || "-";
      return `F: ${fractile} | C: ${cell} | T: ${tier}`;
    };

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });
    const title = "Production Report";
    const period = buildReportPeriodLabel();
    const selectedWorkerName =
      reportType === "createdby" ? reportFilters.createdBy?.trim() : "";
    const totalQuantity = reportResults.reduce(
      (sum, batch) => sum + (Number(batch.quantity_produced) || 0),
      0,
    );
    const uniqueProducts = new Set(
      reportResults.map((batch) => batch.product_id),
    ).size;

    doc.setFontSize(16);
    doc.text(title, 40, 40);
    doc.setFontSize(10);
    doc.text(`Type: ${buildReportTypeLabel()}`, 40, 58);
    doc.text(`Period: ${period}`, 200, 58);
    if (selectedWorkerName) {
      doc.text(`Worker: ${selectedWorkerName}`, 420, 58);
    }
    doc.text(`Total Batches: ${reportResults.length}`, 40, 74);
    doc.text(`Total Quantity: ${totalQuantity}`, 200, 74);
    doc.text(`Unique Products: ${uniqueProducts}`, 360, 74);

    const tableRows = reportResults.map((batch) => [
      formatDateOnly(batch.created_at),
      batch.shift || "-",
      batch.product_name || "-",
      String(batch.quantity_produced ?? "-"),
      batch.start_time || "-",
      batch.end_time || "-",
      batch.had_delay || "no",
      batch.created_by_name || "-",
      (batch.notes || "-").toString(),
      buildHierarchyLabel(batch),
    ]);

    const tableHead = [
      "Date",
      "Shift",
      "Product",
      "Qty",
      "Start",
      "End",
      "Delay",
      "Worker",
      "Notes",
      "Fractile/Cell/Tier",
    ];

    autoTable(doc, {
      startY: 90,
      head: [tableHead],
      body: tableRows,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 30, right: 30 },
    });

    doc.save(
      `Production_Report_${buildReportTypeLabel().replace(/\s+/g, "_")}_${period.replace(/\s+/g, "_")}.pdf`,
    );
  };

  return {
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
    isGeneratingReport,
    reportResults,
    generateReport,
    downloadExcel,
    downloadPDF,
    clearResults: () => setReportResults([]),
  };
};
