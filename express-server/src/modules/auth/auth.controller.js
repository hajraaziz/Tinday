import * as authService from "./auth.service.js";

export const register = async (req, res) => {
  const { email, password, name } = req.body;
  const result = await authService.register({ email, password, name });
  res.status(201).json(result);
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  res.json(result);
};

export const refresh = async (req, res) => {
  const { refresh_token } = req.body;
  const result = await authService.refresh({ refresh_token });
  res.json(result);
};

export const logout = async (req, res) => {
  await authService.logout(req.user.id);
  res.status(200).json({ message: "Logged out successfully." });
};

export const me = async (req, res) => {
  const result = await authService.getCurrentUser(req.user.id);
  res.json(result);
};
