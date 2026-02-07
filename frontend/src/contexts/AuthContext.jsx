import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../lib/api";
import { toast } from "react-toastify";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
   console.log("useAuth must be used within an AuthProvider");
   toast.error("Something went wrong");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        const parsed = JSON.parse(storedUser);
        // Normalize permissions if backend returned CSV string
        if (parsed && parsed.permissions && typeof parsed.permissions === "string") {
          const perms = parsed.permissions.split(",").map((p) => p.trim());
          parsed.permissions = {
            create: perms.includes("create"),
            read: perms.includes("read"),
            update: perms.includes("update"),
            delete: perms.includes("delete"),
          };
        }
        setUser(parsed);
      } catch (e) {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data.data;

      setUser(user);
      setToken(token);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const isAdmin = () => user?.role === "admin";
  const isUser = () => user?.role === "user";

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAdmin,
    isUser,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
