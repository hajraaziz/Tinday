import request from "supertest";
import { app, httpServer } from "../src/index.js";
import { supabase } from "../src/config/supabase.js";

describe("Auth Module", () => {
  const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: "password123",
    name: "Test User",
  };
  let userId;
  let accessToken;
  let refreshToken;

  afterAll(async () => {
    // Cleanup: Delete the test user
    if (userId) {
      await supabase.auth.admin.deleteUser(userId);
    }
    // Close the server to prevent Jest from hanging
    await new Promise((resolve) => httpServer.close(resolve));
  });

  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/Account created/);
    expect(res.body.user).toBeDefined();
    userId = res.body.user.id;

    // Registration now requires email confirmation (Supabase hosted flow).
    // Confirm the email via the admin API so the login flow below can proceed.
    await supabase.auth.admin.updateUserById(userId, { email_confirm: true });
  });

  it("should login the user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.session).toHaveProperty("access_token");
    expect(res.body.session).toHaveProperty("refresh_token");
    accessToken = res.body.session.access_token;
    refreshToken = res.body.session.refresh_token;
  });

  it("should get current user info", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe(testUser.name);
  });

  it("should refresh the token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refresh_token: refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.session).toHaveProperty("access_token");
    expect(res.body.session).toHaveProperty("refresh_token");
  });

  it("should logout the user", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
  });
});
