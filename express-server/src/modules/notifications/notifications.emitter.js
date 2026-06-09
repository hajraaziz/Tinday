import { EventEmitter } from "events";

// Single-process pub/sub used to wake long-poll requests the instant a
// notification is created. Event name is `notify:<userId>`.
//
// SCALING NOTE: this only works for a single Node instance. To run multiple
// instances, swap the emit/subscribe below for Postgres LISTEN/NOTIFY or Redis
// pub/sub — every caller goes through this module, so it's a one-file change.
const emitter = new EventEmitter();
// One listener per in-flight long-poll request; can exceed the default 10.
emitter.setMaxListeners(0);

const channel = (userId) => `notify:${userId}`;

export const emitNotification = (userId, notification) => {
  emitter.emit(channel(userId), notification);
};

// Resolves with the next notification for `userId`, or rejects on abort.
// Returns an unsubscribe fn so callers can clean up on timeout / client close.
export const subscribeOnce = (userId, listener) => {
  const event = channel(userId);
  emitter.once(event, listener);
  return () => emitter.off(event, listener);
};
