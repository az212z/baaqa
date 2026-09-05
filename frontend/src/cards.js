import LZString from "lz-string";
export const occasions = [
  [
    "love",
    "بكل حب",
    "بعض الهدايا تُشبه أصحابها، جميلة وقريبة من القلب. هذه لك، بكل الحب.",
  ],
  [
    "birthday",
    "عيد ميلاد",
    "كل عام وأنت بخير، وكل لحظة حلوة تكون من نصيبك. أتمنى لك عامًا يشبه جمال قلبك.",
  ],
  [
    "wedding",
    "زواج مبارك",
    "بارك الله لكما وبارك عليكما وجمع بينكما في خير. أيامكما حب وسعادة.",
  ],
  [
    "graduation",
    "تخرج",
    "لكل تعب فرحة تستاهله، واليوم فرحتك. ألف مبروك التخرج، والقادم أجمل.",
  ],
  [
    "thanks",
    "شكرًا لك",
    "شكرًا لأنك تجعل الأشياء العادية أجمل. وجودك يستحق كل هذا الامتنان.",
  ],
  [
    "baby",
    "مولود جديد",
    "أهلًا بالفرحة الجديدة. جعله الله من مواليد السعادة وقرة عين لوالديه.",
  ],
  ["eid", "عيد مبارك", "كل عام وأنت ومن تحب بخير. عيدك فرح وقلبك سعيد."],
  [
    "well",
    "سلامتك",
    "سلامتك يا أغلى الناس. أسأل الله أن يلبسك ثوب الصحة والعافية.",
  ],
  [
    "other",
    "بدون مناسبة",
    "لا نحتاج إلى مناسبة لنقول لمن نحب: أنتم أجمل ما في أيامنا.",
  ],
];
export const themes = [
  {
    id: "rose",
    name: "ورد وودّ",
    tag: "رومانسي",
    bg: "#faeff1",
    ink: "#963c5c",
    paper: "#fffafa",
  },
  {
    id: "sage",
    name: "غصن وورق",
    tag: "طبيعي",
    bg: "#eaf0e9",
    ink: "#3c6456",
    paper: "#fafcf9",
  },
  {
    id: "night",
    name: "ليل ونجوم",
    tag: "احتفالي",
    bg: "#e8e9f1",
    ink: "#3c436c",
    paper: "#f9f9fe",
  },
  {
    id: "sand",
    name: "أثر وامتنان",
    tag: "كلاسيكي",
    bg: "#f4eee5",
    ink: "#806048",
    paper: "#fffdf7",
  },
  {
    id: "lilac",
    name: "حلم بنفسجي",
    tag: "ناعم",
    bg: "#eee9f5",
    ink: "#765591",
    paper: "#fdfaff",
  },
  {
    id: "mono",
    name: "حبر وورق",
    tag: "بسيط",
    bg: "#ececec",
    ink: "#353535",
    paper: "#fff",
  },
];
export const initialCard = {
  version: 1,
  to: "",
  from: "",
  message: "",
  occasion: "love",
  theme: "rose",
  font: "amiri",
  shop: "",
  sound: false,
  opening: "envelope",
  youtube: "",
};
export function cleanCard(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("بيانات الكرت غير صالحة");
  const c = { ...initialCard };
  for (const [key, max] of [
    ["to", 60],
    ["from", 60],
    ["shop", 60],
    ["message", 400],
    ["youtube", 200],
  ]) {
    if (value[key] !== undefined && typeof value[key] !== "string")
      throw new Error("بيانات الكرت غير صالحة");
    c[key] = (value[key] || "").slice(0, max);
  }
  c.occasion = occasions.some((o) => o[0] === value.occasion)
    ? value.occasion
    : "love";
  c.theme = themes.some((t) => t.id === value.theme) ? value.theme : "rose";
  c.font = value.font === "sans" ? "sans" : "amiri";
  c.opening = value.opening === "direct" ? "direct" : "envelope";
  c.sound = value.sound === true;
  if (c.youtube && !youtubeId(c.youtube))
    throw new Error("أضف رابط يوتيوب صالحًا أو اترك الحقل فارغًا");
  return c;
}
export function youtubeId(input) {
  try {
    const u = new URL(input);
    if (u.protocol !== "https:") return null;
    let id;
    if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(u.hostname)
    )
      id =
        u.searchParams.get("v") ||
        u.pathname.match(/^\/(?:shorts|embed)\/([\w-]+)/)?.[1];
    else if (u.hostname === "youtu.be") id = u.pathname.slice(1);
    return /^[\w-]{11}$/.test(id || "") ? id : null;
  } catch {
    return null;
  }
}
export function encodeCard(card, base) {
  const url = new URL(base);
  url.search = "";
  url.hash = "";
  url.searchParams.set(
    "gift",
    LZString.compressToEncodedURIComponent(JSON.stringify(cleanCard(card))),
  );
  return url.href;
}
export function decodeCard(payload) {
  if (!payload || payload.length > 7000) throw new Error("رابط الكرت غير صالح");
  const raw = LZString.decompressFromEncodedURIComponent(payload);
  if (!raw || raw.length > 5000) throw new Error("رابط الكرت غير صالح");
  return cleanCard(JSON.parse(raw));
}
export function validateCard(c) {
  if (!c.to.trim()) return "اكتب اسم المستلم أولًا";
  if (!c.message.trim()) return "اكتب رسالتك أو اختر رسالة مقترحة";
  if (c.youtube && !youtubeId(c.youtube)) return "رابط يوتيوب غير صالح";
  return "";
}
