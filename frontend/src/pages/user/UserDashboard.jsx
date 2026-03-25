import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";

// Custom Hooks
import { useProducts } from "../../hooks/useProducts";
import { useBatches } from "../../hooks/useBatches";
import { useReports } from "../../hooks/useReports";

// Components
import { DashboardHeader } from "../../components/user/DashboardHeader";
import { StatsCards } from "../../components/user/StatsCards";
import { TabNavigation } from "../../components/user/TabNavigation";
import { ProductsTab } from "../../components/user/ProductsTab";
import { BatchesTab } from "../../components/user/BatchesTab";
import { ReportsModal } from "../../components/user/ReportsModal";

/**
 * User Dashboard - Refactored with component-based architecture
 */
const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("products");
  const [showReportModal, setShowReportModal] = useState(false);

  // Use custom hooks for data management
  const {
    products,
    productTypes,
    loading,
    allTiers,
    allFractiles,
    allCells,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProducts();

  const { batches, createBatches, updateBatch, deleteBatch } = useBatches();

  const {
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
    clearResults,
  } = useReports();

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully");
  };

  const handleShowReports = () => {
    setShowReportModal(true);
  };

  const handleCloseReports = () => {
    setShowReportModal(false);
    clearResults();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        user={user}
        onLogout={handleLogout}
        onShowReports={handleShowReports}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatsCards products={products} batches={batches} />

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "products" && (
          <ProductsTab
            products={products}
            productTypes={productTypes}
            allTiers={allTiers}
            allFractiles={allFractiles}
            allCells={allCells}
            loading={loading}
            user={user}
            onCreateProduct={createProduct}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
          />
        )}

        {activeTab === "batches" && (
          <BatchesTab
            batches={batches}
            products={products}
            user={user}
            onCreateBatches={createBatches}
            onUpdateBatch={updateBatch}
            onDeleteBatch={deleteBatch}
          />
        )}
      </main>

      <ReportsModal
        isOpen={showReportModal}
        onClose={handleCloseReports}
        reportType={reportType}
        setReportType={setReportType}
        reportDate={reportDate}
        setReportDate={setReportDate}
        reportDateFrom={reportDateFrom}
        setReportDateFrom={setReportDateFrom}
        reportDateTo={reportDateTo}
        setReportDateTo={setReportDateTo}
        isGeneratingReport={isGeneratingReport}
        reportResults={reportResults}
        onGenerateReport={generateReport}
        onDownloadExcel={downloadExcel}
        onDownloadPDF={downloadPDF}
      />
    </div>
  );
};

export default UserDashboard;
