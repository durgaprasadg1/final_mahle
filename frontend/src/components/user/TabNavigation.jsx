import React from "react";

/**
 * Tab navigation component
 */
export const TabNavigation = ({ activeTab, onTabChange }) => {
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => onTabChange("products")}
            className={`${
              activeTab === "products"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Products
          </button>
          <button
            onClick={() => onTabChange("batches")}
            className={`${
              activeTab === "batches"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Batches
          </button>
        </nav>
      </div>
    </div>
  );
};
