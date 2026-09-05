import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  FlowerLotus,
  Plus,
  GridFour,
  BookmarkSimple,
  Storefront,
  Question,
  ArrowLeft,
  ArrowRight,
  Check,
  Gift,
  Heart,
  Confetti,
  GraduationCap,
  HandHeart,
  Baby,
  Sun,
  FirstAid,
  MagicWand,
  EnvelopeSimple,
  Eye,
  DeviceMobile,
  DownloadSimple,
  Printer,
  Copy,
  ArrowSquareOut,
  X,
  Trash,
  UploadSimple,
  MusicNote,
  ShieldCheck,
  QrCode,
  PaintBrush,
  TextT,
  Stack,
  FileArrowDown,
  WarningCircle,
  ArrowCounterClockwise,
  CheckCircle,
} from "@phosphor-icons/react";
import QRCode from "qrcode";
import "@fontsource-variable/noto-sans-arabic";
import "@fontsource/amiri/arabic-400.css";
import "./style.css";
import {
  commercial,
  account,
  api,
  CommerceGate,
  AccountControl,
} from "./commerce";
import {
  initialCard,
  occasions,
  themes,
  cleanCard,
  encodeCard,
  decodeCard,
  validateCard,
  youtubeId,
} from "./cards";
const ToastContext = React.createContext("");
const q = new URLSearchParams(location.search);
const legacy =
  q.has("c") ||
  q.has("l") ||
  q.has("t") ||
  /^#(d\/|c\/|invite|e\/|sheet)/.test(location.hash);
if (legacy)
  location.replace(
    new URL("legacy.html", location.href).pathname +
      location.search +
      location.hash,
  );
