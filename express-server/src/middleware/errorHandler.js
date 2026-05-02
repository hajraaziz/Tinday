import { ZodError } from "zod";

export const errorHandler = (err, req, res, next) => {
  // Always log the full error server-side
  console.error(`[Error] ${req.method} ${req.path}`, {
    message: err.message,
    code: err.code,
    status: err.status,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  // ── Zod Validation Error ──────────────────────────────────────────────────
  // Use name/shape check instead of instanceof to avoid ESM duplicate
  // module issues where two separate copies of Zod can be loaded in Docker,
  // causing instanceof to return false even for genuine ZodErrors.
  if (err.name === "ZodError" || (err.issues && Array.isArray(err.issues))) {
    return res.status(422).json({
      error: "Validation error",
      details: (err.issues || []).map((e) => ({
        field: e.path?.join(".") || "unknown",
        message: e.message,
      })),
    });
  }

  // ── Supabase Postgres Errors ──────────────────────────────────────────────

  // Unique constraint violation (e.g. duplicate email, duplicate swipe)
  if (err.code === "23505") {
    return res.status(409).json({
      error: "Conflict",
      message: "A record with this information already exists.",
    });
  }

  // No rows found (Supabase PostgREST error code)
  if (err.code === "PGRST116") {
    return res.status(404).json({
      error: "Not Found",
      message: "The requested resource was not found.",
    });
  }

  // ── Supabase Auth Errors ──────────────────────────────────────────────────

  // Invalid/expired refresh token or OAuth grant
  if (
    err.message?.toLowerCase().includes("invalid_grant") ||
    err.message?.toLowerCase().includes("refresh_token_not_found") ||
    err.message?.toLowerCase().includes("token is expired")
  ) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Session expired. Please log in again.",
    });
  }

  // Supabase AuthApiError (wrong password, unconfirmed email, etc.)
  if (err.name === "AuthApiError" || err.__isAuthError === true) {
    return res.status(401).json({
      error: "Unauthorized",
      message: err.message || "Authentication failed.",
    });
  }

  // Explicit 401 status on the error object
  if (err.status === 401) {
    return res.status(401).json({
      error: "Unauthorized",
      message: err.message || "Authentication failed.",
    });
  }

  // ── Axios Errors (calls to FastAPI failing) ───────────────────────────────
  if (err.isAxiosError) {
    const upstreamStatus = err.response?.status || 502;
    const upstreamMessage =
      process.env.NODE_ENV === "production"
        ? "AI service error."
        : err.response?.data?.detail || err.message;
    return res.status(upstreamStatus >= 500 ? 502 : upstreamStatus).json({
      error: "Upstream service error",
      message: upstreamMessage,
    });
  }

  // ── Default / Unknown Errors ──────────────────────────────────────────────
  const statusCode =
    typeof err.status === "number" && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  return res.status(statusCode).json({
    error: message,
  });
};
