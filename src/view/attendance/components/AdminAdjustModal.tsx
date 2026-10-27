"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { AttendanceRecord } from "../../../modules/attendance/actions/attendance.actions";

interface AdminAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  onSubmit: (data: {
    userId: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: string;
    notes?: string;
  }) => void;
  isSubmitting: boolean;
}

export const AdminAdjustModal: React.FC<AdminAdjustModalProps> = ({
  isOpen,
  onClose,
  record,
  onSubmit,
  isSubmitting,
}) => {
  const [form, setForm] = useState({
    status: "PRESENT",
    checkInTime: "",
    checkOutTime: "",
    notes: "",
  });

  useEffect(() => {
    if (record) {
      setForm({
        status: record.status || "PRESENT",
        checkInTime: record.checkInTime ? new Date(record.checkInTime).toISOString().slice(11, 16) : "09:00",
        checkOutTime: record.checkOutTime ? new Date(record.checkOutTime).toISOString().slice(11, 16) : "18:00",
        notes: record.notes || "Admin manual time adjustment",
      });
    }
  }, [record]);

  if (!record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dateBase = record.date;
    const inDate = form.checkInTime ? `${dateBase}T${form.checkInTime}:00` : undefined;
    const outDate = form.checkOutTime ? `${dateBase}T${form.checkOutTime}:00` : undefined;

    onSubmit({
      userId: record.userId,
      date: record.date,
      checkInTime: inDate,
      checkOutTime: outDate,
      status: form.status,
      notes: form.notes,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin Timesheet Manual Override"
      description={`Adjust attendance timing and status for ${record.user?.name || "employee"} on ${record.date}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Check-In Time
            </label>
            <Input
              type="time"
              value={form.checkInTime}
              onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}
              className="text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Check-Out Time
            </label>
            <Input
              type="time"
              value={form.checkOutTime}
              onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })}
              className="text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
            Status Override
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none cursor-pointer"
          >
            <option value="PRESENT">PRESENT</option>
            <option value="ABSENT">ABSENT</option>
            <option value="LATE">LATE</option>
            <option value="HALF_DAY">HALF_DAY</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
            Audit Reason / Notes
          </label>
          <Textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Reason for manual adjustment (e.g. employee forgot to check in)..."
            className="text-xs"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
          >
            Save Override
          </Button>
        </div>
      </form>
    </Modal>
  );
};
