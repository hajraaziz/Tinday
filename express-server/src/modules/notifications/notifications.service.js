import webpush from "web-push";
import { supabase } from "../../config/supabase.js";
import { emitNotification } from "./notifications.emitter.js";

// ── Web Push setup ──────────────────────────────────────────────────────────
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;

let pushEnabled = false;
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT || "mailto:admin@tinday.app",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );
  pushEnabled = true;
} else {
  console.warn(
    "[notifications] Web Push disabled — VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY not set",
  );
}

// ── Web Push fan-out ────────────────────────────────────────────────────────
// Sends the notification to every registered browser for the user, pruning any
// endpoint the push service reports as gone (404/410).
const sendWebPush = async (userId, notification) => {
  if (!pushEnabled) return;

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs?.length) return;

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    type: notification.type,
    data: notification.data,
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      ),
    ),
  );

  const dead = [];
  results.forEach((result, i) => {
    if (
      result.status === "rejected" &&
      [404, 410].includes(result.reason?.statusCode)
    ) {
      dead.push(subs[i].endpoint);
    }
  });

  if (dead.length) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", dead);
  }
};

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Create a notification: persist it, wake any waiting long-poll, and fan out a
 * web push. Designed to be called fire-and-forget — it never throws; failures
 * are logged. Returns the created row (or null on failure).
 */
export const createNotification = async (
  userId,
  { type, title, body, data = {} },
) => {
  try {
    const { data: row, error } = await supabase
      .from("notifications")
      .insert({ user_id: userId, type, title, body, data })
      .select()
      .single();

    if (error) throw error;

    emitNotification(userId, row);

    // Don't let a push failure reject the caller — it's best-effort.
    sendWebPush(userId, row).catch((err) =>
      console.error("[notifications] web push failed:", err.message),
    );

    return row;
  } catch (err) {
    console.error("[notifications] createNotification failed:", err.message);
    return null;
  }
};

/**
 * Paginated list (newest first) plus the user's total unread count.
 * `before` is an ISO timestamp cursor (exclusive) for older pages.
 */
export const listNotifications = async (userId, { limit = 20, before } = {}) => {
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) query = query.lt("created_at", before);

  const { data, error } = await query;
  if (error) throw error;

  const unread_count = await getUnreadCount(userId);
  return { notifications: data, unread_count };
};

export const getUnreadCount = async (userId) => {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
  return count || 0;
};

export const markRead = async (userId, id) => {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
};

export const markAllRead = async (userId) => {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
};

/**
 * Rows created strictly after the `after` cursor (ISO timestamp), oldest first.
 * Used by the long-poll endpoint to drain anything missed between reconnects.
 */
export const getNotificationsAfter = async (userId, after) => {
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(50);

  if (after) query = query.gt("created_at", after);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const saveSubscription = async (userId, subscription, userAgent) => {
  const { endpoint, keys } = subscription;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    const err = new Error("Invalid push subscription");
    err.status = 400;
    throw err;
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: userAgent || null,
    },
    { onConflict: "endpoint" },
  );

  if (error) throw error;
};

export const removeSubscription = async (userId, endpoint) => {
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);

  if (error) throw error;
};
