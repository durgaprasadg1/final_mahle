import { useState } from "react";
import { batchAPI } from "../lib/api";
import { toast } from "react-toastify";
import { formatDateOnly } from "../lib/utils";

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
      } else if (reportType === "custom") {
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
      `Production_Report_${reportType}_${reportDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    clearResults: () => setReportResults([]),
  };
};
