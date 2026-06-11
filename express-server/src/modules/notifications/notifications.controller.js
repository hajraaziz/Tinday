import * as notificationsService from "./notifications.service.js";
import { subscribeOnce } from "./notifications.emitter.js";

const LONG_POLL_TIMEOUT_MS = 27000;

export const list = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const before = req.query.before;
  const result = await notificationsService.listNotifications(req.user.id, {
    limit,
    before,
  });
  res.json(result);
};

export const unreadCount = async (req, res) => {
  const unread_count = await notificationsService.getUnreadCount(req.user.id);
  res.json({ unread_count });
};

export const markRead = async (req, res) => {
  await notificationsService.markRead(req.user.id, req.params.id);
  res.json({ success: true });
};

export const markAllRead = async (req, res) => {
  await notificationsService.markAllRead(req.user.id);
  res.json({ success: true });
};

export const remove = async (req, res) => {
  await notificationsService.deleteNotification(req.user.id, req.params.id);
  res.json({ success: true });
};

export const subscribePush = async (req, res) => {
  await notificationsService.saveSubscription(
    req.user.id,
    req.body,
    req.get("user-agent"),
  );
  res.status(201).json({ success: true });
};

export const unsubscribePush = async (req, res) => {
  await notificationsService.removeSubscription(req.user.id, req.body.endpoint);
  res.json({ success: true });
};

// Long-poll: respond immediately if anything is newer than `?after`, otherwise
// hold the request until a notification arrives or ~27s elapses. The client
// re-opens immediately with the newest timestamp it has seen.
export const stream = async (req, res) => {
  const userId = req.user.id;
  const after = req.query.after;

  const existing = await notificationsService.getNotificationsAfter(
    userId,
    after,
  );
  if (existing.length) {
    return res.json({ notifications: existing });
  }

  let settled = false;
  let timer;
  let unsubscribe = () => {};

  const finish = (notifications) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    unsubscribe();
    res.json({ notifications });
  };

  unsubscribe = subscribeOnce(userId, (notification) => finish([notification]));
  timer = setTimeout(() => finish([]), LONG_POLL_TIMEOUT_MS);

  // Client navigated away / aborted — clean up without responding.
  req.on("close", () => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    unsubscribe();
  });
};
