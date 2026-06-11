-- Add the 'connect' notification type: fired when someone swipes right on a user
-- (a one-way connection, before any mutual match). The constraint in
-- 05_notifications.sql is inline, so Postgres auto-named it notifications_type_check.

alter table notifications drop constraint notifications_type_check;
alter table notifications
  add constraint notifications_type_check
  check (type in ('match', 'message', 'connect'));
