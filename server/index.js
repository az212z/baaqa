import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { DatabaseSync } from "node:sqlite";
import {
  scryptSync,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { cleanCard, validateCard } from "../frontend/src/cards.js";
export function createApp({
  dbPath = process.env.DATABASE_PATH || "data/baaqa.sqlite",
  adminPassword = process.env.ADMIN_PASSWORD,
  production = process.env.NODE_ENV === "production",
} = {}) {
  if (!adminPassword || adminPassword.length < 12)
    throw Error("Set ADMIN_PASSWORD to at least 12 characters.");
  if (dbPath !== ":memory:")
    mkdirSync(resolve(dbPath, ".."), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS shops(id TEXT PRIMARY KEY,name TEXT NOT NULL,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,expires TEXT NOT NULL,quota INTEGER NOT NULL DEFAULT 500,active INTEGER NOT NULL DEFAULT 1,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,shop_id TEXT,role TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS cards(id TEXT PRIMARY KEY,shop_id TEXT NOT NULL REFERENCES shops(id),payload TEXT NOT NULL,created TEXT NOT NULL,revoked INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS settings(shop_id TEXT PRIMARY KEY REFERENCES shops(id),payload TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS cards_shop ON cards(shop_id);`);
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", Number(process.env.TRUST_PROXY || 0));
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:"],
          fontSrc: ["'self'"],
          frameSrc: ["https://www.youtube-nocookie.com"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: production ? [] : null,
        },
      },
      referrerPolicy: { policy: "no-referrer" },
      strictTransportSecurity: production ? undefined : false,
    }),
  );
  app.use("/api", express.json({ limit: "1mb" }));
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.get("origin");
      if (origin && origin !== `${req.protocol}://${req.get("host")}`)
        return res.status(403).json({ error: "مصدر الطلب غير مسموح" });
    }
    next();
  });
  const hashPassword = (p, salt = randomBytes(16).toString("hex")) =>
    salt + ":" + scryptSync(p, salt, 64).toString("hex");
  const checkPassword = (p, encoded) => {
    try {
      const [s, h] = encoded.split(":");
      return timingSafeEqual(scryptSync(p, s, 64), Buffer.from(h, "hex"));
    } catch {
      return false;
    }
  };
  const adminHash = hashPassword(adminPassword);
  const tokenHash = (t) => createHash("sha256").update(t).digest("hex");
  app.use("/api", (req, res, next) => {
    const token = req.headers.cookie
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("baaqa_session="))
      ?.slice(14);
    if (token) {
      const s = db
        .prepare("SELECT * FROM sessions WHERE token=? AND expires>?")
        .get(tokenHash(token), Date.now());
      if (s) req.session = s;
    }
    next();
  });
  const auth = (req, res, next) =>
    req.session
      ? next()
      : res.status(401).json({ error: "سجّل الدخول للمتابعة" });
  const admin = (req, res, next) =>
    req.session?.role === "admin"
      ? next()
      : res.status(403).json({ error: "صلاحية المالك مطلوبة" });
  const merchant = (req, res, next) => {
    if (req.session?.role !== "shop")
      return res.status(401).json({ error: "سجّل دخول المحل" });
    req.shop = db
      .prepare("SELECT * FROM shops WHERE id=?")
      .get(req.session.shop_id);
    if (
      !req.shop ||
      !req.shop.active ||
      new Date(req.shop.expires).getTime() < Date.now()
    )
      return res
        .status(403)
        .json({ error: "اشتراك المحل غير نشط. تواصل مع مزوّد باقة لتجديده." });
    next();
  };
  app.get("/api/config", (req, res) =>
    res.json({ mode: "commercial", version: 1 }),
  );
  app.post(
    "/api/login",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 15,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { error: "محاولات كثيرة. حاول لاحقًا." },
    }),
    (req, res) => {
      const { username, password } = req.body;
      if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        password.length > 200
      )
        return res.status(400).json({ error: "بيانات الدخول غير صالحة" });
      const shop =
        username === "admin"
          ? null
          : db
              .prepare("SELECT * FROM shops WHERE username=?")
              .get(username.toLowerCase());
      const valid =
        username === "admin"
          ? checkPassword(password, adminHash)
          : shop && checkPassword(password, shop.password);
      if (!valid)
        return res
          .status(401)
          .json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      if (
        shop &&
        (!shop.active || new Date(shop.expires).getTime() < Date.now())
      )
        return res
          .status(403)
          .json({ error: "الاشتراك غير نشط. تواصل مع مزوّد الخدمة." });
      const token = randomBytes(32).toString("hex");
      db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
      db.prepare("INSERT INTO sessions VALUES(?,?,?,?)").run(
        tokenHash(token),
        shop?.id || null,
        shop ? "shop" : "admin",
        Date.now() + 8 * 60 * 60 * 1000,
      );
      res.cookie("baaqa_session", token, {
        httpOnly: true,
        secure: production,
        sameSite: "strict",
        path: "/",
        maxAge: 8 * 60 * 60 * 1000,
      });
      res.json({ ok: true });
    },
  );
  app.post("/api/logout", auth, (req, res) => {
    db.prepare("DELETE FROM sessions WHERE token=?").run(req.session.token);
    res.clearCookie("baaqa_session", { path: "/" });
    res.json({ ok: true });
  });
  app.post("/api/password", merchant, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (
      typeof currentPassword !== "string" ||
      currentPassword.length > 200 ||
      typeof newPassword !== "string" ||
      newPassword.length < 12 ||
      newPassword.length > 200
    )
      return res
        .status(400)
        .json({ error: "كلمة المرور الجديدة ١٢ حرفًا على الأقل" });
    if (!checkPassword(currentPassword, req.shop.password))
      return res.status(400).json({ error: "كلمة المرور الحالية غير صحيحة" });
    db.prepare("UPDATE shops SET password=? WHERE id=?").run(
      hashPassword(newPassword),
      req.shop.id,
    );
    db.prepare("DELETE FROM sessions WHERE shop_id=? AND token!=?").run(
      req.shop.id,
      req.session.token,
    );
    res.json({ ok: true });
  });
  app.post("/api/admin/shops/:id/password", auth, admin, (req, res) => {
    const { password } = req.body;
    if (
      typeof password !== "string" ||
      password.length < 12 ||
      password.length > 200
    )
      return res.status(400).json({ error: "كلمة المرور ١٢ حرفًا على الأقل" });
    const changed = db
      .prepare("UPDATE shops SET password=? WHERE id=?")
      .run(hashPassword(password), req.params.id);
    if (!changed.changes)
      return res.status(404).json({ error: "المحل غير موجود" });
    db.prepare("DELETE FROM sessions WHERE shop_id=?").run(req.params.id);
    res.json({ ok: true });
  });
  app.get("/api/me", auth, (req, res) => {
    if (req.session.role === "admin") return res.json({ role: "admin" });
    const shop = db
      .prepare(
        "SELECT id,name,username,expires,quota,active FROM shops WHERE id=?",
      )
      .get(req.session.shop_id);
    if (!shop || !shop.active || new Date(shop.expires).getTime() < Date.now())
      return res.status(403).json({ error: "اشتراك المحل غير نشط" });
    res.json({
      role: "shop",
      shop,
      used: db
        .prepare("SELECT COUNT(*) AS n FROM cards WHERE shop_id=?")
        .get(shop.id).n,
    });
  });
  app.get("/api/admin/shops", auth, admin, (req, res) =>
    res.json(
      db
        .prepare(
          "SELECT s.id,s.name,s.username,s.expires,s.quota,s.active,s.created,COUNT(c.id) AS used FROM shops s LEFT JOIN cards c ON s.id=c.shop_id GROUP BY s.id ORDER BY s.created DESC",
        )
        .all(),
    ),
  );
  app.post("/api/admin/shops", auth, admin, (req, res) => {
    const { name, username, password, expires, quota } = req.body;
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 60 ||
      typeof username !== "string" ||
      !/^\w[\w.-]{2,49}$/.test(username) ||
      username.toLowerCase() === "admin" ||
      typeof password !== "string" ||
      password.length < 12 ||
      password.length > 200 ||
      !Number.isFinite(Date.parse(expires)) ||
      !Number.isInteger(quota) ||
      quota < 1 ||
      quota > 100000
    )
      return res
        .status(400)
        .json({
          error:
            "تحقق من الحقول. كلمة المرور ١٢ حرفًا على الأقل واسم المستخدم لاتيني.",
        });
    const id = randomBytes(12).toString("hex");
    try {
      db.prepare("INSERT INTO shops VALUES(?,?,?,?,?,?,1,?)").run(
        id,
        name.trim(),
        username.toLowerCase(),
        hashPassword(password),
        new Date(expires).toISOString(),
        quota,
        new Date().toISOString(),
      );
      res.status(201).json({ id });
    } catch {
      return res.status(409).json({ error: "اسم المستخدم مستخدم مسبقًا" });
    }
  });
  app.patch("/api/admin/shops/:id", auth, admin, (req, res) => {
    const shop = db
      .prepare("SELECT * FROM shops WHERE id=?")
      .get(req.params.id);
    if (!shop) return res.status(404).json({ error: "المحل غير موجود" });
    const {
      active = shop.active,
      expires = shop.expires,
      quota = shop.quota,
    } = req.body;
    if (
      ![0, 1].includes(active) ||
      !Number.isFinite(Date.parse(expires)) ||
      !Number.isInteger(quota) ||
      quota < 1 ||
      quota > 100000
    )
      return res.status(400).json({ error: "بيانات الاشتراك غير صالحة" });
    db.prepare("UPDATE shops SET active=?,expires=?,quota=? WHERE id=?").run(
      active,
      new Date(expires).toISOString(),
      quota,
      shop.id,
    );
    if (!active)
      db.prepare("DELETE FROM sessions WHERE shop_id=?").run(shop.id);
    res.json({ ok: true });
  });
  app.get("/api/cards", merchant, (req, res) =>
    res.json(
      db
        .prepare(
          "SELECT id,payload,created,revoked FROM cards WHERE shop_id=? ORDER BY created DESC",
        )
        .all(req.shop.id)
        .map((x) => ({
          id: x.id,
          card: JSON.parse(x.payload),
          created: x.created,
          revoked: !!x.revoked,
          url: `${req.protocol}://${req.get("host")}/?g=${x.id}`,
        })),
    ),
  );
  app.post("/api/cards", merchant, (req, res) => {
    try {
      const incoming = Array.isArray(req.body.cards)
        ? req.body.cards
        : [req.body.card];
      if (!incoming.length || incoming.length > 1000)
        return res.status(400).json({ error: "عدد الكروت غير صالح" });
      const used = db
        .prepare("SELECT COUNT(*) AS n FROM cards WHERE shop_id=?")
        .get(req.shop.id).n;
      if (used + incoming.length > req.shop.quota)
        return res
          .status(403)
          .json({ error: "وصلت إلى حد الكروت في اشتراكك. اطلب زيادة الباقة." });
      const cards = incoming.map((c) => {
        const cleaned = cleanCard(c);
        const error = validateCard(cleaned);
        if (error) throw Error(error);
        return {
          id: randomBytes(18).toString("base64url"),
          card: cleaned,
          created: new Date().toISOString(),
        };
      });
      db.exec("BEGIN");
      try {
        const stmt = db.prepare(
          "INSERT INTO cards(id,shop_id,payload,created) VALUES(?,?,?,?)",
        );
        cards.forEach((x) =>
          stmt.run(x.id, req.shop.id, JSON.stringify(x.card), x.created),
        );
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
      res
        .status(201)
        .json(
          cards.map((x) => ({
            ...x,
            url: `${req.protocol}://${req.get("host")}/?g=${x.id}`,
          })),
        );
    } catch (e) {
      res.status(400).json({ error: e.message || "تعذّر حفظ الكرت" });
    }
  });
  app.patch("/api/cards/:id", merchant, (req, res) => {
    const old = db
      .prepare("SELECT id FROM cards WHERE id=? AND shop_id=?")
      .get(req.params.id, req.shop.id);
    if (!old) return res.status(404).json({ error: "الكرت غير موجود" });
    try {
      if (req.body.card) {
        const c = cleanCard(req.body.card),
          error = validateCard(c);
        if (error) throw Error(error);
        db.prepare("UPDATE cards SET payload=? WHERE id=? AND shop_id=?").run(
          JSON.stringify(c),
          req.params.id,
          req.shop.id,
        );
      }
      if (typeof req.body.revoked === "boolean")
        db.prepare("UPDATE cards SET revoked=? WHERE id=? AND shop_id=?").run(
          req.body.revoked ? 1 : 0,
          req.params.id,
          req.shop.id,
        );
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app.get(
    "/api/gifts/:id",
    rateLimit({
      windowMs: 60000,
      limit: 120,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { error: "حاول بعد قليل" },
    }),
    (req, res) => {
      const c = db
        .prepare("SELECT payload FROM cards WHERE id=? AND revoked=0")
        .get(req.params.id);
      if (!c)
        return res.status(404).json({ error: "الكرت غير متاح أو أوقفه المحل" });
      res.json({ card: JSON.parse(c.payload) });
    },
  );
  app.get("/api/brand", merchant, (req, res) => {
    const b = db
      .prepare("SELECT payload FROM settings WHERE shop_id=?")
      .get(req.shop.id);
    res.json(b ? JSON.parse(b.payload) : { name: req.shop.name });
  });
  app.put("/api/brand", merchant, (req, res) => {
    if (typeof req.body.name !== "string" || req.body.name.length > 60)
      return res.status(400).json({ error: "اسم المحل غير صالح" });
    db.prepare(
      "INSERT INTO settings VALUES(?,?) ON CONFLICT(shop_id) DO UPDATE SET payload=excluded.payload",
    ).run(req.shop.id, JSON.stringify({ name: req.body.name.trim() }));
    res.json({ ok: true });
  });
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "المسار غير موجود" }),
  );
  app.use(
    express.static(resolve("dist"), {
      index: "index.html",
      maxAge: production ? "1h" : 0,
    }),
  );
  app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({ error: "تعذّر تنفيذ الطلب. حاول مجددًا." });
  });
  return { app, db };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve("server/index.js")
) {
  const { app } = createApp();
  app.listen(Number(process.env.PORT) || 3000, "0.0.0.0", () =>
    console.log("Baaqa commercial server is ready."),
  );
}
