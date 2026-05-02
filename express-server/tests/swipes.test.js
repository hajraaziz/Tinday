import request from "supertest";
import { app, httpServer } from "../src/index.js";
import { supabase } from "../src/config/supabase.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Swipes and Matches Module", () => {
  let userA, userB, userC;

  const createTestUser = async (name) => {
    const email = `swipe_test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
    const password = "password123";

    // Use the registration endpoint to ensure profiles are created correctly via the service
    const regRes = await request(app).post("/api/auth/register").send({
      email,
      password,
      name
    });
    
    if (regRes.status !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
    }
    
    const userId = regRes.body.user.id;

    // Login to get token
    const loginRes = await request(app).post("/api/auth/login").send({
      email,
      password,
    });
    
    if (loginRes.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }
    
    return { id: userId, token: loginRes.body.session.access_token };
  };

  beforeAll(async () => {
    userA = await createTestUser("User A");
    userB = await createTestUser("User B");
    userC = await createTestUser("User C");
    // Give Supabase time to ensure profiles are visible
    await sleep(2000);
  }, 50000);

  afterAll(async () => {
    if (userA) await supabase.auth.admin.deleteUser(userA.id);
    if (userB) await supabase.auth.admin.deleteUser(userB.id);
    if (userC) await supabase.auth.admin.deleteUser(userC.id);
    await new Promise((resolve) => httpServer.close(resolve));
  }, 15000);

  it("should record a LEFT swipe", async () => {
    // User A swipes LEFT on User C
    const res = await request(app)
      .post("/api/swipes")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ receiver_id: userC.id, direction: "LEFT" });

    if (res.status !== 201) {
      console.error("LEFT swipe failed:", res.body);
    }
    expect(res.status).toBe(201);
  });

  it("should create a match on mutual RIGHT swipe", async () => {
    // User B swipes RIGHT on User A
    const resB = await request(app)
      .post("/api/swipes")
      .set("Authorization", `Bearer ${userB.token}`)
      .send({ receiver_id: userA.id, direction: "RIGHT" });
    
    expect(resB.status).toBe(201);

    // User A swipes RIGHT on User B
    const resA = await request(app)
      .post("/api/swipes")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ receiver_id: userB.id, direction: "RIGHT" });

    expect(resA.status).toBe(201);

    // Let's check for match creation.
    const matchesRes = await request(app)
      .get("/api/matches")
      .set("Authorization", `Bearer ${userA.token}`);

    expect(matchesRes.status).toBe(200);
    // Based on matches.service.js transformation
    const match = matchesRes.body.find(
      (m) => m.user.id === userB.id
    );
    expect(match).toBeDefined();
  });
});
