export const DEFAULT_LANG = "en";
export const LANGS = ["en", "zh"];

export const dict = {
  en: {
    htmlLang: "en",
    navMenu: "Our Menu",
    navPlans: "Meal Plans",
    navHow: "How it works",
    navFaq: "FAQ",
    orderNow: "Order Now",
    opening: "Opening…",
    hero: [
      { src: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=2000&q=80", kicker: "Hong Kong meal plans", title: "Fresh. Focused. Delivered." },
      { src: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=2000&q=80", kicker: "High protein", title: "Built for the week you train." },
      { src: "https://images.unsplash.com/photo-1532550907401-a532c00947da?auto=format&fit=crop&w=2000&q=80", kicker: "Ready in 3 minutes", title: "Macros on every lid." },
    ],
    featuresTitle: "Meal plan features",
    features: [
      { icon: "01", title: "Order by Saturday 9am", copy: "Lock next week’s boxes before the kitchen runs." },
      { icon: "02", title: "Chef-made recipes", copy: "Protein-first plates, cooked for delivery — not leftover takeout." },
      { icon: "03", title: "HK morning drop", copy: "Island, Kowloon, and selected NT. Heat when you get in." },
      { icon: "04", title: "Ready to eat · full macros", copy: "Calories, protein, carbs, fat printed on the lid." },
    ],
    lede: "LeanBox is a high-protein meal plan for Hong Kong training weeks. Cut, perform, or stay balanced — heat in three minutes, macros on the lid.",
    hashtags: "#EATWELL #TRAINREADY",
    mealsTitle: "Check out our meals",
    plansTitle: "Featured meal plans",
    packMacros: "12-meal mixed rotation",
    ambassadorsTitle: "Ambassadors",
    ambassadors: [
      { name: "LUM", quote: "Portions are right for a cut that still lets me train hard. I stop guessing dinner." },
      { name: "HEI", quote: "Convenience is the whole point. Macros are done. I just heat and get to the gym." },
      { name: "VANESSA", quote: "Flavour without the usual delivery grease. I stay on plan during long office weeks." },
    ],
    apartTitle: "What sets us apart",
    apartCopy:
      "We believe in healthy, convenient, and smart food for people who actually train. LeanBox sources clean protein and vegetables, portions them for cut or performance, and delivers so you can eat well at home or the office.",
    startPack: "Start with the 12-meal pack",
    howTitle: "How it works",
    how: [
      { icon: "01", title: "Pick a plan", copy: "Single boxes or the athlete pack. Macros printed on every lid." },
      { icon: "02", title: "Pay on Stripe", copy: "Secure checkout in HKD. Live keys can be added when you are ready." },
      { icon: "03", title: "Heat and eat", copy: "Peel the corner. Microwave two to three minutes. Train the same evening." },
    ],
    faqTitle: "Meal plan FAQ",
    faq: [
      ["Where do you deliver?", "Hong Kong Island, Kowloon, and selected New Territories. Write hello@leanbox.hk for the weekly zone list."],
      ["How do I heat a box?", "Peel a corner of the lid and microwave 2–3 minutes. Macros stay printed on top."],
      ["When is order cut-off?", "Order by Saturday 9am for the following training week."],
      ["Allergens?", "Weekly menu and allergen sheet by email. This store charges through Stripe Checkout."],
    ],
    footTag: "High-protein prepared meals for Hong Kong.",
    footOffer: "Our offerings",
    footHelp: "Need help?",
    footContact: "Get in touch",
    footHk: "Hong Kong",
    successEyebrow: "Checkout",
    successTitle: "Paid.",
    successCopy: "Stripe confirmed the order. We will email the delivery window.",
    successBack: "Back to LeanBox →",
    cancelEyebrow: "Checkout",
    cancelTitle: "Nothing charged.",
    cancelCopy: "Checkout was cancelled. The box is still here when you want it.",
    cancelBack: "Back to menu →",
    authLogin: "Login",
    authLogout: "Sign out",
    authSignupTitle: "Create account",
    authLoginTitle: "Login",
    authLead: "Save your meal plan and check out faster.",
    authEmail: "Email",
    authPassword: "Password",
    authCreate: "Create account",
    authMagic: "Email me a login link",
    authCheckEmail: "Check your email to continue.",
    authNeedEmail: "Enter your email first.",
    authFailed: "Could not sign in.",
    authMissing: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to finish connecting Supabase.",
    authHaveAccount: "Already have an account?",
    authNoAccount: "New here?",
    authBack: "Back to LeanBox",
    products: {
      "cut-chicken": {
        name: "Cut Box — Chicken",
        short: "Cut · Chicken",
        tag: "Fat loss",
        desc: "Grilled chicken, jasmine rice, broccoli. Built for a deficit without feeling empty.",
      },
      "cut-salmon": {
        name: "Cut Box — Salmon",
        short: "Cut · Salmon",
        tag: "Fat loss",
        desc: "Oven salmon, quinoa, greens. Omega-3 forward, still lean.",
      },
      "perform-beef": {
        name: "Perform Box — Beef",
        short: "Perform · Beef",
        tag: "Training",
        desc: "Lean beef, roasted potato, veg. For heavy squat and Hyrox days.",
      },
      "perform-turkey": {
        name: "Perform Box — Turkey",
        short: "Perform · Turkey",
        tag: "Training",
        desc: "Turkey mince, rice, mixed veg. High protein, easy on the gut.",
      },
      "balance-tofu": {
        name: "Balance Box — Tofu",
        short: "Balance · Tofu",
        tag: "Everyday",
        desc: "Firm tofu, brown rice, sesame greens. Plant-forward weekday default.",
      },
      "pack-12": {
        name: "Athlete Pack — 12 meals",
        short: "Athlete Pack",
        tag: "Best value",
        desc: "12 mixed boxes. Cut + Perform rotation. HK delivery included in-zone.",
      },
    },
  },
  zh: {
    htmlLang: "zh-Hant",
    navMenu: "餐單",
    navPlans: "餐單計劃",
    navHow: "如何運作",
    navFaq: "常見問題",
    orderNow: "立即訂購",
    opening: "處理中…",
    hero: [
      { src: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=2000&q=80", kicker: "香港健康餐計劃", title: "新鮮。專注。送到。" },
      { src: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=2000&q=80", kicker: "高蛋白", title: "為你真正訓練的一週而設。" },
      { src: "https://images.unsplash.com/photo-1532550907401-a532c00947da?auto=format&fit=crop&w=2000&q=80", kicker: "三分鐘即食", title: "每盒蓋上列明營養素。" },
    ],
    featuresTitle: "餐單計劃特色",
    features: [
      { icon: "01", title: "星期六上午9時前落單", copy: "廚房開爐前鎖定下週餐盒。" },
      { icon: "02", title: "主廚研發食譜", copy: "以蛋白質為先，專為外送烹調，不是剩餘外賣。" },
      { icon: "03", title: "香港早上配送", copy: "港島、九龍及部分新界。回家即可加熱。" },
      { icon: "04", title: "即食 · 完整營養標示", copy: "卡路里、蛋白質、碳水化合物、脂肪印在盒蓋。" },
    ],
    lede: "LeanBox 是專為香港訓練週而設的高蛋白餐計劃。減脂、增肌或日常均衡——加熱三分鐘，營養素印在盒蓋。",
    hashtags: "#好好吃 #練好再食",
    mealsTitle: "看看我們的餐盒",
    plansTitle: "精選餐單計劃",
    packMacros: "12 餐混合循環",
    ambassadorsTitle: "品牌大使",
    ambassadors: [
      { name: "LUM", quote: "份量剛好讓我減脂，同時仍然可以認真訓練。不用再猜晚餐吃什麼。" },
      { name: "HEI", quote: "方便才是重點。營養素已算好，我只需加熱然後去gym。" },
      { name: "VANESSA", quote: "有味道，又沒有一般外賣的油膩。長辦公室週都能跟計劃。" },
    ],
    apartTitle: "我們有何不同",
    apartCopy:
      "我們相信健康、方便、聰明的食物，是給真正有訓練的人。LeanBox 嚴選蛋白質與蔬菜，按減脂或表現目標分裝，送到你家或公司，讓你吃得更好。",
    startPack: "由 12 餐套裝開始",
    howTitle: "如何運作",
    how: [
      { icon: "01", title: "選擇計劃", copy: "單盒或運動員套餐。每盒蓋上列明營養素。" },
      { icon: "02", title: "以 Stripe 付款", copy: "以港幣安全結帳。正式金鑰可稍後加入。" },
      { icon: "03", title: "加熱即食", copy: "揭開一角，微波兩至三分鐘。當晚即可訓練。" },
    ],
    faqTitle: "餐單計劃常見問題",
    faq: [
      ["送到哪些地區？", "港島、九龍及部分新界。每週配送範圍可電郵 hello@leanbox.hk 查詢。"],
      ["怎樣加熱？", "揭開盒蓋一角，微波 2–3 分鐘。營養標示仍印在蓋上。"],
      ["截單時間？", "星期六上午 9 時前落單，即可安排下一個訓練週。"],
      ["過敏原？", "每週餐單及過敏原資料以電郵提供。本店透過 Stripe Checkout 收款。"],
    ],
    footTag: "為香港而設的高蛋白即食餐。",
    footOffer: "我們的服務",
    footHelp: "需要協助？",
    footContact: "聯絡我們",
    footHk: "香港",
    successEyebrow: "結帳",
    successTitle: "已付款。",
    successCopy: "Stripe 已確認訂單。我們會電郵通知配送時段。",
    successBack: "返回 LeanBox →",
    cancelEyebrow: "結帳",
    cancelTitle: "未有收費。",
    cancelCopy: "已取消結帳。你隨時可以回來訂購。",
    cancelBack: "返回餐單 →",
    authLogin: "登入",
    authLogout: "登出",
    authSignupTitle: "建立帳戶",
    authLoginTitle: "登入",
    authLead: "儲存你的餐單計劃，結帳更快。",
    authEmail: "電郵",
    authPassword: "密碼",
    authCreate: "建立帳戶",
    authMagic: "以電郵連結登入",
    authCheckEmail: "請查看電郵以繼續。",
    authNeedEmail: "請先輸入電郵。",
    authFailed: "未能登入。",
    authMissing: "請加入 NEXT_PUBLIC_SUPABASE_URL 及 NEXT_PUBLIC_SUPABASE_ANON_KEY 以完成連接 Supabase。",
    authHaveAccount: "已有帳戶？",
    authNoAccount: "第一次使用？",
    authBack: "返回 LeanBox",
    products: {
      "cut-chicken": {
        name: "減脂餐盒 — 雞肉",
        short: "減脂 · 雞肉",
        tag: "減脂",
        desc: "烤雞、茉莉香米、西蘭花。為赤字熱量而設，不會吃不飽。",
      },
      "cut-salmon": {
        name: "減脂餐盒 — 三文魚",
        short: "減脂 · 三文魚",
        tag: "減脂",
        desc: "焗三文魚、藜麥、蔬菜。Omega-3 充足，仍然精瘦。",
      },
      "perform-beef": {
        name: "訓練餐盒 — 牛肉",
        short: "訓練 · 牛肉",
        tag: "訓練",
        desc: "瘦牛肉、烤薯、蔬菜。適合深蹲與 Hyrox 日。",
      },
      "perform-turkey": {
        name: "訓練餐盒 — 火雞肉",
        short: "訓練 · 火雞肉",
        tag: "訓練",
        desc: "火雞肉碎、米飯、什菜。高蛋白，腸胃輕負擔。",
      },
      "balance-tofu": {
        name: "均衡餐盒 — 豆腐",
        short: "均衡 · 豆腐",
        tag: "日常",
        desc: "板豆腐、糙米、芝麻蔬菜。植物蛋白為主的平日選擇。",
      },
      "pack-12": {
        name: "運動員套餐 — 12 餐",
        short: "運動員套餐",
        tag: "最超值",
        desc: "12 盒混合餐。減脂 + 訓練循環。指定範圍包香港送貨。",
      },
    },
  },
};

export function normalizeLang(value) {
  const raw = String(value || "").toLowerCase();
  if (raw.startsWith("zh")) return "zh";
  if (raw.startsWith("en")) return "en";
  return DEFAULT_LANG;
}

export function readLang() {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (fromUrl) return normalizeLang(fromUrl);
  try {
    const stored = window.localStorage.getItem("leanbox-lang");
    if (stored) return normalizeLang(stored);
  } catch {}
  return DEFAULT_LANG;
}

export function writeLang(lang) {
  const next = normalizeLang(lang);
  try {
    window.localStorage.setItem("leanbox-lang", next);
  } catch {}
  const url = new URL(window.location.href);
  if (next === DEFAULT_LANG) url.searchParams.delete("lang");
  else url.searchParams.set("lang", "zh");
  window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  document.documentElement.lang = dict[next].htmlLang;
  document.documentElement.dataset.lang = next;
  return next;
}

export function t(lang) {
  return dict[normalizeLang(lang)] || dict.en;
}

export function localizeProduct(product, lang) {
  const copy = t(lang).products[product.id] || {};
  return { ...product, ...copy };
}
