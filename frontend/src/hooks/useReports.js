import { useState } from "react";
import { batchAPI } from "../lib/api";
import { toast } from "react-toastify";
import { formatDateOnly } from "../lib/utils";
import {jsPDF} from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Custom hook for report generation
 */
export const useReports = () => {
  const [reportType, setReportType] = useState("daily");
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

  const buildReportPeriodLabel = () => {
    if (reportType === "daily") {
      return reportDate;
    }

    if (reportType === "range" || reportType === "custom") {
      return `${reportDateFrom} to ${reportDateTo}`;
    }

    return reportDate;
  };

  // Generate report
  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      let dateFrom, dateTo;
      const selectedDate = new Date(reportDate);

      if (reportType === "daily") {
        dateFrom = reportDate;
        dateTo = reportDate;
      } else if (reportType === "weekly") {
        // Start from Monday
        const day = selectedDate.getDay();
        const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(selectedDate.setDate(diff));
        const end = new Date(selectedDate.setDate(diff + 6));
        dateFrom = start.toISOString().split("T")[0];
        dateTo = end.toISOString().split("T")[0];
      } else if (reportType === "monthly") {
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
      } else if (reportType === "custom" || reportType === "range") {
        dateFrom = reportDateFrom;
        dateTo = reportDateTo;
      }

      const response = await batchAPI.getAll({
        date_from: dateFrom,
        date_to: dateTo,
        limit: 1000,
      });

      setReportResults(response.data.data);
      if (response.data.data.length === 0) {
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
      `Production_Report_${reportType}_${buildReportPeriodLabel().replace(/\s+/g, "_")}.csv`,
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

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const title = "Production Report";
    const period = buildReportPeriodLabel();
    const totalQuantity = reportResults.reduce(
      (sum, batch) => sum + (Number(batch.quantity_produced) || 0),
      0,
    );
    const uniqueProducts = new Set(reportResults.map((batch) => batch.product_id)).size;

    doc.setFontSize(16);
    doc.text(title, 40, 40);
    doc.setFontSize(10);
    doc.text(`Type: ${reportType.toUpperCase()}`, 40, 58);
    doc.text(`Period: ${period}`, 200, 58);
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
    ]);

    autoTable(doc, {
      startY: 90,
      head: [["Date", "Shift", "Product", "Qty", "Start", "End", "Delay", "Worker", "Notes"]],
      body: tableRows,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 30, right: 30 },
    });

    doc.save(
      `Production_Report_${reportType}_${period.replace(/\s+/g, "_")}.pdf`,
    );
  };

  return {
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
    generateReport,
    downloadExcel,
    downloadPDF,
    clearResults: () => setReportResults([]),
  };
};
