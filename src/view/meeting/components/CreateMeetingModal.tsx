"use client";

import React, { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";
import { Video, Calendar, Link2, AlignLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    link: string;
    scheduledAt: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  // Default to 15 minutes from now in ISO format for datetime-local
  const getDefaultDateTime = () => {
    const d = new Date(Date.now() + 15 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  const [scheduledAt, setScheduledAt] = useState(getDefaultDateTime());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }
    if (!link.trim()) {
      toast.error("Please enter a meeting link (Google Meet, Zoom, etc.)");
      return;
    }

    // Format link to have https:// if missing
    let cleanLink = link.trim();
    if (!cleanLink.startsWith("http://") && !cleanLink.startsWith("https://")) {
      cleanLink = `https://${cleanLink}`;
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      link: cleanLink,
      scheduledAt: new Date(scheduledAt).toISOString(),
    });

    setTitle("");
    setDescription("");
    setLink("");
    setScheduledAt(getDefaultDateTime());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Workspace Meeting"
      description="Create a video conference or team sync. Authorized members will receive an instant push notification."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
        {/* Title */}
        <div>
          <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-violet-500" />
            <span>Meeting Title *</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Daily Standup & Cross-Squad Sync"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white"
          />
        </div>

        {/* Meeting Link */}
        <div>
          <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-violet-500" />
            <span>Meeting Link / URL *</span>
          </label>
          <input
            type="text"
            required
            placeholder="https://meet.google.com/xyz-abcd-efg or Zoom link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white font-mono text-2xs"
          />
        </div>

        {/* Date & Time */}
        <div>
          <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-violet-500" />
            <span>Scheduled Date & Time *</span>
          </label>
          <input
            type="datetime-local"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white"
          />
        </div>

        {/* Description / Agenda */}
        <div>
          <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
            <AlignLeft className="w-3.5 h-3.5 text-violet-500" />
            <span>Agenda & Description (Optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Discuss project roadmap, blocker issues, and sprint delivery..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white resize-none"
          />
        </div>

        <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-3xs text-violet-700 dark:text-violet-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
          <span>
            Instant push and in-app notifications will be delivered immediately to all members who have access to this page.
          </span>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-white/[0.06]">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isLoading || !title.trim() || !link.trim()}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold"
          >
            {isLoading ? "Scheduling..." : "Schedule Meeting"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
