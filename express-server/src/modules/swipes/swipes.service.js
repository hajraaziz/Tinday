import { supabase } from "../../config/supabase.js";
import axios from "axios";
import { createNotification } from "../notifications/notifications.service.js";

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL || "http://fastapi:8000";
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;

export const recordSwipe = async (giverId, receiverId, direction) => {
  // 1. Insert the swipe
  const { data: swipe, error: swipeError } = await supabase
    .from("swipes")
    .insert({ giver_id: giverId, receiver_id: receiverId, direction })
    .select()
    .single();

  if (swipeError) {
    if (swipeError.code === "23505") {
      const error = new Error("You have already swiped on this user");
      error.status = 409;
      throw error;
    }
    throw swipeError;
  }

  let match = null;

  // 2. If direction is RIGHT, check for mutual swipe
  if (direction === "RIGHT") {
    const { data: mutualSwipe, error: mutualError } = await supabase
      .from("swipes")
      .select("*")
      .eq("giver_id", receiverId)
      .eq("receiver_id", giverId)
      .eq("direction", "RIGHT")
      .maybeSingle();

    console.log("Mutual swipe check result:", mutualSwipe, mutualError);

    if (mutualSwipe && !mutualError) {
      console.log("Mutual swipe found, creating match...");
      // Create a match
      const { data: newMatch, error: matchError } = await supabase
        .from("matches")
        .insert({
          user_a_id: giverId < receiverId ? giverId : receiverId,
          user_b_id: giverId < receiverId ? receiverId : giverId,
        })
        .select()
        .single();

      console.log("Match insert error:", matchError);
      console.log("Match insert result:", newMatch);

      if (!matchError) {
        match = newMatch;
        // Fire-and-forget: notify both users of the new match.
        notifyMatch(newMatch.id, giverId, receiverId).catch((err) =>
          console.error("Match notification failed:", err.message),
        );
      }
    }
  }

  // 3. Fire-and-forget: call FastAPI /update-preference
  axios
    .post(
      `${FASTAPI_URL}/update-preference`,
      { user_id: giverId, target_user_id: receiverId, direction },
      { headers: { "X-Internal-Key": INTERNAL_SECRET } },
    )
    .catch((err) =>
      console.error("FastAPI update-preference failed:", err.message),
    );

  return { swipe, match };
};

// Notify both participants of a new match, each with the other's name.
const notifyMatch = async (matchId, giverId, receiverId) => {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", [giverId, receiverId]);

  const nameOf = (id) =>
    profiles?.find((p) => p.id === id)?.name || "Someone";

  createNotification(receiverId, {
    type: "match",
    title: "New match!",
    body: `You matched with ${nameOf(giverId)}.`,
    data: { matchId, otherUserId: giverId },
  });
  createNotification(giverId, {
    type: "match",
    title: "New match!",
    body: `You matched with ${nameOf(receiverId)}.`,
    data: { matchId, otherUserId: receiverId },
  });
};
