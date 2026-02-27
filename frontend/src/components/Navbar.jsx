import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Shield,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Menu,
  X,
  Home,
  Users as UsersIcon,
  Clock,
} from "lucide-react";

const Navbar = ({
  onDashboardClick,
  onUsersClick,
  onShiftMakerClick,
  activeItem = "dashboard",
}) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleShiftMaker = () => {
    onShiftMakerClick?.();
    setIsMobileMenuOpen(false);
  };

  const handleDashboard = () => {
    onDashboardClick?.();
    setIsMobileMenuOpen(false);
  };

  const handleUsers = () => {
    onUsersClick?.();
    setIsMobileMenuOpen(false);
  };

  const getNavItemClass = (item) =>
    `flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${
      activeItem === item
        ? "bg-blue-50 text-blue-700"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  const getMobileNavItemClass = (item) =>
    `w-full text-left px-4 py-2.5 text-sm rounded-lg flex items-center space-x-2 transition-colors ${
      activeItem === item
        ? "bg-blue-50 text-blue-700"
        : "text-gray-700 hover:bg-gray-50"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-md">
              <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base lg:text-lg font-bold text-gray-900 leading-tight">
                MAHLE Inventory
              </h1>
              <p className="text-xs text-gray-500">Management System</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-3 flex-grow justify-center lg:justify-start lg:ml-8">
            <button onClick={handleDashboard} className={getNavItemClass("dashboard")}>
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button onClick={handleUsers} className={getNavItemClass("users")}>
              <UsersIcon className="w-4 h-4" />
              <span>Users</span>
            </button>
            <button
              onClick={handleShiftMaker}
              className={getNavItemClass("shift")}
            >
              <Clock className="w-4 h-4" />
              <span>Manage Shift </span>
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-4 ml-auto">
            <div className="text-right pr-3 border-r border-gray-200">
              <p className="text-sm font-semibold text-gray-900">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-gray-500">{user?.email || "user@mahle.com"}</p>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-1 p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.name || "Admin"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {user?.email || "user@mahle.com"}
                    </p>
                  </div>

                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>My Profile</span>
                    </button>

                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span>Settings</span>
                    </button>
                  </div>

                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-900" />
              ) : (
                <Menu className="w-6 h-6 text-gray-900" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-4 py-4 space-y-3">
              <button onClick={handleDashboard} className={getMobileNavItemClass("dashboard")}>
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button onClick={handleUsers} className={getMobileNavItemClass("users")}>
                <UsersIcon className="w-4 h-4" />
                <span>Users</span>
              </button>
              <button
                onClick={handleShiftMaker}
                className={getMobileNavItemClass("shift")}
              >
                <Clock className="w-4 h-4" />
                <span>Manage Shift</span>
              </button>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center space-x-3 px-2 pb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.name || "Admin"}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email || "user@mahle.com"}</p>
                  </div>
                </div>

                <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>My Profile</span>
                </button>

                <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-2 font-medium mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
