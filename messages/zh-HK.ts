// 香港繁體中文（預設語言）
// Lists are stored as objects keyed "1", "2", … (next-intl's typed keys don't support arrays);
// read them with listOf(t.raw("…")) from lib/i18n-shared.ts.
const zhHK = {
  meta: {
    title: "LeanBox｜健身人士嘅高蛋白午餐同晚餐",
    description: "為有訓練習慣嘅上班族而設嘅高蛋白午餐同練後晚餐。每餐標明卡路里同三大營養素，三分鐘加熱即食，每週送遞全港。"
  },
  common: {
    brand: "LeanBox",
    tagline: "吃得健康，活得健康",
    taglineAlt: "Eat Healthy, Live Healthy",
    loading: "載入中…",
    save: "儲存",
    saving: "儲存中…",
    saved: "已儲存",
    cancel: "取消",
    back: "返回",
    close: "關閉",
    continue: "繼續",
    optional: "選填",
    kcal: "千卡",
    protein: "蛋白質",
    carbs: "碳水",
    fat: "脂肪",
    perMeal: "每餐",
    perWeek: "每週",
    meals: "{count} 餐",
    subtotal: "小計",
    delivery: "運費",
    discount: "折扣",
    total: "總額",
    free: "免費",
    soldOut: "本週已滿",
    lowStock: "本週餘 {count} 份",
    addToBox: "加入餐盒",
    added: "已加入",
    viewDetails: "查看詳情",
    language: "語言",
    switchTo: "English",
    demoMode: "示範模式：未連接 Supabase，餐單顯示範例資料。",
    demoModeCta: "設定指引",
    skipToContent: "跳至主要內容",
    error: "發生錯誤，請再試一次。"
  },
  nav: {
    menu: "本週餐單",
    plans: "計劃",
    about: "關於我們",
    howItWorks: "運作方式",
    login: "登入",
    startPlan: "開始計劃",
    account: "我的帳戶",
    orders: "訂單",
    myPlan: "餐單",
    logout: "登出",
    admin: "管理後台",
    cart: "餐盒",
    openMenu: "開啟選單",
    closeMenu: "關閉選單",
    accountMenu: "帳戶選單"
  },
  home: {
    hero: {
      eyebrow: "午餐 · 練後晚餐 · 香港每週送遞",
      title1: "練得辛苦，",
      title2: "食都要認真。",
      lede: "唔使換成個餐單，只需要搞掂最難搞嗰一餐。LeanBox 係你訓練日嘅高蛋白午餐或練後晚餐：營養標示清楚，微波三分鐘就食得。",
      ctaPrimary: "由午餐開始",
      ctaSecondary: "睇吓三款主打",
      stat1: "3 分鐘",
      stat1Label: "加熱即食",
      stat2: "{protein}g",
      stat2Label: "每餐平均蛋白質",
      stat3: "每週",
      stat3Label: "新鮮送遞",
      cardLabel: "午餐之選",
      scroll: "向下捲動"
    },
    brand: {
      label: "BRAND · 品牌",
      statement: "健身人士嘅日常飯堂。",
      highlight: "日常飯堂",
      body: "唔係成日嘅餐單，而係你每日最需要靠得住嗰一餐。卡路里、蛋白質、碳水同脂肪逐餐標明，練完唔使再估。"
    },
    launch: {
      label: "LAUNCH · 開賣",
      title1: "2026年10月26日",
      title2: "正式開賣",
      days: "日",
      hours: "時",
      minutes: "分",
      seconds: "秒"
    },
    marquee: {
      "1": "高蛋白午餐",
      "2": "練後晚餐",
      "3": "營養標示清楚",
      "4": "三分鐘加熱",
      "5": "每週新鮮製作",
      "6": "全港送遞"
    },
    how: {
      eyebrow: "No. 01 — 運作方式",
      title: "三步，搞掂訓練日嗰一餐",
      steps: {
        "1": {
          title: "揀餐",
          body: "三款高蛋白主打，按蛋白質、熱量同口味揀；或者訂每週計劃，午餐、晚餐定兩餐都得。"
        },
        "2": {
          title: "主廚新鮮製作",
          body: "星期日截單後，廚房按訂單份量烹調、急凍保鮮，不做多餘庫存。"
        },
        "3": {
          title: "送到公司或屋企，三分鐘加熱",
          body: "按你揀嘅週次送到公司或屋企。午餐放公司雪櫃，晚餐練完返屋企，微波三分鐘即食。"
        }
      }
    },
    featured: {
      eyebrow: "No. 02 — 三款主打",
      title: "三款，都計好晒數",
      cta: "睇營養詳情"
    },
    numbers: {
      eyebrow: "No. 03 — 數字說話",
      title: "每一餐，都寫得清清楚楚",
      lede: "熱量同三大營養素逐餐標示，一日其餘幾餐點樣食，你心裏有數。",
      items: {
        "1": {
          value: "{protein}",
          unit: "g",
          label: "平均蛋白質／餐"
        },
        "2": {
          value: "{kcal}",
          unit: "kcal",
          label: "平均熱量／餐"
        },
        "3": {
          value: "3",
          unit: "min",
          label: "加熱時間"
        },
        "4": {
          value: "{count}",
          unit: "",
          label: "款主打菜式"
        }
      }
    },
    plans: {
      eyebrow: "No. 04 — 每週計劃",
      title: "午餐、晚餐，定兩餐都交畀我哋",
      lede: "揀一個配合你訓練節奏嘅計劃，每週自動續期，隨時喺帳戶暫停或取消。",
      cta: "比較所有計劃"
    },
    founder: {
      eyebrow: "No. 05 — 由來",
      title: "由一個在健身室與辦公室之間奔走的人開始",
      body: "LeanBox 的起點很簡單：想在長工時與訓練之間，仍然每餐吃得好。我們把廚房的專業、營養的計算與香港人熟悉的味道放在同一個餐盒裏。",
      signature: "創辦人",
      cta: "我們的故事"
    },
    faq: {
      eyebrow: "No. 06 — 常見問題",
      title: "你可能想知道",
      items: {
        "1": {
          q: "餐盒可以保存多久？",
          a: "冷藏可保存約 5 天，急凍可保存約 30 天。每個餐盒均印有製作及建議食用日期。"
        },
        "2": {
          q: "如何加熱？",
          a: "撕開膠膜一角，以 800W 微波爐加熱約 3 分鐘，靜置 30 秒後即可享用。"
        },
        "3": {
          q: "幾時截單？幾時送遞？",
          a: "每週星期日 23:59 截單，下一週按你選擇的時段送遞。結帳時可選擇本週批次或下週批次。"
        },
        "4": {
          q: "運費如何計算？",
          a: "單次訂單滿 HK$400 免運費，未滿收取 HK$40。每週計劃已包括運費。"
        },
        "5": {
          q: "可以暫停或取消計劃嗎？",
          a: "可以。登入帳戶後於「我的餐單」管理訂閱，改動將於下一個週期生效。"
        },
        "6": {
          q: "一日只食一餐 LeanBox，其他餐點算？",
          a: "LeanBox 專注搞掂你嘅午餐或練後晚餐。每餐都標明卡路里同三大營養素，你可以按自己目標安排其餘幾餐。如有特別飲食需要，請先諮詢營養師或醫生。"
        }
      }
    },
    cta: {
      title: "下星期嘅午餐，今晚揀好。",
      body: "截單前落單，下星期嘅午餐同練後晚餐都有着落。",
      button: "由午餐開始"
    }
  },
  menu: {
    eyebrow: "本週餐單",
    title: "每一餐，都有數得出的營養",
    lede: "所有餐點由主廚每週新鮮製作，熱量與營養素逐一標示。加熱約三分鐘。",
    cutoff: "本週截單：{time}",
    filterAll: "全部",
    sortLabel: "排序",
    sort: {
      recommended: "推薦",
      protein: "蛋白質（高至低）",
      kcal: "熱量（低至高）",
      price: "價錢（低至高）"
    },
    results: "{count} 款餐點",
    empty: "暫時沒有符合條件的餐點。",
    clearFilters: "清除篩選",
    detail: {
      nutrition: "營養（每份）",
      ingredients: "材料",
      allergens: "致敏原",
      allergensNone: "未標示主要致敏原",
      allergensNote: "致敏原資料僅供參考，廚房同時處理多種食材；如有嚴重過敏請先與我們聯絡。",
      heating: "加熱方法",
      heatingSteps: {
        "1": "撕開膠膜一角。",
        "2": "以 800W 微波爐加熱約 3 分鐘（1000W 約 2 分半鐘）。",
        "3": "靜置 30 秒，拌勻即可享用。"
      },
      storage: "冷藏保存約 5 天，急凍約 30 天。",
      quantity: "數量"
    }
  },
  cart: {
    title: "你的餐盒",
    empty: "餐盒仍然是空的。",
    emptyCta: "瀏覽本週餐單",
    checkout: "結帳",
    continueShopping: "繼續選購",
    freeDeliveryHint: "再選 {amount} 即享免運費",
    freeDeliveryReached: "已享免運費",
    remove: "移除",
    decrease: "減少數量",
    increase: "增加數量",
    items: "{count} 餐",
    open: "開啟餐盒",
    syncError: "未能更新餐盒，請再試一次。",
    maxReached: "已達本週可訂上限"
  },
  checkout: {
    eyebrow: "結帳",
    title: "確認送遞與付款",
    loginWall: "請先登入以完成結帳，你的餐盒會自動保留。",
    loginCta: "登入以繼續",
    deliveryTitle: "送遞資料",
    name: "姓名",
    phone: "電話",
    phonePrefix: "+852",
    region: "區域",
    district: "分區",
    selectRegion: "選擇區域",
    selectDistrict: "選擇分區",
    address: "地址",
    addressPlaceholder: "大廈、樓層、單位",
    notes: "送遞備註",
    notesPlaceholder: "例如：放管理處、到達前致電",
    saveDefault: "儲存為預設送遞資料",
    weekTitle: "送遞週次",
    thisBatch: "本週批次",
    nextBatch: "下週批次",
    weekRange: "{range} 送遞",
    cutoff: "本週截單：{time}",
    cutoffIn: "截單時間：{time}",
    summaryTitle: "訂單摘要",
    planSummary: "{name}・每週 {count} 餐",
    planNote: "每週自動續期，可隨時於帳戶內取消。主廚按該週餐單為你配搭。",
    switchToCart: "改為單點餐盒",
    pay: "使用 Stripe 付款",
    paying: "正在前往 Stripe…",
    secure: "付款由 Stripe 加密處理",
    emptyCart: "你的餐盒是空的。",
    browse: "瀏覽本週餐單",
    stripeMissing: "Stripe 尚未設定，暫時未能付款。請參考 README 設定 STRIPE_SECRET_KEY。",
    freeDeliveryNote: "滿 HK$400 免運費",
    codeLabel: "折扣碼",
    codeApply: "套用",
    codeApplied: "已套用折扣碼 {code}",
    codeRemove: "移除",
    codeInvalid: "折扣碼無效或已停用",
    errors: {
      name: "請輸入姓名",
      phone: "請輸入有效的香港電話號碼（8 位數字）",
      district: "請選擇分區",
      address: "請輸入地址",
      week: "所選週次已截單，請重新選擇",
      empty: "餐盒是空的",
      stock: "「{name}」本週只餘 {count} 份，請調整數量",
      inactive: "「{name}」已下架，請從餐盒移除",
      plan: "找不到所選計劃",
      code: "折扣碼已失效，請移除後再試",
      stripe: "未能建立付款，請稍後再試"
    }
  },
  auth: {
    loginEyebrow: "歡迎回來",
    loginTitle: "登入帳戶",
    loginLede: "管理你的餐盒、訂單與每週計劃。",
    signupEyebrow: "加入 LeanBox",
    signupTitle: "建立帳戶",
    signupLede: "一個帳戶，管理每週的好好食飯。",
    email: "電郵",
    password: "密碼",
    confirmPassword: "確認密碼",
    name: "姓名",
    passwordHint: "最少 8 個字元",
    loginWithEmail: "使用 Email 登入",
    signupWithEmail: "使用 Email 建立帳戶",
    appleLogin: "使用 Apple 登入",
    googleLogin: "使用 Google 登入",
    appleContinue: "以 Apple 繼續",
    googleContinue: "以 Google 繼續",
    or: "或",
    forgot: "忘記密碼",
    reset: "重設密碼",
    create: "建立帳戶",
    haveAccount: "已有帳戶？登入",
    noAccount: "未有帳戶？建立帳戶",
    backToLogin: "返回登入",
    checkEmailTitle: "請查收驗證郵件",
    checkEmailBody: "我們已寄出驗證連結至 {email}。點擊郵件中的連結即可啟用帳戶。",
    checkEmailHint: "沒有收到？請檢查垃圾郵件，或重新寄出。",
    resend: "重新寄出驗證郵件",
    resent: "已重新寄出，請查收。",
    forgotTitle: "忘記密碼",
    forgotLede: "輸入註冊電郵，我們會寄出重設密碼連結。",
    forgotSubmit: "寄出重設連結",
    forgotSent: "我們已寄出重設密碼郵件（如該電郵已註冊）",
    forgotSentHint: "連結將於一小時內有效。",
    resetTitle: "重設密碼",
    resetLede: "請設定新密碼。",
    newPassword: "新密碼",
    resetSubmit: "更新密碼",
    linkExpiredTitle: "連結已失效",
    linkExpiredBody: "此重設密碼連結已過期或已被使用。請重新申請一條新的連結。",
    backToForgot: "重新申請重設連結",
    terms: "繼續即表示你同意 LeanBox 的服務條款及私隱政策。",
    submitting: "處理中…",
    errors: {
      invalidCredentials: "電郵或密碼錯誤",
      emailNotConfirmed: "帳號未驗證，請先查收驗證郵件",
      tooManyAttempts: "太多嘗試，請稍後再試",
      passwordMismatch: "兩次輸入的密碼不一致",
      passwordTooShort: "密碼最少 8 個字元",
      weakPassword: "密碼太弱，請加入字母與數字",
      samePassword: "新密碼不可與舊密碼相同",
      invalidEmail: "請輸入有效的電郵地址",
      signupDisabled: "暫停接受新註冊",
      oauthFailed: "第三方登入未能完成，請再試一次",
      callbackFailed: "登入連結無效或已過期，請重新登入",
      generic: "發生錯誤，請再試一次"
    }
  },
  account: {
    eyebrow: "我的帳戶",
    greeting: "你好，{name}",
    greetingFallback: "你好",
    nextDelivery: "下一次送遞",
    nextDeliveryNone: "暫時未有待送訂單。",
    nextDeliveryCta: "瀏覽本週餐單",
    profileTitle: "個人及送遞資料",
    profileLede: "結帳時會自動填入以下資料。",
    fullName: "姓名",
    phone: "電話",
    district: "預設分區",
    address: "預設地址",
    notes: "送遞備註",
    save: "儲存資料",
    saved: "資料已更新",
    emailTitle: "登入電郵",
    emailMissing: "你的帳戶未有電郵地址（Apple 只會在首次授權時提供電郵）。加入電郵以接收訂單通知。",
    emailRelay: "你正使用 Apple 私人轉發電郵，可另外加入常用電郵作聯絡之用。",
    contactEmail: "聯絡電郵",
    addEmail: "更新登入電郵",
    addEmailSent: "已寄出確認郵件至新地址，確認後即會更新。",
    identitiesTitle: "登入方式",
    identitiesLede: "同一電郵的 Google／Apple 登入會自動歸入同一帳戶。",
    linked: "已連結",
    link: "連結",
    linkUnavailable: "未能連結：請確認 Supabase 已啟用「Manual linking」。",
    providers: {
      email: "Email",
      google: "Google",
      apple: "Apple"
    },
    ordersCta: "查看全部訂單",
    recentOrders: "最近訂單",
    signOut: "登出"
  },
  orders: {
    title: "我的訂單",
    empty: "你還未有訂單。",
    successTitle: "付款成功",
    successBody: "付款成功，我們會按你選擇的週次送遞。",
    processing: "付款確認中，稍後會自動更新狀態。",
    order: "訂單",
    week: "送遞週次",
    placed: "下單時間",
    items: "餐點",
    viewOrder: "查看訂單",
    backToOrders: "返回訂單列表",
    deliveryTo: "送遞至",
    timeline: "訂單進度",
    summary: "付款摘要",
    refunded: "已退款 {amount}",
    receiptNote: "Stripe 已寄出電子收據至你的電郵。",
    help: "需要協助？WhatsApp 我們",
    status: {
      pending_payment: "待付款",
      paid: "已付款",
      preparing: "準備中",
      out_for_delivery: "送遞中",
      delivered: "已送達",
      cancelled: "已取消",
      refunded: "已退款"
    },
    kind: {
      one_time: "單點",
      subscription: "每週計劃"
    }
  },
  myPlan: {
    eyebrow: "我的餐單",
    title: "每週計劃",
    none: "你暫時未有訂閱每週計劃。",
    noneCta: "查看計劃",
    status: "狀態",
    renews: "下次續期",
    cancelsOn: "將於 {date} 結束",
    manage: "管理訂閱及付款方式",
    manageHint: "於 Stripe 客戶中心更改付款卡、取消或查看發票。",
    browse: "瀏覽本週餐單",
    statusMap: {
      active: "生效中",
      trialing: "試用中",
      past_due: "逾期未付",
      canceled: "已取消",
      unpaid: "未付款",
      incomplete: "未完成",
      incomplete_expired: "已過期",
      paused: "已暫停"
    }
  },
  plansPage: {
    eyebrow: "每週計劃",
    title: "午餐、晚餐，定兩餐？",
    lede: "按你嘅訓練節奏揀：平日午餐、午餐加練後晚餐，或者訓練期一日兩餐。主廚由三款主打為你配搭，包運費，隨時取消。",
    featured: "最受歡迎",
    perWeek: "／週",
    perMeal: "約 {amount}／餐",
    mealsPerWeek: "每週 {count} 餐",
    choose: "選擇此計劃",
    includes: {
      "1": "主廚由三款主打輪流配搭",
      "2": "每週送遞，已包運費",
      "3": "隨時暫停或取消"
    },
    alaCarte: "想自己揀？",
    alaCarteBody: "單點三款主打，滿 HK$400 免運費。",
    alaCarteCta: "瀏覽單點餐單"
  },
  about: {
    eyebrow: "關於 LeanBox",
    title: "把好好食飯，變成一件簡單的事",
    intro: "我們相信健康飲食不應該是意志力的比賽。LeanBox 由主廚與營養規劃出發，為在香港生活節奏中努力的人，準備每一餐。",
    founderTitle: "創辦人的話",
    founderBody: "「長時間工作、下班趕去訓練，最常犧牲的是晚餐。我想做的，是一個打開雪櫃就有好飯的選擇——份量準確、味道認真，而且不用妥協。」",
    founderName: "LeanBox 創辦人",
    principlesTitle: "我們的原則",
    principles: {
      "1": {
        title: "主廚先行",
        body: "營養數字要準，但首先要好食。每道菜由主廚設計、試味，再由營養規劃調整份量。"
      },
      "2": {
        title: "按單製作",
        body: "每週截單後按實際訂單烹調，減少浪費，亦確保每份餐點新鮮。"
      },
      "3": {
        title: "清楚標示",
        body: "熱量、蛋白質、碳水、脂肪與致敏原逐餐列明，不含糊。"
      }
    },
    kitchenTitle: "廚房",
    kitchenBody: "位於香港的中央廚房，每週按訂單份量製作並急凍保鮮，再以冷鏈送遞。"
  },
  footer: {
    tagline: "主廚每週新鮮製作的營養餐，香港送遞。",
    explore: "探索",
    help: "協助",
    contact: "聯絡",
    whatsapp: "WhatsApp 查詢",
    faq: "常見問題",
    delivery: "送遞安排",
    rights: "© {year} LeanBox. 版權所有。",
    cutoff: "本週截單：{time}"
  },
  setup: {
    title: "完成設定以啟用此頁",
    lede: "此頁需要 Supabase 帳戶系統。請在 .env.local 填入以下環境變數，然後重新啟動 dev server。",
    stripeTitle: "Stripe 尚未設定",
    back: "返回首頁",
    readme: "詳細步驟請參考 README.md。"
  },
  notFound: {
    title: "找不到此頁",
    body: "頁面可能已移除，或連結有誤。",
    cta: "返回首頁"
  }
};

export default zhHK;
export type Messages = typeof zhHK;
