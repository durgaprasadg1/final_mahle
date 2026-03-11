import React from "react";
import { Button } from "../ui/button";
import { Package, LogOut, TrendingUp } from "lucide-react";

/**
 * Dashboard header component
 */
export const DashboardHeader = ({ user, onLogout, onShowReports }) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Package className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Production Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                {user?.unit_name} - {user?.unit_code}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onShowReports}
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Reports
            </Button>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
