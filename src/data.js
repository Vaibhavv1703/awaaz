export const NAV_LINKS = ["About", "How It Works", "Features", "Impact"];

export const STATS = [
  { value: "1.7B+", label: "People without formal credit" },
  { value: "22+",   label: "Languages spoken in India" },
  { value: "78%",   label: "Loan rejections due to bias" },
  { value: "0",     label: "Voices left unheard with AWAAZ" },
];

export const STEPS = [
  { number: "01", title: "Speak Naturally", desc: "Users speak in any accent, dialect, or language — Hindi, Bengali, Urdu, and more. No typing required.", icon: "🎙️" },
  { number: "02", title: "Voice Fairness Layer", desc: "Our accent-adaptive engine detects difficulty and improves transcription accuracy in real time.", icon: "🌊" },
  { number: "03", title: "Intent Extraction", desc: "AI extracts financial intent, business context, and repayment signals from natural speech.", icon: "🧠" },
  { number: "04", title: "Bias Detection Agent", desc: "The Auditor Agent checks for gender, location, and income-type bias before any decision is made.", icon: "⚖️" },
  { number: "05", title: "Fair Decision + Explanation", desc: "Every applicant gets a transparent result — with reasoning in their own language.", icon: "✅" },
];

export const FEATURES = [
  { icon: "🗣️", title: "Accent-Aware Speech",  desc: "Trained on rural and regional dialects across India" },
  { icon: "⚖️", title: "Bias Detection",        desc: "Flags gender, location, and income-type discrimination" },
  { icon: "🔍", title: "Decision Simulation",   desc: "Shows what an unbiased decision would look like" },
  { icon: "📋", title: "Explainable AI",         desc: "Every decision comes with plain-language reasoning" },
  { icon: "🌐", title: "Multilingual",           desc: "Hindi, Bengali, English, and more" },
  { icon: "🤖", title: "Multi-Agent System",     desc: "Auditor, Strategy, Fairness & Evaluator agents" },
];

export const IMPACT_COLS = [
  {
    label: "Old System",
    items: [
      "❌ Couldn't understand her accent",
      "❌ Penalised rural location",
      "❌ Rejected informal income",
      "❌ No explanation given",
    ],
  },
  {
    label: "With AWAAZ",
    items: [
      "✅ Transcribed dialect accurately",
      "✅ Removed location bias",
      "✅ Valued daily business activity",
      "✅ Approved with plain-language reason",
    ],
  },
];