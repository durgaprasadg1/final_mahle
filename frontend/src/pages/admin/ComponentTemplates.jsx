import React, { useEffect, useState } from "react";
import { templateAPI } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  FaChevronRight,
  FaChevronDown,
  FaPlus,
  FaTrash,
  FaFolder,
  FaCube,
  FaLayerGroup,
  FaEdit,
  FaExpandAlt,
  FaCompressAlt,
} from "react-icons/fa";

const ComponentTemplates = () => {
  const navigate = useNavigate();

  // Data - hierarchical structure
  const [fractiles, setFractiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Expansion state
  const [expandedFractiles, setExpandedFractiles] = useState({});
  const [expandedCells, setExpandedCells] = useState({});

  // Cells and tiers data (loaded on demand)
  const [cellsData, setCellsData] = useState({}); // { fractileId: [cells] }
  const [tiersData, setTiersData] = useState({}); // { cellId: [tiers] }
  const [loadingCells, setLoadingCells] = useState({});
  const [loadingTiers, setLoadingTiers] = useState({});

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create, edit
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  // Hierarchical creation state
  const [fractileData, setFractileData] = useState({
    name: "",
    description: "",
  });
  const [hierarchyCells, setHierarchyCells] = useState([]);
  const [nextCellId, setNextCellId] = useState(1);
  const [nextTierId, setNextTierId] = useState(1);

  // Fetch fractiles on mount
  useEffect(() => {
    fetchFractiles();
  }, []);

  const fetchFractiles = async () => {
    setLoading(true);
    try {
      const res = await templateAPI.list("fractiles");
      setFractiles(res.data.data);
    } catch (e) {
      toast.error("Failed to load fractiles");
      setFractiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCells = async (fractileId) => {
    setLoadingCells((prev) => ({ ...prev, [fractileId]: true }));
    try {
      const res = await templateAPI.getCellsByFractile(fractileId);
      setCellsData((prev) => ({ ...prev, [fractileId]: res.data.data }));
    } catch (e) {
      toast.error("Failed to load cells");
    } finally {
      setLoadingCells((prev) => ({ ...prev, [fractileId]: false }));
    }
  };

  const fetchTiers = async (cellId) => {
    setLoadingTiers((prev) => ({ ...prev, [cellId]: true }));
    try {
      const res = await templateAPI.getTiersByCell(cellId);
      setTiersData((prev) => ({ ...prev, [cellId]: res.data.data }));
    } catch (e) {
      toast.error("Failed to load tiers");
    } finally {
      setLoadingTiers((prev) => ({ ...prev, [cellId]: false }));
    }
  };

  // Toggle fractile expansion
  const toggleFractile = async (fractileId) => {
    const isExpanding = !expandedFractiles[fractileId];
    setExpandedFractiles((prev) => ({ ...prev, [fractileId]: isExpanding }));

    if (isExpanding && !cellsData[fractileId]) {
      await fetchCells(fractileId);
    }
  };

  // Toggle cell expansion
  const toggleCell = async (cellId) => {
    const isExpanding = !expandedCells[cellId];
    setExpandedCells((prev) => ({ ...prev, [cellId]: isExpanding }));

    if (isExpanding && !tiersData[cellId]) {
      await fetchTiers(cellId);
    }
  };

  // Expand/Collapse all
  const expandAll = async () => {
    const newExpandedFractiles = {};
    for (const fractile of fractiles) {
      newExpandedFractiles[fractile.id] = true;
      if (!cellsData[fractile.id]) {
        await fetchCells(fractile.id);
      }
    }
    setExpandedFractiles(newExpandedFractiles);

    // After cells are loaded, expand them too
    setTimeout(async () => {
      const newExpandedCells = {};
      for (const fractile of fractiles) {
        const cells = cellsData[fractile.id] || [];
        for (const cell of cells) {
          newExpandedCells[cell.id] = true;
          if (!tiersData[cell.id]) {
            await fetchTiers(cell.id);
          }
        }
      }
      setExpandedCells(newExpandedCells);
    }, 500);
  };

  const collapseAll = () => {
    setExpandedFractiles({});
    setExpandedCells({});
  };

  // Hierarchical creation helpers
  const addHierarchyCell = () => {
    setHierarchyCells([
      ...hierarchyCells,
      {
        id: nextCellId,
        name: "",
        description: "",
        tiers: [],
      },
    ]);
    setNextCellId(nextCellId + 1);
  };

  const updateHierarchyCell = (cellId, field, value) => {
    setHierarchyCells(
      hierarchyCells.map((c) =>
        c.id === cellId ? { ...c, [field]: value } : c,
      ),
    );
  };

  const removeHierarchyCell = (cellId) => {
    setHierarchyCells(hierarchyCells.filter((c) => c.id !== cellId));
  };

  const addHierarchyTier = (cellId) => {
    setHierarchyCells(
      hierarchyCells.map((c) => {
        if (c.id === cellId) {
          return {
            ...c,
            tiers: [...c.tiers, { id: nextTierId, name: "", description: "" }],
          };
        }
        return c;
      }),
    );
    setNextTierId(nextTierId + 1);
  };

  const updateHierarchyTier = (cellId, tierId, field, value) => {
    setHierarchyCells(
      hierarchyCells.map((c) => {
        if (c.id === cellId) {
          return {
            ...c,
            tiers: c.tiers.map((t) =>
              t.id === tierId ? { ...t, [field]: value } : t,
            ),
          };
        }
        return c;
      }),
    );
  };

  const removeHierarchyTier = (cellId, tierId) => {
    setHierarchyCells(
      hierarchyCells.map((c) => {
        if (c.id === cellId) {
          return {
            ...c,
            tiers: c.tiers.filter((t) => t.id !== tierId),
          };
        }
        return c;
      }),
    );
  };

  // Modal handlers
  const openCreateFractile = () => {
    setModalMode("create");
    setEditItem(null);
    setForm({ name: "", description: "" });
    setFractileData({ name: "", description: "" });
    setHierarchyCells([]);
    setNextCellId(1);
    setNextTierId(1);
    setShowModal(true);
  };

  const openEdit = (type, item) => {
    setModalMode("edit");
    setEditItem({ type, ...item });
    setForm({ name: item.name, description: item.description || "" });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === "create") {
        // Create hierarchy
        if (!fractileData.name.trim()) {
          toast.error("Fractile name is required");
          return;
        }

        const fractileRes = await templateAPI.create("fractiles", {
          name: fractileData.name,
          description: fractileData.description,
        });
        const createdFractile = fractileRes.data.data;

        for (const cell of hierarchyCells) {
          if (cell.name.trim()) {
            const cellRes = await templateAPI.create("cells", {
              name: cell.name,
              description: cell.description,
              fractile_id: createdFractile.id,
            });
            const createdCell = cellRes.data.data;

            for (const tier of cell.tiers) {
              if (tier.name.trim()) {
                await templateAPI.create("tiers", {
                  name: tier.name,
                  description: tier.description,
                  cell_id: createdCell.id,
                });
              }
            }
          }
        }

        toast.success("Hierarchy created successfully");
        fetchFractiles();
      } else {
        // Edit existing item
        const { type, id, fractile_id, cell_id } = editItem;
        await templateAPI.update(`${type}s`, id, {
          name: form.name,
          description: form.description,
        });
        toast.success("Updated successfully");

        if (type === "fractile") {
          fetchFractiles();
        } else if (type === "cell") {
          fetchCells(fractile_id);
        } else if (type === "tier") {
          fetchTiers(cell_id);
        }
      }

      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  };

  const handleDelete = async (type, id, parentId = null) => {
    const childType =
      type === "fractile" ? "cells and tiers" : type === "cell" ? "tiers" : "";
    const confirmMsg = childType
      ? `Delete this ${type}? This will also delete all related ${childType}.`
      : `Delete this ${type}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await templateAPI.delete(`${type}s`, id);
      toast.success("Deleted successfully");

      if (type === "fractile") {
        fetchFractiles();
        setExpandedFractiles((prev) => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      } else if (type === "cell") {
        fetchCells(parentId);
        setExpandedCells((prev) => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      } else if (type === "tier") {
        fetchTiers(parentId);
      }
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  // Get counts for summary
  const getCellCount = (fractileId) => {
    return cellsData[fractileId]?.length || 0;
  };

  const getTierCount = (cellId) => {
    return tiersData[cellId]?.length || 0;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Component Templates</h2>
        <Button
          className="bg-sky-400 hover:bg-sky-500"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Hierarchy: Fractile → Cell → Tier. Click the arrow to expand and view
        nested items.
      </p>

      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Fractiles</h3>
          <span className="text-sm text-gray-500">
            ({fractiles.length} total)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <FaExpandAlt className="w-3 h-3 mr-1" /> Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <FaCompressAlt className="w-3 h-3 mr-1" /> Collapse All
          </Button>
          <Button onClick={openCreateFractile}>
            <FaPlus className="w-3 h-3 mr-2" /> Create Fractile
          </Button>
        </div>
      </div>

      {/* Table View */}
      <div className="border rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : fractiles.length === 0 ? (
          <div className="text-gray-500 text-center py-8 bg-gray-50">
            No fractiles found. Click "Create Fractile" to add one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="w-12"></TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Children</TableHead>
                <TableHead className="text-right w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fractiles.map((fractile) => (
                <React.Fragment key={fractile.id}>
                  {/* Fractile Row */}
                  <TableRow
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleFractile(fractile.id)}
                  >
                    <TableCell className="text-center">
                      <button className="p-1 hover:bg-gray-200 rounded">
                        {expandedFractiles[fractile.id] ? (
                          <FaChevronDown className="w-3 h-3" />
                        ) : (
                          <FaChevronRight className="w-3 h-3" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FaFolder className="w-4 h-4" />
                        <span className="text-xs font-semibold px-2 py-0.5 rounded border">
                          FRACTILE
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {fractile.name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {fractile.description || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {expandedFractiles[fractile.id] &&
                      cellsData[fractile.id] ? (
                        <span className="text-sm font-medium">
                          {getCellCount(fractile.id)} Cells
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => openEdit("fractile", fractile)}
                        >
                          <FaEdit className="w-3 h-3 text-gray-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete("fractile", fractile.id)}
                        >
                          <FaTrash className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Cells */}
                  {expandedFractiles[fractile.id] && (
                    <>
                      {loadingCells[fractile.id] ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="pl-12 text-gray-500 text-sm"
                          >
                            Loading cells...
                          </TableCell>
                        </TableRow>
                      ) : !cellsData[fractile.id] ||
                        cellsData[fractile.id].length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="pl-12 text-gray-400 text-sm italic"
                          >
                            No cells in this fractile.
                          </TableCell>
                        </TableRow>
                      ) : (
                        cellsData[fractile.id].map((cell) => (
                          <React.Fragment key={cell.id}>
                            {/* Cell Row */}
                            <TableRow
                              className="bg-gray-50 hover:bg-gray-100 cursor-pointer"
                              onClick={() => toggleCell(cell.id)}
                            >
                              <TableCell className="text-center pl-8">
                                <button className="p-1 hover:bg-gray-200 rounded">
                                  {expandedCells[cell.id] ? (
                                    <FaChevronDown className="w-3 h-3" />
                                  ) : (
                                    <FaChevronRight className="w-3 h-3" />
                                  )}
                                </button>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 pl-4">
                                  <FaCube className="w-4 h-4" />
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded border">
                                    CELL
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {cell.name}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {cell.description || "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                {expandedCells[cell.id] &&
                                tiersData[cell.id] ? (
                                  <span className="text-sm font-medium">
                                    {getTierCount(cell.id)} Tiers
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div
                                  className="flex justify-end gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() =>
                                      openEdit("cell", {
                                        ...cell,
                                        fractile_id: fractile.id,
                                      })
                                    }
                                  >
                                    <FaEdit className="w-3 h-3 text-gray-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() =>
                                      handleDelete("cell", cell.id, fractile.id)
                                    }
                                  >
                                    <FaTrash className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Tiers */}
                            {expandedCells[cell.id] && (
                              <>
                                {loadingTiers[cell.id] ? (
                                  <TableRow>
                                    <TableCell
                                      colSpan={6}
                                      className="pl-20 text-gray-500 text-sm"
                                    >
                                      Loading tiers...
                                    </TableCell>
                                  </TableRow>
                                ) : !tiersData[cell.id] ||
                                  tiersData[cell.id].length === 0 ? (
                                  <TableRow>
                                    <TableCell
                                      colSpan={6}
                                      className="pl-20 text-gray-400 text-sm italic"
                                    >
                                      No tiers in this cell.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  tiersData[cell.id].map((tier) => (
                                    <TableRow
                                      key={tier.id}
                                      className="bg-gray-100 hover:bg-gray-200"
                                    >
                                      <TableCell></TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2 pl-8">
                                          <FaLayerGroup className="w-4 h-4" />
                                          <span className="text-xs font-semibold px-2 py-0.5 rounded border">
                                            TIER
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        {tier.name}
                                      </TableCell>
                                      <TableCell className="text-gray-600">
                                        {tier.description || "-"}
                                      </TableCell>
                                      <TableCell></TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0"
                                            onClick={() =>
                                              openEdit("tier", {
                                                ...tier,
                                                cell_id: cell.id,
                                              })
                                            }
                                          >
                                            <FaEdit className="w-3 h-3 text-gray-600" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() =>
                                              handleDelete(
                                                "tier",
                                                tier.id,
                                                cell.id,
                                              )
                                            }
                                          >
                                            <FaTrash className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          className={
            modalMode === "create"
              ? "max-w-2xl max-h-[80vh] overflow-y-auto"
              : ""
          }
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "edit"
                ? `Edit ${editItem?.type?.charAt(0).toUpperCase() + editItem?.type?.slice(1)}`
                : "Create Fractile Hierarchy"}
            </DialogTitle>
          </DialogHeader>

          {modalMode === "create" ? (
            <form onSubmit={handleSave} className="space-y-4 mt-4">
              {/* Fractile (Root Level) */}
              <div className="border-2 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <FaFolder className="w-5 h-5" />
                  <span className="font-semibold">Fractile (Root)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={fractileData.name}
                      onChange={(e) =>
                        setFractileData({
                          ...fractileData,
                          name: e.target.value,
                        })
                      }
                      placeholder="Enter fractile name"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={fractileData.description}
                      onChange={(e) =>
                        setFractileData({
                          ...fractileData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Optional description"
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Cells Container */}
              <div className="ml-6 border-l-2 border-gray-300 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Cells
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addHierarchyCell}
                    disabled={!fractileData.name.trim()}
                  >
                    <FaPlus className="w-3 h-3 mr-1" /> Add Cell
                  </Button>
                </div>

                {hierarchyCells.length === 0 ? (
                  <div className="text-sm text-gray-400 italic py-2">
                    {fractileData.name.trim()
                      ? 'No cells added yet. Click "Add Cell" to add cells to this fractile.'
                      : "Enter a fractile name first to enable adding cells."}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {hierarchyCells.map((cell, cellIndex) => (
                      <div
                        key={cell.id}
                        className="border rounded-lg p-3 bg-gray-50"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <FaCube className="w-4 h-4" />
                          <span className="font-medium text-sm">
                            Cell {cellIndex + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeHierarchyCell(cell.id)}
                            className="ml-auto text-red-500 hover:text-red-700"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <Input
                            value={cell.name}
                            onChange={(e) =>
                              updateHierarchyCell(
                                cell.id,
                                "name",
                                e.target.value,
                              )
                            }
                            placeholder="Cell name"
                            className="bg-white text-sm"
                          />
                          <Input
                            value={cell.description}
                            onChange={(e) =>
                              updateHierarchyCell(
                                cell.id,
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Description (optional)"
                            className="bg-white text-sm"
                          />
                        </div>

                        {/* Tiers */}
                        <div className="ml-4 border-l-2 border-gray-200 pl-3 mt-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500">
                              Tiers
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => addHierarchyTier(cell.id)}
                              disabled={!cell.name.trim()}
                              className="h-6 text-xs"
                            >
                              <FaPlus className="w-2 h-2 mr-1" /> Add Tier
                            </Button>
                          </div>

                          {cell.tiers.length === 0 ? (
                            <div className="text-xs text-gray-400 italic py-1">
                              {cell.name.trim()
                                ? "No tiers yet."
                                : "Enter cell name first."}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {cell.tiers.map((tier, tierIndex) => (
                                <div
                                  key={tier.id}
                                  className="flex items-center gap-2 bg-gray-100 border rounded p-2"
                                >
                                  <FaLayerGroup className="w-3 h-3 flex-shrink-0" />
                                  <Input
                                    value={tier.name}
                                    onChange={(e) =>
                                      updateHierarchyTier(
                                        cell.id,
                                        tier.id,
                                        "name",
                                        e.target.value,
                                      )
                                    }
                                    placeholder={`Tier ${tierIndex + 1} name`}
                                    className="bg-white text-xs h-7 flex-1"
                                  />
                                  <Input
                                    value={tier.description}
                                    onChange={(e) =>
                                      updateHierarchyTier(
                                        cell.id,
                                        tier.id,
                                        "description",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Description"
                                    className="bg-white text-xs h-7 flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeHierarchyTier(cell.id, tier.id)
                                    }
                                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                                  >
                                    <FaTrash className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              {fractileData.name.trim() && (
                <div className="bg-gray-100 rounded-lg p-3 text-sm">
                  <span className="font-medium">Summary: </span>
                  <span className="text-gray-600">
                    1 Fractile
                    {hierarchyCells.filter((c) => c.name.trim()).length > 0 &&
                      ` → ${hierarchyCells.filter((c) => c.name.trim()).length} Cell(s)`}
                    {hierarchyCells.reduce(
                      (sum, c) =>
                        sum + c.tiers.filter((t) => t.name.trim()).length,
                      0,
                    ) > 0 &&
                      ` → ${hierarchyCells.reduce((sum, c) => sum + c.tiers.filter((t) => t.name.trim()).length, 0)} Tier(s)`}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!fractileData.name.trim()}>
                  Create Hierarchy
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter name"
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Optional description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComponentTemplates;
