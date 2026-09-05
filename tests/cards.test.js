import test from "node:test";
import assert from "node:assert/strict";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import {
  initialCard,
  encodeCard,
  decodeCard,
  cleanCard,
  youtubeId,
  validateCard,
} from "../frontend/src/cards.js";
const card = {
  ...initialCard,
  to: "نورة",
  from: "سارة",
  message: "كل عام وأنت بخير ❤️\nرسالة عربية مع أسطر جديدة.",
  shop: "ورد المدينة",
};
test("Arabic card and Unicode survive share URL and QR image scanning", async () => {
  const url = encodeCard(card, "https://az212z.github.io/baaqa/?old=1#test");
  const recovered = decodeCard(new URL(url).searchParams.get("gift"));
  assert.deepEqual(recovered, card);
  const png = PNG.sync.read(
    await QRCode.toBuffer(url, {
      width: 1200,
      margin: 4,
      errorCorrectionLevel: "M",
    }),
  );
  assert.equal(
    jsQR(new Uint8ClampedArray(png.data), png.width, png.height).data,
    url,
  );
});
test("Maximum message survives actual QR decoding", async () => {
  const c = {
    ...card,
    message: "أبجد هوز حطي كلمن سعفص قرشت ثخذ ضظغ ".repeat(12).slice(0, 400),
  };
  const url = encodeCard(c, "https://example.com/");
  const png = PNG.sync.read(
    await QRCode.toBuffer(url, {
      width: 1600,
      margin: 4,
      errorCorrectionLevel: "M",
    }),
  );
  assert.equal(
    jsQR(new Uint8ClampedArray(png.data), png.width, png.height).data,
    url,
  );
});
test("Corrupt payloads rejected and protocol injection is blocked", () => {
  assert.throws(() => decodeCard("bad"));
  assert.throws(() => decodeCard("a".repeat(7001)));
  assert.throws(() => cleanCard({ message: { html: "unsafe" } }));
  assert.equal(youtubeId("javascript:alert(1)"), null);
  assert.equal(
    youtubeId("https://youtube.com.evil.example/watch?v=abcdefghijk"),
    null,
  );
  assert.equal(youtubeId("https://youtu.be/abcdefghijk"), "abcdefghijk");
  assert.ok(validateCard(initialCard));
});
