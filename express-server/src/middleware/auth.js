import { supabase } from "../config/supabase.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(/\s+/)[1];
    if (!token) {
      return res.status(401).json({ error: "Token not found in header" });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res
        .status(401)
        .json({ error: error?.message || "Invalid or expired token" });
    }

    req.user = { id: data.user.id, email: data.user.email };
    req.token = token;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ error: `Authentication failed: ${err.message}` });
  }
};
