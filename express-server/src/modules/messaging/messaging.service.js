import { supabase } from "../../config/supabase.js";
import { createNotification } from "../notifications/notifications.service.js";

/**
 * Verify if a user is part of a match
 */
export const verifyMatchMembership = async (matchId, userId) => {
  const { data, error } = await supabase
    .from("matches")
    .select("user_a_id, user_b_id")
    .eq("id", matchId)
    .single();

  if (error || !data) {
    const err = new Error("Match not found");
    err.status = 404;
    throw err;
  }

  if (data.user_a_id !== userId && data.user_b_id !== userId) {
    const err = new Error("Access denied: Not a member of this match");
    err.status = 403;
    throw err;
  }

  return data;
};

/**
 * Get messages for a match with pagination
 */
export const getMessages = async (matchId, userId, from = 0, to = 49) => {
  await verifyMatchMembership(matchId, userId);

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) throw error;

  // Bulk-mark the other party's unread messages as read. Fire and forget.
  markMessagesRead(matchId, userId).then(({ error: updateError }) => {
    if (updateError) console.error("Error updating read_at:", updateError);
  });

  return data;
};

/**
 * Mark every message the OTHER party sent in this match as read.
 * Returns the Supabase update result ({ error }); callers decide to await or not.
 */
export const markMessagesRead = (matchId, userId) =>
  supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("match_id", matchId)
    .neq("sender_id", userId)
    .is("read_at", null);

/**
 * Explicitly mark a conversation read (e.g. from the inbox ⋯ menu), guarded by
 * match membership and awaited so the response reflects completion.
 */
export const markMatchRead = async (matchId, userId) => {
  await verifyMatchMembership(matchId, userId);
  const { error } = await markMessagesRead(matchId, userId);
  if (error) throw error;
  return { success: true };
};

/**
 * Send a message to a match
 */
export const sendMessage = async (matchId, userId, content) => {
  const match = await verifyMatchMembership(matchId, userId);

  const { data, error } = await supabase
    .from("messages")
    .insert({
      match_id: matchId,
      sender_id: userId,
      content,
    })
    .select()
    .single();

  if (error) throw error;

  // Fire-and-forget: notify the recipient (the other member of the match).
  const recipientId =
    match.user_a_id === userId ? match.user_b_id : match.user_a_id;
  notifyMessage(recipientId, userId, matchId, data).catch((err) =>
    console.error("Message notification failed:", err.message),
  );

  return data;
};

// Notify the recipient of a new message, titled with the sender's name and a
// truncated preview as the body. Skipped entirely when the recipient has muted
// the chat, so a mute silences both the notification row and any web push.
const notifyMessage = async (recipientId, senderId, matchId, message) => {
  const { data: state } = await supabase
    .from("match_user_state")
    .select("muted")
    .eq("match_id", matchId)
    .eq("user_id", recipientId)
    .maybeSingle();
  if (state?.muted) return;

  const { data: sender } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", senderId)
    .maybeSingle();

  const preview =
    message.content.length > 120
      ? `${message.content.slice(0, 120)}…`
      : message.content;

  createNotification(recipientId, {
    type: "message",
    title: sender?.name || "New message",
    body: preview,
    data: { matchId, messageId: message.id, senderId },
  });
};

const STATE_COLUMNS = "match_id, muted, deleted_at";

/**
 * Set the current user's mute flag for a match (idempotent).
 * Only touches `muted`, so it never clobbers a soft-delete and vice versa.
 */
export const setMatchMuted = async (matchId, userId, muted) => {
  await verifyMatchMembership(matchId, userId);

  const { data, error } = await supabase
    .from("match_user_state")
    .upsert(
      {
        match_id: matchId,
        user_id: userId,
        muted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id,user_id" },
    )
    .select(STATE_COLUMNS)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Soft-hide (hidden=true) or restore (hidden=false) a chat for the current
 * user. A hidden chat reappears once newer activity arrives (see getInbox).
 */
export const setMatchHidden = async (matchId, userId, hidden) => {
  await verifyMatchMembership(matchId, userId);

  const { data, error } = await supabase
    .from("match_user_state")
    .upsert(
      {
        match_id: matchId,
        user_id: userId,
        deleted_at: hidden ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id,user_id" },
    )
    .select(STATE_COLUMNS)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get inbox with latest message and unread count
 */
export const getInbox = async (userId) => {
  // Fetch all matches for the user
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      `
      id,
      created_at,
      user_a:profiles!matches_user_a_id_fkey(id, name, avatar_url, skills),
      user_b:profiles!matches_user_b_id_fkey(id, name, avatar_url, skills)
    `,
    )
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

  if (matchesError) throw matchesError;

  // This user's per-match state (mute / soft-delete), keyed by match id.
  const { data: states } = await supabase
    .from("match_user_state")
    .select(STATE_COLUMNS)
    .eq("user_id", userId);
  const stateByMatch = new Map((states ?? []).map((s) => [s.match_id, s]));

  const inbox = await Promise.all(
    matches.map(async (match) => {
      const otherUser =
        match.user_a.id === userId ? match.user_b : match.user_a;

      // Get latest message
      const { data: latestMessage } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", match.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get unread count
      const { count: unreadCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("match_id", match.id)
        .neq("sender_id", userId)
        .is("read_at", null);

      const state = stateByMatch.get(match.id);

      return {
        match_id: match.id,
        other_user: otherUser,
        latest_message: latestMessage || null,
        unread_count: unreadCount || 0,
        last_activity: latestMessage
          ? latestMessage.created_at
          : match.created_at,
        muted: state?.muted ?? false,
        // Internal: drives the soft-delete filter below; not returned to clients.
        _deleted_at: state?.deleted_at ?? null,
      };
    }),
  );

  return inbox
    // A soft-deleted chat stays hidden only until newer activity arrives.
    .filter(
      (entry) =>
        !(
          entry._deleted_at &&
          new Date(entry._deleted_at) >= new Date(entry.last_activity)
        ),
    )
    .map(({ _deleted_at, ...entry }) => entry)
    // Sort by last activity descending
    .sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));
};
