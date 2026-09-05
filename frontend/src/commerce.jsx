import React, { useState, useEffect } from "react";
import {
  FlowerLotus,
  Storefront,
  SignOut,
  Plus,
  Check,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Ticket,
  WarningCircle,
} from "@phosphor-icons/react";
export const commercial = import.meta.env.VITE_COMMERCIAL === "true";
export let account = null;
export async function api(path, options = {}) {
  const r = await fetch("/api" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "same-origin",
  });
  let data;
  try {
    data = await r.json();
  } catch {
    throw Error("تعذّر الاتصال بالخادم. حاول مجددًا.");
  }
  if (!r.ok) throw Error(data.error || "تعذّر تنفيذ الطلب");
  return data;
}
export function AccountControl() {
  return commercial ? (
    <button
      className="help-top"
      onClick={async () => {
        try {
          await api("/logout", { method: "POST" });
          location.href = location.pathname;
        } catch {
          location.reload();
        }
      }}
    >
      <SignOut size={18} />
      خروج
    </button>
  ) : (
    <span className="demo-label">نسخة العرض للمحلات</span>
  );
}
export function CommerceGate({ children }) {
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState(null);
  async function load() {
    setError("");
    try {
      const data = await api("/me");
      account = data;
      setMe(data);
      setState(data.role);
    } catch (e) {
      if (
        e.message === "سجّل الدخول للمتابعة" ||
        e.message === "اشتراك المحل غير نشط"
      )
        setState("login");
      else {
        setError(e.message);
        setState("error");
      }
    }
  }
  useEffect(() => {
    if (commercial) load();
  }, []);
  if (!commercial) return children;
  if (state === "loading")
    return (
      <main className="invalid">
        <FlowerLotus size={40} />
        <p role="status">جارٍ فتح مساحة المحل…</p>
      </main>
    );
  if (state === "error")
    return (
      <main className="invalid">
        <WarningCircle size={40} />
        <h1>المساحة غير متاحة الآن</h1>
        <p>{error}</p>
        <button className="primary" onClick={load}>
          إعادة المحاولة
        </button>
      </main>
    );
  if (state === "admin") return <OwnerPanel />;
  if (state === "shop") return children;
  if (state === "login")
    return (
      <main className="login-page">
        <section className="login-story">
          <a className="brand" href="./">
            <FlowerLotus weight="thin" size={45} />
            <span>
              باقة<small>BAAQA FOR BUSINESS</small>
            </span>
          </a>
          <div>
            <span className="eyebrow">للمحلات التي تهتم بالتفاصيل</span>
            <h1>
              كل هدية تخرج من محلك،
              <br />
              <em>تحمل حكاية.</em>
            </h1>
            <p>
              مساحة خاصة بك لإنشاء كروت رقمية تليق بهداياك، وإدارة رسائلك
              وطباعتها في دقائق.
            </p>
            <div className="login-points">
              <span>
                <Storefront />
                هوية محلك على كل كرت
              </span>
              <span>
                <Ticket />
                باركود ثابت ورسالة قابلة للتعديل
              </span>
              <span>
                <ShieldCheck />
                مساحة مستقلة لبياناتك
              </span>
            </div>
          </div>
          <small>باقة · تجربة إهداء متكاملة</small>
        </section>
        <section className="login-form">
          <div>
            <span className="eyebrow">أهلًا بعودتك</span>
            <h2>افتح مساحة محلك.</h2>
            <p>أدخل بيانات الحساب التي وصلتك عند تفعيل الاشتراك.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                const f = new FormData(e.currentTarget);
                try {
                  await api("/login", {
                    method: "POST",
                    body: JSON.stringify({
                      username: f.get("username"),
                      password: f.get("password"),
                    }),
                  });
                  await load();
                } catch (e) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                اسم المستخدم
                <input
                  name="username"
                  required
                  autoComplete="username"
                  dir="ltr"
                />
              </label>
              <label>
                كلمة المرور
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  dir="ltr"
                />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="primary block" disabled={busy}>
                {busy ? "جارٍ الدخول…" : "الدخول إلى الاستوديو"}
                <ArrowLeft />
              </button>
            </form>
            <p className="hint">
              للاشتراك أو استعادة الوصول، تواصل مع مزوّد باقة الذي زوّدك
              بالحساب.
            </p>
          </div>
        </section>
      </main>
    );
}
function OwnerPanel() {
  const [shops, setShops] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  async function load() {
    try {
      setShops(await api("/admin/shops"));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  return (
    <div className="owner-page">
      <header>
        <a className="brand" href="./">
          <FlowerLotus size={35} />
          <span>
            باقة<small>OWNER CONSOLE</small>
          </span>
        </a>
        <AccountControl />
      </header>
      <main>
        <div className="page-heading">
          <div>
            <span className="eyebrow">لوحة المالك</span>
            <h1>محلاتك، في مكان واحد.</h1>
            <p>
              فعّل حسابًا عند إتمام البيع، وحدد مدة الاشتراك وحصته من الكروت.
            </p>
          </div>
          <button
            className="primary"
            onClick={() => {
              setCreating(!creating);
              setEditing(null);
              setError("");
            }}
          >
            <Plus />
            إضافة محل
          </button>
        </div>
        <div className="owner-stats">
          <div>
            <Storefront />
            <strong>{shops.length}</strong>
            <span>إجمالي المحلات</span>
          </div>
          <div>
            <Check />
            <strong>
              {
                shops.filter(
                  (s) => s.active && new Date(s.expires) > new Date(),
                ).length
              }
            </strong>
            <span>اشتراكات نشطة</span>
          </div>
          <div>
            <Ticket />
            <strong>{shops.reduce((n, s) => n + s.used, 0)}</strong>
            <span>كروت أُنشئت</span>
          </div>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="info-note" role="status">
            {notice}
          </p>
        )}
        {(creating || editing) && (
          <form
            key={editing?.id || "new"}
            className="owner-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const f = new FormData(e.currentTarget);
              const values = {
                expires: new Date(f.get("expires") + "T23:59:59").toISOString(),
                quota: Number(f.get("quota")),
              };
              if (!editing)
                Object.assign(values, {
                  name: f.get("name"),
                  username: f.get("username"),
                  password: f.get("password"),
                });
              try {
                await api("/admin/shops" + (editing ? "/" + editing.id : ""), {
                  method: editing ? "PATCH" : "POST",
                  body: JSON.stringify(values),
                });
                if (editing && f.get("password"))
                  await api("/admin/shops/" + editing.id + "/password", {
                    method: "POST",
                    body: JSON.stringify({ password: f.get("password") }),
                  });
                setNotice(
                  editing
                    ? "تم تحديث الاشتراك"
                    : "تم إنشاء المحل. سلّم بيانات الدخول للمحل عبر قناة خاصة.",
                );
                setCreating(false);
                setEditing(null);
                await load();
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <h2>
              {editing ? `تعديل اشتراك ${editing.name}` : "تفعيل محل جديد"}
            </h2>
            <div className="owner-fields">
              {!editing && (
                <>
                  <label>
                    اسم المحل
                    <input name="name" required maxLength={60} />
                  </label>
                  <label>
                    اسم المستخدم
                    <input
                      name="username"
                      required
                      pattern="[A-Za-z0-9_][A-Za-z0-9_.-]{2,49}"
                      dir="ltr"
                      autoComplete="off"
                    />
                  </label>
                  <label>
                    كلمة المرور الأولية
                    <input
                      name="password"
                      type="password"
                      required
                      minLength={12}
                      maxLength={200}
                      autoComplete="new-password"
                      dir="ltr"
                    />
                  </label>
                </>
              )}
              {editing && (
                <label>
                  كلمة مرور بديلة (اختياري)
                  <input
                    name="password"
                    type="password"
                    minLength={12}
                    maxLength={200}
                    autoComplete="new-password"
                    dir="ltr"
                  />
                </label>
              )}
              <label>
                نهاية الاشتراك
                <input
                  name="expires"
                  type="date"
                  required
                  defaultValue={
                    editing?.expires.slice(0, 10) ||
                    new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
                  }
                />
              </label>
              <label>
                إجمالي حصة الكروت
                <input
                  name="quota"
                  type="number"
                  min="1"
                  max="100000"
                  required
                  defaultValue={editing?.quota || 500}
                />
              </label>
            </div>
            <p className="hint">
              الحصة إجمالية طوال الاشتراك، وليست عدّادًا شهريًا. زدها عند
              التجديد حسب الباقة المتفق عليها.
            </p>
            <button className="primary" disabled={busy}>
              {busy ? "جارٍ الحفظ…" : "حفظ وتفعيل"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setEditing(null);
                setCreating(false);
              }}
            >
              إلغاء
            </button>
          </form>
        )}
        <div className="shop-list">
          {shops.map((s) => (
            <article key={s.id}>
              <span className="shop-avatar">
                <Storefront />
              </span>
              <div>
                <h2>{s.name}</h2>
                <small dir="ltr">{s.username}</small>
              </div>
              <div>
                <span
                  className={`status-badge ${s.active && new Date(s.expires) > new Date() ? "enabled" : ""}`}
                >
                  {s.active
                    ? new Date(s.expires) > new Date()
                      ? "نشط"
                      : "منتهي"
                    : "موقوف"}
                </span>
              </div>
              <div>
                <strong>
                  {s.used} / {s.quota}
                </strong>
                <small>كرت مستخدم</small>
              </div>
              <div>
                <strong>
                  {new Date(s.expires).toLocaleDateString("ar-SA")}
                </strong>
                <small>نهاية الاشتراك</small>
              </div>
              <button
                className="secondary"
                onClick={() => {
                  setEditing(s);
                  setCreating(false);
                }}
              >
                تجديد / تعديل
              </button>
              <button
                className="text-link"
                onClick={async () => {
                  try {
                    await api("/admin/shops/" + s.id, {
                      method: "PATCH",
                      body: JSON.stringify({ active: s.active ? 0 : 1 }),
                    });
                    await load();
                    setNotice(
                      s.active
                        ? "تم إيقاف دخول المحل. كروت العملاء مستمرة."
                        : "تم تفعيل دخول المحل.",
                    );
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                {s.active ? "إيقاف الدخول" : "تفعيل الدخول"}
              </button>
            </article>
          ))}
          {!shops.length && (
            <div className="empty">
              <Storefront size={48} />
              <h2>أضف أول محل لبدء البيع.</h2>
              <p>
                لا يتم تحصيل أي مبلغ من هذه اللوحة. فعّل الحساب بعد تأكيد الدفع
                مع المحل.
              </p>
            </div>
          )}
        </div>
        <p className="hint">
          انتهاء الاشتراك أو إيقاف دخول المحل لا يُعطّل كروت عملائه المطبوعة.
          يحتاج تشغيلها المستمر إلى بقاء الاستضافة.
        </p>
      </main>
    </div>
  );
}
