import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/index.js";
import { initialCard } from "../frontend/src/cards.js";
test("Commercial lifecycle: tenant isolation, quotas, edits, revocation, expiry and secure sessions", async () => {
  const { app, db } = createApp({
    dbPath: ":memory:",
    adminPassword: "A-long-testing-password-123",
    production: false,
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function call(path, method = "GET", data, cookie) {
    const r = await fetch(base + "/api" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return {
      status: r.status,
      data: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0],
      headers: r.headers,
    };
  }
  try {
    assert.equal((await call("/cards")).status, 401);
    assert.equal(
      (await call("/login", "POST", { username: "admin", password: "wrong" }))
        .status,
      401,
    );
    const owner = await call("/login", "POST", {
      username: "admin",
      password: "A-long-testing-password-123",
    });
    assert.equal(owner.status, 200);
    assert.match(owner.headers.get("set-cookie"), /HttpOnly/);
    assert.match(owner.headers.get("set-cookie"), /SameSite=Strict/);
    const shopData = {
      name: "محل الاختبار",
      username: "shop-one",
      password: "Shop-testing-password-123",
      expires: "2099-12-31",
      quota: 2,
    };
    const first = await call("/admin/shops", "POST", shopData, owner.cookie);
    assert.equal(first.status, 201);
    assert.equal(
      (await call("/admin/shops", "POST", shopData, owner.cookie)).status,
      409,
    );
    await call(
      "/admin/shops",
      "POST",
      { ...shopData, username: "shop-two" },
      owner.cookie,
    );
    const one = await call("/login", "POST", {
      username: shopData.username,
      password: shopData.password,
    });
    const two = await call("/login", "POST", {
      username: "shop-two",
      password: shopData.password,
    });
    assert.equal(
      (await call("/admin/shops", "GET", null, one.cookie)).status,
      403,
    );
    const c = { ...initialCard, to: "نورة", message: "رسالة اختبار عربية" };
    const created = await call("/cards", "POST", { card: c }, one.cookie);
    assert.equal(created.status, 201);
    const id = created.data[0].id;
    assert.equal(
      (await call("/cards", "GET", null, two.cookie)).data.length,
      0,
    );
    assert.equal(
      (
        await call(
          "/cards/" + id,
          "PATCH",
          { card: { ...c, message: "اختراق" } },
          two.cookie,
        )
      ).status,
      404,
    );
    assert.equal((await call("/gifts/" + id)).data.card.message, c.message);
    assert.equal(
      (
        await call(
          "/cards/" + id,
          "PATCH",
          { card: { ...c, message: "الرسالة الجديدة" } },
          one.cookie,
        )
      ).status,
      200,
    );
    assert.equal(
      (await call("/gifts/" + id)).data.card.message,
      "الرسالة الجديدة",
    );
    await call("/cards/" + id, "PATCH", { revoked: true }, one.cookie);
    assert.equal((await call("/gifts/" + id)).status, 404);
    await call("/cards/" + id, "PATCH", { revoked: false }, one.cookie);
    assert.equal(
      (await call("/cards", "POST", { cards: [c, c] }, one.cookie)).status,
      403,
    );
    assert.equal(
      (await call("/cards", "GET", null, one.cookie)).data.length,
      1,
    );
    assert.equal(
      (await call("/cards", "POST", { card: c }, one.cookie)).status,
      201,
    );
    assert.equal(
      (await call("/cards", "POST", { card: c }, one.cookie)).status,
      403,
    );
    await call("/brand", "PUT", { name: "هوية محل واحد" }, one.cookie);
    assert.notEqual(
      (await call("/brand", "GET", null, two.cookie)).data.name,
      "هوية محل واحد",
    );
    const blocked = await fetch(base + "/api/brand", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        cookie: one.cookie,
        origin: "https://evil.example",
      },
      body: JSON.stringify({ name: "bad" }),
    });
    assert.equal(blocked.status, 403);
    const secondSession = await call("/login", "POST", {
      username: shopData.username,
      password: shopData.password,
    });
    assert.equal(
      (
        await call(
          "/password",
          "POST",
          {
            currentPassword: "incorrect",
            newPassword: "New-long-shop-password-123",
          },
          one.cookie,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await call(
          "/password",
          "POST",
          {
            currentPassword: shopData.password,
            newPassword: "New-long-shop-password-123",
          },
          one.cookie,
        )
      ).status,
      200,
    );
    assert.equal(
      (await call("/me", "GET", null, secondSession.cookie)).status,
      401,
    );
    assert.equal(
      (
        await call("/login", "POST", {
          username: shopData.username,
          password: shopData.password,
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await call("/login", "POST", {
          username: shopData.username,
          password: "New-long-shop-password-123",
        })
      ).status,
      200,
    );
    await call(
      "/admin/shops/" + first.data.id,
      "PATCH",
      { expires: "2020-01-01" },
      owner.cookie,
    );
    assert.equal(
      (await call("/cards", "POST", { card: c }, one.cookie)).status,
      403,
    );
    assert.equal((await call("/gifts/" + id)).status, 200);
    await call("/logout", "POST", {}, two.cookie);
    assert.equal((await call("/me", "GET", null, two.cookie)).status, 401);
  } finally {
    await new Promise((r) => server.close(r));
    db.close();
  }
});
