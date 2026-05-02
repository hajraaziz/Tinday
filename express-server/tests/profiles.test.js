import request from "supertest";
import { app, httpServer } from "../src/index.js";
import { supabase } from "../src/config/supabase.js";

describe("Profiles Module", () => {
  let userId;
  let accessToken;

  beforeAll(async () => {
    // Create a test user
    const email = `profile_test_${Date.now()}@example.com`;
    const password = "password123";

    const { data: authData } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    userId = authData.user.id;

    await supabase.from("profiles").insert({ id: userId, name: "Profile Tester" });

    const { data: loginData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    accessToken = loginData.session.access_token;
  });

  afterAll(async () => {
    if (userId) {
      await supabase.auth.admin.deleteUser(userId);
    }
    await new Promise((resolve) => httpServer.close(resolve));
  });

  it("should get own profile", async () => {
    const res = await request(app)
      .get("/api/profiles/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Profile Tester");
  });

  it("should update own profile", async () => {
    const updateData = {
      about: "I am a tester",
      experience_years: 5,
      skills: ["Testing", "Jest"],
    };

    const res = await request(app)
      .put("/api/profiles/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.about).toBe(updateData.about);
    expect(res.body.skills).toEqual(expect.arrayContaining(updateData.skills));
  });

  it("should get profile by ID", async () => {
    const res = await request(app)
      .get(`/api/profiles/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userId);
  });
});
