"use client";

import { MessageCircle, RefreshCw, Send, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { InboxUIProps } from "@/components/Inbox/types";
import { formatDateTime, initials } from "@/lib/format";

function toneForConversation(status: "open" | "pending" | "closed") {
  if (status === "open") {
    return "warning" as const;
  }
  if (status === "pending") {
    return "neutral" as const;
  }
  return "success" as const;
}

function formatConversationTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();
  if (isSameDay) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  const isSameYear = date.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(isSameYear ? {} : { year: "numeric" }),
  }).format(date);
}

function channelLabel(channel: "email" | "sms"): string {
  return channel === "email" ? "Email" : "SMS";
}

export default function InboxUI({
  loading,
  error,
  conversations,
  selectedConversationId,
  messages,
  draft,
  sending,
  aiAssistEnabled,
  aiProviderConfigured,
  draftingWithAi,
  onSelectConversation,
  onDraftChange,
  onSend,
  onGenerateAiDraft,
  onRefresh,
}: InboxUIProps) {
  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ?? null;
  const selectedContactName = selectedConversation
    ? `${selectedConversation.contact?.firstName ?? "Unknown"} ${selectedConversation.contact?.lastName ?? ""}`.trim()
    : "No conversation selected";
  const selectedContactDetail = selectedConversation
    ? selectedConversation.contact?.email ?? selectedConversation.contact?.phone ?? "No contact details available"
    : "Choose a conversation from the list";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="stratum-header">Communications Layer</p>
          <h2 className="mt-1 text-2xl font-semibold" style={{ color: "#1A1A1A" }}>
            Inbox
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-all duration-200"
          style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
          onMouseEnter={(event) => {
            event.currentTarget.style.borderColor = "#00AA6C";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin" : ""}
            style={{ color: "#00AA6C" }}
          />
          Refresh
        </button>
      </div>

      <div className="fault-line" />

      {error ? (
        <div
          className="rounded-md border px-4 py-3 text-sm"
          style={{ borderColor: "#F59E0B40", background: "#FFFBEB", color: "#92400E" }}
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <aside className="panel flex max-h-[72vh] flex-col overflow-hidden">
          <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs uppercase tracking-[0.12em]" style={{ color: "#5A6A7A" }}>
              Conversations
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: "#1A1A1A" }}>
              {conversations.length} active thread{conversations.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.map((conversation) => {
              const fullName = `${conversation.contact?.firstName ?? "Unknown"} ${conversation.contact?.lastName ?? ""}`.trim();
              const active = conversation.id === selectedConversationId;
              const preview = conversation.latestMessage?.body ?? "No messages yet";
              const previewTime =
                formatConversationTimestamp(
                  conversation.latestMessage?.createdAt ?? conversation.lastMessageAt,
                ) || " ";

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => void onSelectConversation(conversation.id)}
                  className="mb-2 w-full rounded-md border p-3 text-left transition-all duration-200"
                  style={
                    active
                      ? {
                          borderColor: "#00AA6C80",
                          background: "linear-gradient(160deg, #F1FCF8 0%, #FFFFFF 68%)",
                          borderLeft: "3px solid #00AA6C",
                        }
                      : { borderColor: "var(--border)", background: "#ffffff" }
                  }
                  onMouseEnter={(event) => {
                    if (!active) {
                      event.currentTarget.style.borderColor = "#00AA6C40";
                    }
                  }}
                  onMouseLeave={(event) => {
                    if (!active) {
                      event.currentTarget.style.borderColor = "var(--border)";
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
                        style={{
                          background: "#00AA6C15",
                          color: "#00AA6C",
                          border: "1px solid #00AA6C25",
                        }}
                      >
                        {initials(fullName)}
                      </span>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                          {fullName}
                        </p>
                        <p className="text-xs" style={{ color: "#5A6A7A" }}>
                          {channelLabel(conversation.channel)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px]" style={{ color: "#5A6A7A" }}>
                        {previewTime}
                      </p>
                      <div className="mt-1 inline-block">
                        <StatusBadge
                          tone={toneForConversation(conversation.status)}
                          label={conversation.status}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed" style={{ color: "#425466" }}>
                    {preview}
                  </p>
                  <p className="mt-2 text-[11px]" style={{ color: "#5A6A7A" }}>
                    {conversation.contact?.email ?? conversation.contact?.phone ?? "No contact details"}
                  </p>
                </button>
              );
            })}
            {!conversations.length ? (
              <p className="p-3 text-sm" style={{ color: "#5A6A7A" }}>
                No conversations yet.
              </p>
            ) : null}
          </div>
        </aside>

        <section className="panel flex max-h-[72vh] min-h-[70vh] flex-col overflow-hidden">
          <div
            className="border-b p-4"
            style={{
              borderColor: "var(--border)",
              background: "linear-gradient(180deg, #FFFFFF 0%, #F8FBFD 100%)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                  {selectedContactName}
                </p>
                <p className="text-xs" style={{ color: "#5A6A7A" }}>
                  {selectedContactDetail}
                </p>
              </div>
              {selectedConversation ? (
                <div className="text-right">
                  <p className="text-xs" style={{ color: "#5A6A7A" }}>
                    {channelLabel(selectedConversation.channel)}
                  </p>
                  <p className="mt-1 text-[11px]" style={{ color: "#5A6A7A" }}>
                    Updated {formatDateTime(selectedConversation.lastMessageAt)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div
            className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
            style={{ background: "linear-gradient(180deg, #F8FBFD 0%, #F2F6FA 100%)" }}
          >
            {messages.length ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="max-w-[80%] rounded-xl border px-3 py-2 text-sm shadow-sm"
                  style={
                    message.direction === "outbound"
                      ? {
                          marginLeft: "auto",
                          borderColor: "#00AA6C3D",
                          background: "linear-gradient(160deg, #F1FFF8 0%, #E8FAF3 100%)",
                          color: "#1A1A1A",
                        }
                      : {
                          borderColor: "var(--border)",
                          background: "#ffffff",
                          color: "#1A1A1A",
                        }
                  }
                >
                  <p
                    className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: "#5A6A7A" }}
                  >
                    {message.direction === "outbound"
                      ? "You"
                      : selectedConversation?.contact?.firstName ?? "Contact"}
                  </p>
                  <p>{message.body}</p>
                  <p className="mt-1 text-[11px]" style={{ color: "#5A6A7A" }}>
                    {formatDateTime(message.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-sm" style={{ color: "#5A6A7A" }}>
                <MessageCircle size={16} className="mr-2" />
                {loading ? "Loading conversations..." : "Select a conversation"}
              </div>
            )}
          </div>

          <div className="border-t p-3" style={{ borderColor: "var(--border)" }}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px]" style={{ color: "#5A6A7A" }}>
                {aiAssistEnabled
                  ? aiProviderConfigured
                    ? "AI reply assist enabled"
                    : "AI reply assist enabled but Groq key is not configured"
                  : "AI reply assist disabled in workspace settings"}
              </p>
              <button
                type="button"
                onClick={() => void onGenerateAiDraft()}
                disabled={
                  !selectedConversationId ||
                  !aiAssistEnabled ||
                  !aiProviderConfigured ||
                  draftingWithAi
                }
                className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
              >
                <Sparkles size={12} style={{ color: "#2563EB" }} />
                {draftingWithAi ? "Drafting..." : "AI draft"}
              </button>
            </div>
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(event) => onDraftChange(event.target.value)}
                rows={3}
                placeholder="Reply to this conversation"
                className="min-h-[84px] flex-1 resize-none rounded-md border px-3 py-2 text-sm outline-none transition-colors"
                style={{ borderColor: "var(--border)", background: "#ffffff", color: "#1A1A1A" }}
                onFocus={(event) => {
                  event.currentTarget.style.borderColor = "#00AA6C";
                }}
                onBlur={(event) => {
                  event.currentTarget.style.borderColor = "var(--border)";
                }}
              />
              <button
                type="button"
                onClick={() => void onSend()}
                disabled={sending || !selectedConversationId || !draft.trim()}
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "#00AA6C", color: "#ffffff", border: "1px solid #00AA6C" }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "#009960";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = "#00AA6C";
                }}
              >
                <Send size={14} />
                {sending ? "Sending" : "Send"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