const icons = [
  Heart,
  Confetti,
  Gift,
  GraduationCap,
  HandHeart,
  Baby,
  Sun,
  FirstAid,
  FlowerLotus,
];
function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const currentBase = () => location.origin + location.pathname;
function ThemeArt({ theme = "rose", small = false }) {
  return (
    <div className={`theme-art art-${theme} ${small ? "art-small" : ""}`}>
      <img src={`${import.meta.env.BASE_URL}images/flowers.jpg`} alt="" />
      <FlowerLotus weight="thin" />
      <span className="art-orbit" />
    </div>
  );
}
function Letter({ card, mini = false }) {
  const t = themes.find((t) => t.id === card.theme) || themes[0];
  return (
    <div
      className={`letter ${mini ? "mini" : ""} font-${card.font}`}
      style={{ "--gift-bg": t.bg, "--gift-ink": t.ink, "--paper": t.paper }}
    >
      <ThemeArt theme={t.id} />
      <div className="letter-text">
        <span className="letter-kicker">
          {occasions.find((o) => o[0] === card.occasion)?.[1]}
        </span>
        <h2>{card.to ? `إلى ${card.to}` : "إلى شخصك المفضّل"}</h2>
        <span className="letter-divider">
          <Heart size={15} weight="fill" />
        </span>
        <p>
          {card.message ||
            "بعض الهدايا تُشبه أصحابها،\nجميلة وقريبة من القلب.\nهذه لك، بكل الحب."}
        </p>
        <div className="letter-from">
          <span>بكل الودّ،</span>
          <strong>{card.from || "من يحبّك"}</strong>
        </div>
      </div>
      <div className="letter-shop">{card.shop || "هدية صغيرة، شعور كبير"}</div>
    </div>
  );
}
function Modal({ title, children, onClose, wide = false }) {
  const toast = React.useContext(ToastContext);
  const ref = useRef();
  useEffect(() => {
    const d = ref.current;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? "modal wide" : "modal"}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button className="icon-button" aria-label="إغلاق" onClick={onClose}>
          <X size={22} />
        </button>
      </header>
      {toast && (
        <p className="modal-toast" role="status">
          {toast}
        </p>
      )}
      {children}
    </dialog>
  );
}
async function qrData(url) {
  return QRCode.toDataURL(url, {
    width: 1000,
    margin: 4,
    errorCorrectionLevel: "M",
    color: { dark: "#25212b", light: "#ffffff" },
  });
}
async function printCanvas(card, url) {
  await Promise.all([
    document.fonts.load("52px Amiri"),
    document.fonts.load('38px "Noto Sans Arabic Variable"'),
  ]);
  const cv = document.createElement("canvas");
  cv.width = 1400;
  cv.height = 1000;
  const ctx = cv.getContext("2d");
  const t = themes.find((t) => t.id === card.theme) || themes[0];
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, 1400, 1000);
  ctx.strokeStyle = t.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(35, 35, 1330, 930);
  ctx.textAlign = "center";
  ctx.direction = "rtl";
  ctx.fillStyle = t.ink;
  ctx.font = '38px "Noto Sans Arabic Variable"';
  ctx.fillText(card.shop || "باقة", 700, 110, 1200);
  ctx.font = "52px Amiri";
  ctx.fillText(`إلى ${card.to}`, 700, 200, 1200);
  const im = new Image();
  im.src = await qrData(url);
  await im.decode();
  ctx.drawImage(im, 460, 245, 480, 480);
  ctx.font = "42px Amiri";
  ctx.fillText("هدية تحمل لك حكاية", 700, 795);
  ctx.font = '25px "Noto Sans Arabic Variable"';
  ctx.fillText("امسح الرمز بكاميرا جوالك لفتح رسالتك", 700, 855);
  if (card.from) ctx.fillText(`من ${card.from}`, 700, 915, 1200);
  return cv;
}
function Result({ card, onClose, notify }) {
  const [url] = useState(() => card._url || encodeCard(card, currentBase()));
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);
  const [printImage, setPrintImage] = useState("");
  useEffect(() => {
    qrData(url)
      .then(setQr)
      .catch(() => notify("تعذّر توليد الرمز. اختصر الرسالة وحاول مجددًا."));
  }, [url]);
  async function save(format) {
    setBusy(true);
    try {
      if (format === "svg") {
        download(
          new Blob(
            [
              await QRCode.toString(url, {
                type: "svg",
                margin: 4,
                errorCorrectionLevel: "M",
              }),
            ],
            { type: "image/svg+xml" },
          ),
          "baaqa-qr.svg",
        );
      } else {
        const cv = await printCanvas(card, url);
        const blob = await new Promise((r) => cv.toBlob(r));
        download(blob, "baaqa-card.png");
      }
      notify("تم تجهيز الملف للتحميل");
    } catch {
      notify("تعذّر التصدير، حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  }
  async function print() {
    try {
      const cv = await printCanvas(card, url);
      setPrintImage(cv.toDataURL());
    } catch {
      notify("تعذّر تجهيز الطباعة");
    }
  }
  useEffect(() => {
    if (printImage) {
      const im = new Image();
      im.onload = () => window.print();
      im.src = printImage;
    }
  }, [printImage]);
  return (
    <Modal title="كرتك جاهز للمشاركة" onClose={onClose}>
      <div className="result-intro">
        <CheckCircle size={30} weight="fill" />
        <p>رسالة جميلة، تنتظر أول مسحة.</p>
      </div>
      <div className="result-qr">
        {qr ? (
          <img src={qr} alt="رمز QR لفتح الكرت" />
        ) : (
          <p role="status">جارٍ إنشاء الرمز…</p>
        )}
        <strong>إلى {card.to}</strong>
      </div>
      <p className="hint centered">
        اطبع الرمز بحجم ٤ سم أو أكبر، وجرب مسحه قبل تسليم الهدية.
      </p>
      <div className="result-actions">
        <button
          className="primary"
          disabled={busy || !qr}
          onClick={() => save("png")}
        >
          <DownloadSimple />
          تحميل بطاقة PNG
        </button>
        <button
          className="secondary"
          disabled={busy || !qr}
          onClick={() => save("svg")}
        >
          <QrCode />
          رمز SVG
        </button>
        <button className="secondary" disabled={!qr} onClick={print}>
          <Printer />
          طباعة البطاقة
        </button>
        <button
          className="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              notify("تم نسخ رابط الكرت");
            } catch {
              notify("يمكنك نسخ الرابط من الحقل بالأسفل");
            }
          }}
        >
          <Copy />
          نسخ الرابط
        </button>
      </div>
      <a
        className="text-link centered block"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        فتح تجربة المستلم <ArrowSquareOut />
      </a>
      <label className="link-field">
        رابط الكرت
        <input
          aria-label="رابط الكرت"
          readOnly
          value={url}
          dir="ltr"
          onFocus={(e) => e.target.select()}
        />
      </label>
      <p className="hint">
        {commercial
          ? "رابط خاص بالكرت. يمكنك تعديل الرسالة أو إيقاف الكرت من المحفوظة."
          : "يحتوي الرابط على الرسالة. يستطيع كل من يملكه فتحها، ولا يتغير محتواه بعد الطباعة."}
      </p>
      {printImage && (
        <div className="print-area">
          <img src={printImage} alt="بطاقة الطباعة" />
        </div>
      )}
    </Modal>
  );
}
function Recipient({ card }) {
  const [opened, setOpened] = useState(card.opening === "direct");
  const [playing, setPlaying] = useState(false);
  function open() {
    setOpened(true);
    if (card.sound) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [523, 659, 784, 1046].forEach((freq, i) => {
          const o = ctx.createOscillator(),
            g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = freq;
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0, ctx.currentTime + i * 0.16);
          g.gain.linearRampToValueAtTime(
            0.12,
            ctx.currentTime + i * 0.16 + 0.03,
          );
          g.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + i * 0.16 + 1.3,
          );
          o.start(ctx.currentTime + i * 0.16);
          o.stop(ctx.currentTime + i * 0.16 + 1.4);
        });
        setTimeout(() => ctx.close(), 2500);
      } catch {}
    }
  }
  const t = themes.find((t) => t.id === card.theme) || themes[0];
  return (
    <main
      className="recipient"
      style={{ "--gift-bg": t.bg, "--gift-ink": t.ink }}
    >
      <a className="recipient-brand" href={currentBase()}>
        <FlowerLotus /> باقة
      </a>
      {opened ? (
        <div className="received">
          <Letter card={card} />
          {youtubeId(card.youtube) && (
            <div className="music">
              <button
                className="secondary"
                onClick={() => setPlaying(!playing)}
              >
                <MusicNote />
                {playing ? "إخفاء المقطع" : "استمع إلى إهدائك"}
              </button>
              {playing && (
                <iframe
                  title="المقطع المرفق بالهدية"
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId(card.youtube)}`}
                  allow="encrypted-media; fullscreen"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          )}
          <button className="text-link" onClick={() => setOpened(false)}>
            <ArrowCounterClockwise />
            مشاهدة الظرف مجددًا
          </button>
        </div>
      ) : (
        <div className="envelope-scene">
          <span className="recipient-intro">هناك من فكّر فيك…</span>
          <h1>
            هدية صغيرة،
            <br />
            ومشاعر كثيرة.
          </h1>
          <button className="envelope" aria-label="افتح هديتك" onClick={open}>
            <span className="envelope-flap" />
            <span className="seal">
              <FlowerLotus size={34} weight="thin" />
            </span>
            <span className="envelope-to">إلى {card.to}</span>
          </button>
          <button className="primary" onClick={open}>
            افتح هديتك <ArrowLeft />
          </button>
          <p>رسالة كُتبت لك، بكل حب</p>
        </div>
      )}
      <footer>صُنعت المشاعر هنا · باقة</footer>
    </main>
  );
}
function App() {
  const [view, setView] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(commercial);
  const [step, setStep] = useState(0);
  const [card, setCard] = useState(() => {
    try {
      return commercial
        ? initialCard
        : cleanCard(read("baaqa.studio.draft", initialCard));
    } catch {
      return initialCard;
    }
  });
  const [saved, setSaved] = useState(() => {
    const a = commercial ? [] : read("baaqa.studio.cards", []);
    return Array.isArray(a) ? a.filter((x) => x && x.id && x.card) : [];
  });
  const [brand, setBrand] = useState(() =>
    commercial ? { name: "" } : read("baaqa.studio.brand", { name: "" }),
  );
  const [modal, setModal] = useState(null);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [bulk, setBulk] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("card");
  const [batch, setBatch] = useState([]);
  const [error, setError] = useState("");
  const timer = useRef();
  const importer = useRef();
  function notify(t) {
    clearTimeout(timer.current);
    setToast(t);
    timer.current = setTimeout(() => setToast(""), 4500);
  }
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!commercial) write("baaqa.studio.draft", card);
  }, [card]);
  async function refresh() {
    try {
      const [cards, b] = await Promise.all([api("/cards"), api("/brand")]);
      setSaved(cards);
      setBrand(b);
    } catch (e) {
      notify(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (commercial) refresh();
  }, []);
  const update = (k, v) => {
    setCard((c) => ({ ...c, [k]: v }));
    setError("");
  };
  function showView(v) {
    setView(v);
    setSearch("");
  }
  async function saveCard(c = card) {
    let final;
    try {
      final = cleanCard({ ...c, shop: c.shop || brand.name || "" });
    } catch (e) {
      setError(e.message);
      return;
    }
    const invalid = validateCard(final);
    if (invalid) {
      setError(invalid);
      setStep(1);
      return;
    }
    if (commercial) {
      setBusy(true);
      try {
        if (editingId) {
          await api("/cards/" + editingId, {
            method: "PATCH",
            body: JSON.stringify({ card: final }),
          });
          const old = saved.find((x) => x.id === editingId);
          setResult({ ...final, _url: old.url });
          setEditingId(null);
        } else {
          const [entry] = await api("/cards", {
            method: "POST",
            body: JSON.stringify({ card: final }),
          });
          setResult({ ...final, _url: entry.url });
        }
        await refresh();
        setError("");
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
      return;
    }
    const entry = {
      id: crypto.randomUUID(),
      created: new Date().toISOString(),
      card: final,
    };
    const next = [entry, ...saved];
    const stored = write("baaqa.studio.cards", next);
    if (stored) setSaved(next);
    else notify("الكرت جاهز، لكن ذاكرة الجهاز لم تسمح بحفظه. حمّل نسخة منه.");
    setResult(final);
    setError("");
  }
  function backup() {
    download(
      new Blob([JSON.stringify({ version: 1, cards: saved, brand }, null, 2)], {
        type: "application/json",
      }),
      "baaqa-backup.json",
    );
    notify("تم تجهيز النسخة الاحتياطية");
  }
  async function restore(e) {
    const f = e.target.files[0];
    if (!f) return;
    try {
      if (f.size > 3e6) throw Error();
      const data = JSON.parse(await f.text());
      if (
        data.version !== 1 ||
        !Array.isArray(data.cards) ||
        data.cards.length > 1000
      )
        throw Error();
      const imported = data.cards.map((x) => ({
        id: crypto.randomUUID(),
        created: new Date().toISOString(),
        card: cleanCard(x.card),
      }));
      if (commercial) {
        await api("/cards", {
          method: "POST",
          body: JSON.stringify({ cards: imported.map((x) => x.card) }),
        });
        await refresh();
      } else {
        const next = [...imported, ...saved];
        if (!write("baaqa.studio.cards", next)) throw Error();
        setSaved(next);
      }
      notify(`تم استيراد ${imported.length} كرت`);
    } catch (e) {
      notify(
        commercial
          ? e.message
          : "تعذّر استيراد الملف. تأكد أنه نسخة باقة الاحتياطية وأن مساحة الجهاز كافية.",
      );
    }
    e.target.value = "";
  }
  async function makeBulk() {
    const names = [
      ...new Set(
        bulk
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ];
    if (!names.length || names.length > 30) {
      notify("أضف من اسم واحد إلى ٣٠ اسمًا، كل اسم في سطر");
      return;
    }
    if (names.some((n) => n.length > 60)) {
      notify("اسم المستلم لا يتجاوز ٦٠ حرفًا");
      return;
    }
    const invalid = validateCard({ ...card, to: names[0] });
    if (invalid) {
      notify(invalid);
      return;
    }
    setBusy(true);
    try {
      let entries = await Promise.all(
        names.map(async (name) => {
          const c = cleanCard({
            ...card,
            to: name,
            shop: card.shop || brand.name || "",
          });
          return {
            id: crypto.randomUUID(),
            created: new Date().toISOString(),
            card: c,
            qr: await qrData(encodeCard(c, currentBase())),
          };
        }),
      );
      if (commercial) {
        const created = await api("/cards", {
          method: "POST",
          body: JSON.stringify({ cards: entries.map((x) => x.card) }),
        });
        entries = await Promise.all(
          created.map(async (x) => ({ ...x, qr: await qrData(x.url) })),
        );
        await refresh();
      } else {
        const next = [...entries.map(({ qr, ...rest }) => rest), ...saved];
        if (!write("baaqa.studio.cards", next)) throw Error();
        setSaved(next);
      }
      setBatch(entries);
      setModal("batch");
    } catch (e) {
      notify(
        commercial
          ? e.message
          : "تعذّر إنشاء المجموعة. تحقق من المساحة وحاول مجددًا.",
      );
    } finally {
      setBusy(false);
    }
  }
  const activeTheme = themes.find((t) => t.id === card.theme) || themes[0];
  return (
    <ToastContext.Provider value={toast}>
      <div className="app-shell">
        <aside className="sidebar">
          <a href={currentBase()} className="brand">
            <FlowerLotus weight="thin" size={38} />
            <span>
              باقة<small>BAAQA STUDIO</small>
            </span>
          </a>
          <span className="nav-caption">مساحتك الإبداعية</span>
          <nav aria-label="التنقل الرئيسي">
            {[
              ["create", "إنشاء كرت", Plus],
              ["templates", "التصاميم", GridFour],
              ["saved", "المحفوظة", BookmarkSimple],
              ["brand", "هوية المحل", Storefront],
            ].map(([key, label, Icon]) => (
              <button
                key={key}
                className={view === key ? "nav-item active" : "nav-item"}
                onClick={() => showView(key)}
              >
                <Icon size={21} />
                {label}
                {key === "saved" && (
                  <span className="count">{saved.length}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-note">
              <FlowerLotus size={29} weight="thin" />
              <strong>التفاصيل تصنع الفرق.</strong>
              <p>
                أضف إلى هديتك كلمة
                <br />
                تبقى بعد ذبول الورد.
              </p>
            </div>
            <button className="nav-item" onClick={() => setModal("help")}>
              <Question size={21} />
              كيف تعمل باقة؟
            </button>
            <div className="shop-profile">
              <span>
                <Storefront size={20} />
              </span>
              <div>
                <strong>{brand.name || "مساحة المحل"}</strong>
                <small>استوديو الهدايا الرقمية</small>
              </div>
            </div>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <div className="breadcrumb">
              الاستوديو <span>/</span>
              <strong>
                {
                  {
                    create: "إنشاء كرت جديد",
                    templates: "مكتبة التصاميم",
                    saved: "الكروت المحفوظة",
                    brand: "هوية المحل",
                  }[view]
                }
              </strong>
            </div>
            <div className="topbar-actions">
              <AccountControl />
              <button
                className="help-top"
                aria-label="المساعدة"
                onClick={() => setModal("help")}
              >
                <Question size={18} />
                <span>المساعدة</span>
              </button>
            </div>
          </header>
          <main className="main">
            <div className="page-heading">
              <div>
                <span className="eyebrow">كلماتك، بطريقتك</span>
                <h1>
                  {view === "create" ? (
                    <>
                      لكل هدية، <span>حكاية.</span>
                    </>
                  ) : view === "templates" ? (
                    "تصميم يشبه شعورك."
                  ) : view === "saved" ? (
                    "مشاعر تستحق أن تُحفظ."
                  ) : (
                    "هوية محلك، في كل هدية."
                  )}
                </h1>
                <p>
                  {view === "create"
                    ? "حوّل كلماتك إلى كرت أنيق، يُفتح بمسحة واحدة."
                    : view === "templates"
                      ? "اختر بداية جميلة، وأكملها بكلماتك."
                      : view === "saved"
                        ? commercial
                          ? "كروت محلك محفوظة في حسابك. عدّل الرسالة دون تغيير الباركود."
                          : "كروتك محفوظة على هذا المتصفح. احتفظ بنسخة احتياطية لنقلها."
                        : "تفاصيل بسيطة تجعل تجربة الإهداء تحمل توقيعك."}
                </p>
              </div>
              <div className="heading-mark">
                <Gift weight="thin" size={58} />
              </div>
            </div>
            {commercial && (
              <div className="account-info">
                <span>
                  {account?.shop?.name} ·{" "}
                  {loading
                    ? "جارٍ تحميل الكروت…"
                    : `${saved.length} / ${account?.shop?.quota} كرت`}
                </span>
                <span>
                  الاشتراك حتى{" "}
                  {new Date(account?.shop?.expires).toLocaleDateString("ar-SA")}
                </span>
              </div>
            )}
            {view === "create" && (
              <>
                {editingId && (
                  <div className="edit-banner">
                    تعديل الكرت الحالي دون تغيير الباركود
                    <button
                      onClick={() => {
                        setEditingId(null);
                        notify("تعمل الآن على نسخة جديدة");
                      }}
                    >
                      إلغاء التعديل
                    </button>
                  </div>
                )}
                <div className="creator-layout">
                  <section className="editor">
                    <div className="steps" aria-label="مراحل إنشاء الكرت">
                      {["التصميم", "الرسالة", "اللمسات الأخيرة"].map((s, i) => (
                        <button
                          key={s}
                          className={
                            step === i ? "current" : step > i ? "complete" : ""
                          }
                          onClick={() => setStep(i)}
                        >
                          <span>
                            {step > i ? (
                              <Check size={15} />
                            ) : (
                              ["١", "٢", "٣"][i]
                            )}
                          </span>
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="editor-body">
                      {step === 0 && (
                        <>
                          <div className="section-heading">
                            <h2>ما مناسبة الهدية؟</h2>
                            <span>لكل لحظة، كلماتها</span>
                          </div>
                          <div className="occasions">
                            {occasions.map(([id, name], i) => {
                              const Icon = icons[i];
                              return (
                                <button
                                  key={id}
                                  className={
                                    card.occasion === id ? "selected" : ""
                                  }
                                  aria-pressed={card.occasion === id}
                                  onClick={() => update("occasion", id)}
                                >
                                  <Icon
                                    size={21}
                                    weight={
                                      card.occasion === id ? "fill" : "regular"
                                    }
                                  />
                                  {name}
                                </button>
                              );
                            })}
                          </div>
                          <div className="section-heading template-heading">
                            <h2>اختر طابع الكرت</h2>
                            <span>٦ تصاميم بعناية</span>
                          </div>
                          <div className="theme-grid">
                            {themes.map((t) => (
                              <button
                                key={t.id}
                                className={`theme-option ${card.theme === t.id ? "selected" : ""}`}
                                aria-pressed={card.theme === t.id}
                                onClick={() => update("theme", t.id)}
                              >
                                <div
                                  className="theme-thumb"
                                  style={{ background: t.bg, color: t.ink }}
                                >
                                  <ThemeArt theme={t.id} small />
                                  <span>
                                    {t.id === "night"
                                      ? "إلى أمنياتك الجميلة"
                                      : t.id === "sage"
                                        ? "أنت ربيع أيامي"
                                        : t.id === "sand"
                                          ? "لأنك تستحق"
                                          : t.id === "mono"
                                            ? "بكلّ امتنان"
                                            : t.id === "lilac"
                                              ? "يشبهك الفرح"
                                              : "لكَ الورد، ولكَ الودّ"}
                                  </span>
                                  {card.theme === t.id && (
                                    <b>
                                      <Check size={13} />
                                    </b>
                                  )}
                                </div>
                                <div className="theme-label">
                                  <strong>{t.name}</strong>
                                  <span>{t.tag}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      {step === 1 && (
                        <>
                          <div className="section-heading">
                            <h2>أجمل ما في الهدية، كلماتك.</h2>
                            <EnvelopeSimple size={22} />
                          </div>
                          <div className="two-fields">
                            <label>
                              إلى <span>*</span>
                              <input
                                maxLength={60}
                                value={card.to}
                                onChange={(e) => update("to", e.target.value)}
                                placeholder="اسم الشخص المميّز"
                                autoComplete="off"
                              />
                            </label>
                            <label>
                              من
                              <input
                                maxLength={60}
                                value={card.from}
                                onChange={(e) => update("from", e.target.value)}
                                placeholder="اسمك أو اسم المرسل"
                              />
                            </label>
                          </div>
                          <label className="message-label">
                            رسالة الهدية <span>*</span>
                            <textarea
                              maxLength={400}
                              value={card.message}
                              onChange={(e) =>
                                update("message", e.target.value)
                              }
                              placeholder="اكتب ما يمليه عليك قلبك…"
                              rows={6}
                            />
                          </label>
                          <div className="message-tools">
                            <button
                              className="text-link"
                              onClick={() =>
                                update(
                                  "message",
                                  occasions.find(
                                    (o) => o[0] === card.occasion,
                                  )[2],
                                )
                              }
                            >
                              <MagicWand size={18} />
                              اقترح لي رسالة
                            </button>
                            <span>{card.message.length} / 400</span>
                          </div>
                          <label>
                            اسم المحل على الكرت
                            <input
                              value={card.shop || ""}
                              onChange={(e) => update("shop", e.target.value)}
                              maxLength={60}
                              placeholder={
                                brand.name || "اختياري، مثل: زهور المدينة"
                              }
                            />
                          </label>
                          <div className="info-note">
                            <Heart size={20} />
                            <span>
                              لا تحتاج إلى كلمات كثيرة. كلمة صادقة تكفي.
                            </span>
                          </div>
                        </>
                      )}
                      {step === 2 && (
                        <>
                          <div className="section-heading">
                            <h2>تفاصيل صغيرة، أثر جميل.</h2>
                            <PaintBrush size={22} />
                          </div>
                          <label>خط الرسالة</label>
                          <div className="font-options">
                            <button
                              className={
                                card.font === "amiri" ? "selected" : ""
                              }
                              onClick={() => update("font", "amiri")}
                            >
                              <span className="amiri">رسالة من القلب</span>
                              <small>أميري · كلاسيكي</small>
                            </button>
                            <button
                              className={card.font === "sans" ? "selected" : ""}
                              onClick={() => update("font", "sans")}
                            >
                              <span>رسالة من القلب</span>
                              <small>عربي · حديث</small>
                            </button>
                          </div>
                          <label>كيف تُفتح الهدية؟</label>
                          <div className="opening-options">
                            <button
                              className={
                                card.opening === "envelope" ? "selected" : ""
                              }
                              onClick={() => update("opening", "envelope")}
                            >
                              <EnvelopeSimple />
                              ظرف يحمل مفاجأة
                            </button>
                            <button
                              className={
                                card.opening === "direct" ? "selected" : ""
                              }
                              onClick={() => update("opening", "direct")}
                            >
                              <Eye />
                              الرسالة مباشرة
                            </button>
                          </div>
                          <label className="toggle-row">
                            <div>
                              <strong>نغمة عند فتح الظرف</strong>
                              <small>لمسة موسيقية قصيرة وهادئة</small>
                            </div>
                            <input
                              type="checkbox"
                              checked={card.sound}
                              onChange={(e) =>
                                update("sound", e.target.checked)
                              }
                            />
                          </label>
                          <label>
                            رابط إهداء من يوتيوب <small>اختياري</small>
                            <input
                              dir="ltr"
                              type="url"
                              value={card.youtube}
                              onChange={(e) =>
                                update("youtube", e.target.value)
                              }
                              placeholder="https://www.youtube.com/watch?v=…"
                              maxLength={200}
                            />
                          </label>
                          <p className="hint">
                            يظهر زر للاستماع داخل الكرت. تشغيل المقطع يتطلب
                            الإنترنت.
                          </p>
                          <button
                            className="text-link"
                            onClick={() => setModal("bulk")}
                          >
                            <Stack size={18} />
                            نفس الرسالة لأكثر من شخص
                          </button>
                        </>
                      )}
                      {error && (
                        <p className="form-error" role="alert">
                          <WarningCircle />
                          {error}
                        </p>
                      )}
                    </div>
                    <div className="editor-footer">
                      <span>
                        <ShieldCheck size={17} />
                        {commercial
                          ? "مساحة محلك الخاصة"
                          : "يُحفظ التصميم على جهازك"}
                      </span>
                      <div>
                        {step > 0 && (
                          <button
                            className="back-button"
                            onClick={() => setStep(step - 1)}
                            aria-label="الخطوة السابقة"
                          >
                            <ArrowRight />
                          </button>
                        )}
                        {step < 2 ? (
                          <button
                            className="primary"
                            onClick={() => setStep(step + 1)}
                          >
                            التالي:{" "}
                            {step === 0 ? "اكتب رسالتك" : "اللمسات الأخيرة"}
                            <ArrowLeft size={18} />
                          </button>
                        ) : (
                          <button
                            className="primary"
                            disabled={busy}
                            onClick={() => saveCard()}
                          >
                            <QrCode size={20} />
                            {busy
                              ? "جارٍ الحفظ…"
                              : editingId
                                ? "تحديث الكرت"
                                : "إنشاء الباركود"}
                          </button>
                        )}
                      </div>
                    </div>
                  </section>
                  <aside className="preview-panel">
                    <div className="preview-heading">
                      <span>
                        <span className="live-dot" />
                        معاينة مباشرة
                      </span>
                      <DeviceMobile size={19} />
                    </div>
                    <div className="preview-switch">
                      <button
                        className={preview === "card" ? "on" : ""}
                        onClick={() => setPreview("card")}
                      >
                        كرت الهدية
                      </button>
                      <button
                        className={preview === "envelope" ? "on" : ""}
                        onClick={() => setPreview("envelope")}
                      >
                        الظرف
                      </button>
                    </div>
                    <div
                      className="preview-stage"
                      style={{
                        "--gift-bg": activeTheme.bg,
                        "--gift-ink": activeTheme.ink,
                      }}
                    >
                      {preview === "card" ? (
                        <Letter
                          card={{ ...card, shop: card.shop || brand.name }}
                          mini
                        />
                      ) : (
                        <div className="preview-envelope">
                          <div className="envelope">
                            <span className="envelope-flap" />
                            <span className="seal">
                              <FlowerLotus size={24} />
                            </span>
                            <span className="envelope-to">
                              إلى {card.to || "شخصك المفضّل"}
                            </span>
                          </div>
                          <p>مفاجأة صغيرة تنتظر أن تُفتح</p>
                        </div>
                      )}
                    </div>
                    <button
                      className="preview-button"
                      onClick={() => setModal("preview")}
                    >
                      <Eye size={19} />
                      جرّب تجربة المستلم
                      <ArrowSquareOut size={16} />
                    </button>
                    <p className="preview-caption">
                      هكذا تصل مشاعرك إلى من تحب.
                    </p>
                  </aside>
                </div>
                <div className="benefits">
                  <span>
                    <QrCode />
                    باركود حقيقي، يُفتح بالكاميرا
                  </span>
                  <span>
                    <DownloadSimple />
                    جودة عالية للطباعة
                  </span>
                  <span>
                    <Heart />
                    تجربة عربية من أول حرف
                  </span>
                </div>
              </>
            )}
            {view === "templates" && (
              <div className="template-gallery">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    className="gallery-item"
                    onClick={() => {
                      update("theme", t.id);
                      setView("create");
                      setStep(1);
                    }}
                  >
                    <Letter card={{ ...initialCard, theme: t.id }} mini />
                    <div>
                      <h2>{t.name}</h2>
                      <span>
                        استخدم التصميم <ArrowLeft />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {view === "saved" && (
              <section className="library">
                <div className="library-toolbar">
                  <input
                    aria-label="البحث في الكروت"
                    placeholder="ابحث باسم المستلم أو الرسالة…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button
                    className="secondary"
                    onClick={backup}
                    disabled={!saved.length}
                  >
                    <FileArrowDown />
                    نسخة احتياطية
                  </button>
                  <button
                    className="secondary"
                    onClick={() => importer.current.click()}
                  >
                    <UploadSimple />
                    استيراد
                  </button>
                  <input
                    ref={importer}
                    hidden
                    type="file"
                    accept="application/json,.json"
                    onChange={restore}
                  />
                </div>
                {saved.length === 0 ? (
                  <div className="empty">
                    <BookmarkSimple size={52} weight="thin" />
                    <h2>هنا تبدأ حكاياتك الجميلة.</h2>
                    <p>أنشئ أول كرت، وستجده هنا بعد توليد الباركود.</p>
                    <button
                      className="primary"
                      onClick={() => setView("create")}
                    >
                      <Plus />
                      إنشاء أول كرت
                    </button>
                    <a href="legacy.html#new" className="text-link">
                      فتح كروت النسخة السابقة
                    </a>
                  </div>
                ) : (
                  <div className="saved-grid">
                    {saved
                      .filter((x) =>
                        `${x.card.to} ${x.card.message}`.includes(search),
                      )
                      .map((x) => (
                        <article key={x.id} className="saved-card">
                          <div
                            style={{
                              background: themes.find(
                                (t) => t.id === x.card.theme,
                              )?.bg,
                            }}
                          >
                            <FlowerLotus size={28} />
                            <strong>إلى {x.card.to}</strong>
                            <span>
                              {
                                occasions.find(
                                  (o) => o[0] === x.card.occasion,
                                )?.[1]
                              }
                            </span>
                          </div>
                          <p>{x.card.message}</p>
                          <small>
                            {new Date(x.created).toLocaleDateString("ar-SA")}
                          </small>
                          <div className="saved-actions">
                            <button
                              className="secondary"
                              onClick={() =>
                                setResult({ ...x.card, _url: x.url })
                              }
                            >
                              <QrCode />
                              فتح الكرت
                            </button>
                            <button
                              className="icon-button"
                              aria-label={`${commercial ? "تعديل" : "نسخ"} كرت ${x.card.to}`}
                              onClick={() => {
                                setCard(x.card);
                                setView("create");
                                setStep(1);
                                if (commercial) {
                                  setEditingId(x.id);
                                  notify(
                                    "عدّل الرسالة ثم احفظ لتحديث الكرت بنفس الباركود",
                                  );
                                } else
                                  notify(
                                    "تم نسخ التصميم للتعديل. الكرت الأصلي لم يتغير.",
                                  );
                              }}
                            >
                              <Copy />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={`${commercial ? (x.revoked ? "تفعيل" : "إيقاف") : "حذف"} كرت ${x.card.to}`}
                              onClick={() =>
                                setModal({ delete: x.id, revoked: x.revoked })
                              }
                            >
                              <Trash className={x.revoked ? "revoked" : ""} />
                            </button>
                          </div>
                          {x.revoked && <p className="hint">هذا الكرت موقوف</p>}
                        </article>
                      ))}
                  </div>
                )}
                {saved.length > 0 &&
                  !saved.some((x) =>
                    `${x.card.to} ${x.card.message}`.includes(search),
                  ) && (
                    <div className="empty">
                      <p>لا توجد كروت تطابق البحث.</p>
                    </div>
                  )}
              </section>
            )}
            {view === "brand" && (
              <section className="brand-settings">
                <div className="settings-copy">
                  <Storefront size={40} weight="thin" />
                  <h2>توقيعك في كل كرت.</h2>
                  <p>
                    يظهر اسم محلك في نهاية الرسالة وعلى البطاقة المطبوعة. يُطبّق
                    على الكروت الجديدة.
                  </p>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const name = new FormData(e.currentTarget)
                      .get("name")
                      .trim();
                    if (commercial) {
                      try {
                        await api("/brand", {
                          method: "PUT",
                          body: JSON.stringify({ name }),
                        });
                        setBrand({ name });
                        notify("تم حفظ هوية المحل");
                      } catch (e) {
                        notify(e.message);
                      }
                      return;
                    }
                    if (write("baaqa.studio.brand", { name })) {
                      setBrand({ name });
                      notify("تم حفظ هوية المحل");
                    } else notify("تعذّر حفظ الهوية على هذا الجهاز");
                  }}
                >
                  <label>
                    اسم المحل
                    <input
                      name="name"
                      maxLength={60}
                      defaultValue={brand.name}
                      placeholder="مثل: زهور المدينة"
                    />
                  </label>
                  <p className="hint">
                    اتركه فارغًا لإصدار الكرت دون اسم المحل.
                  </p>
                  <button className="primary" type="submit">
                    <Check />
                    حفظ الهوية
                  </button>
                  <div className="info-note">
                    <ShieldCheck />
                    <span>
                      {commercial
                        ? "تُحفظ الهوية في حساب محلك."
                        : "تُحفظ الهوية في هذا المتصفح، دون تسجيل حساب."}
                    </span>
                  </div>
                </form>
                {commercial && (
                  <form
                    className="password-settings"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget,
                        f = new FormData(form);
                      if (f.get("newPassword") !== f.get("confirmPassword")) {
                        notify("كلمتا المرور غير متطابقتين");
                        return;
                      }
                      try {
                        await api("/password", {
                          method: "POST",
                          body: JSON.stringify({
                            currentPassword: f.get("currentPassword"),
                            newPassword: f.get("newPassword"),
                          }),
                        });
                        form.reset();
                        notify(
                          "تم تغيير كلمة المرور وتسجيل خروج الجلسات الأخرى",
                        );
                      } catch (e) {
                        notify(e.message);
                      }
                    }}
                  >
                    <h2>حماية حساب المحل</h2>
                    <label>
                      كلمة المرور الحالية
                      <input
                        name="currentPassword"
                        type="password"
                        autoComplete="current-password"
                        required
                      />
                    </label>
                    <label>
                      كلمة المرور الجديدة
                      <input
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        minLength={12}
                        maxLength={200}
                        required
                      />
                    </label>
                    <label>
                      تأكيد كلمة المرور
                      <input
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        minLength={12}
                        maxLength={200}
                        required
                      />
                    </label>
                    <button className="secondary" type="submit">
                      تحديث كلمة المرور
                    </button>
                  </form>
                )}
              </section>
            )}
          </main>
          <footer className="footer">
            <span>
              باقة © {new Date().getFullYear()} · هدية تُشعَر، لا تُنسى.
            </span>
            <button onClick={() => setModal("privacy")}>
              الخصوصية والاستخدام
            </button>
          </footer>
        </div>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle size={20} />
          {toast}
        </div>
      )}
      {result && (
        <Result card={result} onClose={() => setResult(null)} notify={notify} />
      )}{" "}
      {modal === "preview" && (
        <Modal title="تجربة المستلم" onClose={() => setModal(null)} wide>
          <Recipient
            card={{
              ...card,
              to: card.to || "شخصك المفضّل",
              shop: card.shop || brand.name,
            }}
          />
        </Modal>
      )}
      {modal === "help" && (
        <Modal
          title="من كلمة إلى هدية، في ثلاث خطوات"
          onClose={() => setModal(null)}
        >
          <div className="help-content">
            {[
              ["اختر التصميم", "حدد المناسبة والطابع الذي يناسب هديتك."],
              [
                "اكتب رسالتك",
                "أضف اسم المستلم وكلماتك، وشاهد الكرت يتغيّر أمامك.",
              ],
              [
                "اطبع وشارك",
                "أنشئ الباركود، حمّل البطاقة، وجرّب مسحها بكاميرا جوالك.",
              ],
            ].map(([h, p], i) => (
              <div key={h}>
                <b>{i + 1}</b>
                <section>
                  <h3>{h}</h3>
                  <p>{p}</p>
                </section>
              </div>
            ))}
            <p className="info-note">
              لا يحتاج المستلم إلى تطبيق أو حساب. يلزم اتصال بالإنترنت لفتح رابط
              الكرت لأول مرة.
            </p>
            <p>
              {commercial
                ? "يمكنك تعديل الرسالة دون تغيير الرمز، أو إيقاف الكرت وإعادة تفعيله. انتهاء الاشتراك يوقف الإنشاء ولا يعطّل كروت العملاء."
                : "في نسخة العرض: إذا عدّلت الرسالة، أنشئ رمزًا جديدًا. الحسابات والاشتراكات متاحة في النسخة التجارية المستضافة."}
            </p>
          </div>
        </Modal>
      )}
      {modal === "privacy" && (
        <Modal title="الخصوصية والاستخدام" onClose={() => setModal(null)}>
          <div className="legal">
            <h3>{commercial ? "بيانات المحل" : "بياناتك على جهازك"}</h3>
            <p>
              {commercial
                ? "تُحفظ الكروت وهوية المحل في قاعدة بيانات الاستضافة وتُعزل عن المحلات الأخرى. يستطيع مدير الاستضافة الوصول إلى قاعدة البيانات. تُستخدم جلسة دخول آمنة لمدة ٨ ساعات."
                : "تحفظ باقة المسودات والكروت وهوية المحل في تخزين المتصفح المحلي. مسح بيانات المتصفح يحذف النسخ المحفوظة. نزّل نسخة احتياطية بانتظام."}
            </p>
            <h3>رابط الهدية</h3>
            <p>
              {commercial
                ? "كل من يملك رابط الكرت يستطيع فتحه دون حساب. لا تضع معلومات حساسة. يمكن للمحل تعديل الكرت أو إيقاف رابطه من حسابه."
                : "الرسالة مضمّنة في الرابط وغير مشفّرة. كل من يملك الرابط يمكنه قراءتها. لا تضع معلومات حساسة. لا يمكن سحب الرابط أو تعديل محتواه بعد مشاركته."}
            </p>
            <h3>الخدمات الخارجية</h3>
            <p>
              الاستضافة قد تحتفظ بسجلات الطلبات، بما فيها الرابط. لا تستخدم باقة
              أدوات تحليلات. عند اختيار تشغيل إهداء يوتيوب، يُحمّل المقطع من
              يوتيوب وفق سياساته.
            </p>
            <h3>قبل الطباعة</h3>
            <p>
              اختبر كل رمز على جوال، واحتفظ بمساحة بيضاء حوله. استمرار عمل
              الروابط يعتمد على بقاء الموقع وعنوانه متاحين.
            </p>
          </div>
        </Modal>
      )}
      {modal === "bulk" && (
        <Modal title="هدايا كثيرة، بلمسة واحدة" onClose={() => setModal(null)}>
          <p>نستخدم التصميم والرسالة الحاليين ونخصص اسم المستلم لكل كرت.</p>
          <label>
            أسماء المستلمين
            <textarea
              rows={7}
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              placeholder={"نورة\nسارة\nريم"}
            />
          </label>
          <p className="hint">
            حتى ٣٠ اسمًا، كل اسم في سطر. تُزال الأسماء المكررة.
          </p>
          <button className="primary block" disabled={busy} onClick={makeBulk}>
            {busy ? "جارٍ تجهيز الكروت…" : "إنشاء وحفظ المجموعة"}
            <Stack />
          </button>
        </Modal>
      )}
      {modal === "batch" && (
        <Modal
          title={`تم إنشاء ${batch.length} كرت`}
          onClose={() => setModal(null)}
          wide
        >
          <p>
            حُفظت المجموعة في المحفوظة. اطبع الورقة، أو افتح كل كرت لتنزيله
            منفردًا.
          </p>
          <button className="primary" onClick={() => window.print()}>
            <Printer />
            طباعة المجموعة
          </button>
          <div className="batch-grid print-batch">
            {batch.map((x) => (
              <div key={x.id}>
                <strong>إلى {x.card.to}</strong>
                <img src={x.qr} alt={`رمز كرت ${x.card.to}`} />
                <span>امسح لفتح هديتك</span>
                <small>{x.card.shop || "باقة"}</small>
              </div>
            ))}
          </div>
        </Modal>
      )}
      {modal?.delete && (
        <Modal
          title={
            commercial
              ? modal.revoked
                ? "إعادة تفعيل الكرت؟"
                : "إيقاف رابط الكرت؟"
              : "حذف الكرت من المحفوظة؟"
          }
          onClose={() => setModal(null)}
        >
          <p>
            {commercial
              ? "يمكنك عكس هذا الإجراء لاحقًا من المحفوظة."
              : "ستُحذف النسخة من هذا الجهاز. الرابط الذي سبق مشاركته سيظل يعمل."}
          </p>
          <button
            className="primary"
            onClick={async () => {
              if (commercial) {
                try {
                  await api("/cards/" + modal.delete, {
                    method: "PATCH",
                    body: JSON.stringify({ revoked: !modal.revoked }),
                  });
                  await refresh();
                  setModal(null);
                  notify("تم تحديث حالة الكرت");
                } catch (e) {
                  notify(e.message);
                }
                return;
              }
              const next = saved.filter((x) => x.id !== modal.delete);
              if (write("baaqa.studio.cards", next)) {
                setSaved(next);
                setModal(null);
                notify("تم حذف النسخة المحفوظة");
              } else notify("تعذّر الحذف من مساحة التخزين");
            }}
          >
            {commercial ? "تأكيد التغيير" : "حذف الكرت"}
          </button>
        </Modal>
      )}
    </ToastContext.Provider>
  );
}
function ServerGift() {
  const [c, setC] = useState(null);
  const [e, setE] = useState("");
  useEffect(() => {
    api("/gifts/" + encodeURIComponent(q.get("g")))
      .then((x) => setC(x.card))
      .catch((x) => setE(x.message));
  }, []);
  return c ? (
    <Recipient card={c} />
  ) : (
    <main className="invalid">
      <Gift size={42} />
      <h1>{e || "جارٍ فتح هديتك…"}</h1>
      {e && <p>تحقق من الرابط أو تواصل مع المحل.</p>}
    </main>
  );
}
let content;
if (q.has("g")) {
  content = <ServerGift />;
} else if (q.has("gift")) {
  try {
    content = <Recipient card={decodeCard(q.get("gift"))} />;
  } catch {
    content = (
      <main className="invalid">
        <WarningCircle size={50} />
        <h1>لم نتمكن من فتح الهدية.</h1>
        <p>قد يكون الرابط غير مكتمل. اطلب من المرسل مشاركته مجددًا.</p>
        <a className="primary" href={currentBase()}>
          العودة إلى باقة
        </a>
      </main>
    );
  }
} else
  content = (
    <CommerceGate>
      <App />
    </CommerceGate>
  );
if (!legacy) createRoot(document.getElementById("root")).render(content);
