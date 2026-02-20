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

const types = ["fractiles", "cells", "tiers"];

const ComponentTemplates = ({ initialType = "fractiles" }) => {
  const [activeType, setActiveType] = useState(initialType);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchList();
  }, [activeType]);

  useEffect(() => {
    if (initialType && initialType !== activeType) {
      setActiveType(initialType);
    }
  }, [initialType]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await templateAPI.list(activeType);
      setItems(res.data.data);
    } catch (e) {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: "", description: "" });
    setShowModal(true);
  };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description || "" });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await templateAPI.update(activeType, editItem.id, form);
        toast.success("Updated");
      } else {
        await templateAPI.create(activeType, form);
        toast.success("Created");
      }
      setShowModal(false);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await templateAPI.delete(activeType, id);
      toast.success("Deleted");
      fetchList();
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Component Templates</h2>
      <div className="mb-4 flex gap-2">
        {types.map((t) => (
          <Button
            key={t}
            variant={t === activeType ? "default" : "outline"}
            onClick={() => setActiveType(t)}
          >
            {t}
          </Button>
        ))}
        <div className="flex-1" />
        <Button onClick={openCreate}>Create {activeType.slice(0, -1)}</Button>
      </div>

      <div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.name}</TableCell>
                  <TableCell>{it.description}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(it)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(it.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit" : "Create"} {activeType.slice(0, -1)}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComponentTemplates;
