import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../lib/api";
import { toast } from "react-toastify";

const AuthContext = createContext(null);

const RESOURCE_KEYS = [
  "product",
  "fracticle",
  "tier",
  "cells",
  "batch",
  "planning",
];

const normalizeCrud = (input = {}) => ({
  create: Boolean(input.create ?? input.c),
  read: Boolean(input.read ?? input.r),
  update: Boolean(input.update ?? input.u),
  delete: Boolean(input.delete ?? input.d),
});

const normalizePermissions = (permissionsInput) => {
  if (!permissionsInput) {
    const flatDefault = {
      create: false,
      read: true,
      update: false,
      delete: false,
    };
    return {
      ...flatDefault,
      resources: RESOURCE_KEYS.reduce((acc, key) => {
        acc[key] = { ...flatDefault };
        return acc;
      }, {}),
    };
  }

  let parsedInput = permissionsInput;
  if (typeof permissionsInput === "string") {
    try {
      parsedInput = JSON.parse(permissionsInput);
    } catch (error) {
      const csv = permissionsInput.split(",").map((p) => p.trim());
      parsedInput = {
        create: csv.includes("create"),
        read: csv.includes("read"),
        update: csv.includes("update"),
        delete: csv.includes("delete"),
      };
    }
  }

  const flat = normalizeCrud(parsedInput);
  const matrixSource = parsedInput.resources || parsedInput.m || {};
  const resolveResourceRow = (resource) => {
    if (resource === "fracticle") {
      return (
        matrixSource.fracticle ||
        matrixSource.fractile ||
        matrixSource.fracticl ||
        matrixSource[resource[0]]
      );
    }
    return matrixSource[resource] || matrixSource[resource[0]];
  };

  const resources = RESOURCE_KEYS.reduce((acc, resource) => {
    const row = resolveResourceRow(resource);
    acc[resource] = row ? normalizeCrud(row) : { ...flat };
    return acc;
  }, {});

  const aggregate = RESOURCE_KEYS.reduce(
    (acc, resource) => {
      acc.create = acc.create || resources[resource].create;
      acc.read = acc.read || resources[resource].read;
      acc.update = acc.update || resources[resource].update;
      acc.delete = acc.delete || resources[resource].delete;
      return acc;
    },
    { create: false, read: false, update: false, delete: false },
  );

  return {
    create: flat.create || aggregate.create,
    read: flat.read || aggregate.read,
    update: flat.update || aggregate.update,
    delete: flat.delete || aggregate.delete,
    resources,
  };
};

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
        if (parsed && parsed.permissions) {
          parsed.permissions = normalizePermissions(parsed.permissions);
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

      if (user?.permissions) {
        user.permissions = normalizePermissions(user.permissions);
      }

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

//Yeh file pura app mein authentication ka single source of truth hai, taki har component ko alag se login state na dekhni pade—bas context se le le.
