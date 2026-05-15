import { useState, useEffect, useCallback, useMemo } from "react";

const STORAGE_KEY = "buy-stock-instead-v4";

const T = {
  bg:        "#FAF7F2",
  bgDeep:    "#F2EDE4",
  card:      "#FFFFFF",
  cardBlue:  "#EEF2FF",
  cardGreen: "#EDFBF3",
  cardPink:  "#FFF0F3",
  cardGold:  "#FFF8EC",
  purple:    "#6C63FF",
  purpleL:   "#EEF2FF",
  green:     "#22C77A",
  greenL:    "#EDFBF3",
  red:       "#FF5C7A",
  redL:      "#FFF0F3",
  gold:      "#F5A623",
  goldL:     "#FFF8EC",
  text:      "#1A1A2E",
  sub:       "#8A8AA8",
  muted:     "#C4C4D8",
  border:    "#EBEBF5",
  mono:      "'DM Mono', monospace",
};

const CATS = [
  { id:"food",    label:"배달음식",  icon:"🍕", color:"#FF6B6B", bg:"#FFF0F0" },
  { id:"clothes", label:"옷/패션",   icon:"👗", color:"#A78BFA", bg:"#F5F0FF" },
  { id:"coffee",  label:"카페/음료", icon:"☕", color:"#F5A623", bg:"#FFF8EC" },
  { id:"etc",     label:"기타",      icon:"💸", color:"#6C63FF", bg:"#EEF2FF" },
];

const POPULAR = [
  "AAPL","MSFT","NVDA","TSLA","META","GOOGL","AMZN",
  "005930.KS","000660.KS","035720.KS","035420.KS",
];
const KR_NAMES = {
  "005930.KS":"삼성전자","000660.KS":"SK하이닉스",
  "035720.KS":"카카오","035420.KS":"NAVER",
};
const NAME_TO_TK = Object.fromEntries(Object.entries(KR_NAMES).map(([k,v])=>[v,k]));
function resolve(input){ const t=input.trim(); return NAME_TO_TK[t]||t.toUpperCase(); }
function displayName(tk){ return KR_NAMES[tk]||tk; }
function isKR(tk){ return tk.endsWith(".KS")||tk.endsWith(".KQ"); }
const USD_TO_KRW = 1400;
function sym(tk){ return "₩"; }
function toKRW(n, tk){ return isKR(tk) ? n : n * USD_TO_KRW; }
function fmtKRW(n){
  if(n>=1e8) return (n/1e8).toFixed(1)+"억";
  if(n>=1e4) return Math.round(n/1e4).toLocaleString()+"만";
  return Math.round(n).toLocaleString();
}
function fmtMoney(n, tk){
  return "₩"+Math.round(toKRW(n,tk)).toLocaleString("ko-KR");
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

body {
  background: ${T.bg};
  color: ${T.text};
  font-family: 'Noto Sans KR', sans-serif;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: ${T.muted}; border-radius: 99px; }

/* ── Root layout ── */
.root { display: flex; min-height: 100vh; max-width: 1440px; margin: 0 auto; }

/* ── Sidebar ── */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: ${T.card};
  border-right: 1.5px solid ${T.border};
  display: flex;
  flex-direction: column;
  padding: 28px 14px 24px;
  position: sticky;
  top: 0;
  height: 100vh;
}

.logo-wrap { padding: 0 8px 28px; }
.logo-emoji { font-size: 32px; line-height: 1; margin-bottom: 8px; display: block; }
.logo-name {
  font-size: 15px; font-weight: 900; color: ${T.text};
  line-height: 1.3; letter-spacing: -.3px;
}
.logo-sub { font-size: 11px; color: ${T.sub}; margin-top: 3px; font-weight: 600; }

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border-radius: 16px;
  font-size: 14px; font-weight: 700; color: ${T.sub};
  cursor: pointer; transition: all .18s; margin-bottom: 4px;
  user-select: none;
}
.nav-item:hover { background: ${T.bg}; color: ${T.text}; }
.nav-item.active { background: ${T.purpleL}; color: ${T.purple}; }
.nav-icon { font-size: 18px; }

.sidebar-footer { margin-top: auto; }
.streak-card {
  background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
  border-radius: 20px; padding: 14px 16px;
  display: flex; align-items: center; gap: 10px;
}
.streak-num { font-size: 22px; font-weight: 900; color: #E65100; }
.streak-label { font-size: 12px; font-weight: 700; color: #BF360C; line-height: 1.3; }

/* ── Main area ── */
.main { flex: 1; overflow-y: auto; min-width: 0; }

/* ── Hero + content gradient wrapper ── */
.dashboard-wrap {
  background: linear-gradient(180deg, #E8E0FF 0%, #DDE8FF 20%, #EEF3FF 40%, ${T.bg} 65%);
}

/* ── Hero banner ── */
.hero {
  padding: 36px 32px 28px;
  position: relative;
}
.hero-label { font-size: 13px; font-weight: 700; color: ${T.purple}; margin-bottom: 6px; opacity: .8; }
.hero-amount {
  font-size: 46px; font-weight: 700; color: ${T.text};
  letter-spacing: -2px; line-height: 1;
  font-family: 'DM Mono', monospace;
}
.hero-sub { font-size: 14px; font-weight: 600; color: ${T.sub}; margin-top: 8px; }
.hero-chips { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
.hero-chip {
  background: rgba(255,255,255,.7);
  backdrop-filter: blur(8px);
  border: 1.5px solid rgba(255,255,255,.9);
  border-radius: 99px; padding: 8px 16px;
  font-size: 13px; font-weight: 700; color: ${T.text};
  display: flex; align-items: center; gap: 6px;
}
.hero-chip .dot { width: 8px; height: 8px; border-radius: 50%; }

/* ── Content ── */
.content { padding: 0 28px 48px; }

/* ── Section header ── */
.sec-hdr {
  display: flex; align-items: center; justify-content: space-between;
  margin: 28px 0 14px;
}
.sec-title { font-size: 16px; font-weight: 800; color: ${T.text}; }
.sec-action {
  font-size: 13px; font-weight: 700; color: ${T.purple};
  cursor: pointer; background: none; border: none; font-family: 'Noto Sans KR', sans-serif;
}

/* ── KPI row ── */
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.kpi-card {
  border-radius: 24px; padding: 20px;
  display: flex; flex-direction: column; gap: 6px;
  transition: transform .18s;
}
.kpi-card:hover { transform: translateY(-3px); }
.kpi-icon { font-size: 24px; margin-bottom: 4px; }
.kpi-lbl { font-size: 12px; font-weight: 700; opacity: .65; }
.kpi-val { font-size: 22px; font-weight: 600; letter-spacing: -.5px; font-family: 'DM Mono', monospace; }
.kpi-sub { font-size: 12px; font-weight: 600; opacity: .6; }

/* ── Stock cards ── */
.stock-card {
  background: ${T.card}; border-radius: 24px;
  border: 1.5px solid ${T.border};
  padding: 18px 20px;
  display: flex; align-items: center; gap: 14px;
  margin-bottom: 10px;
  transition: transform .18s, box-shadow .18s;
  cursor: default;
}
.stock-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(108,99,255,.08); }
.stock-avatar {
  width: 46px; height: 46px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; font-family: 'Noto Sans KR', sans-serif;
  flex-shrink: 0;
  overflow: hidden;
  text-align: center;
  line-height: 1.2;
  word-break: keep-all;
}
.stock-info { flex: 1; min-width: 0; }
.stock-name { font-size: 14px; font-weight: 800; }
.stock-meta { font-size: 12px; color: ${T.sub}; font-weight: 600; margin-top: 2px; font-family: 'DM Mono', monospace; }
.stock-right { text-align: right; }
.stock-price { font-size: 15px; font-weight: 800; font-family: 'DM Mono', monospace; }
.gain-pill {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 99px;
  font-size: 11px; font-weight: 700; font-family: 'DM Mono', monospace;
  margin-top: 4px;
}

/* ── Record list ── */
.rec-card {
  background: ${T.card}; border-radius: 20px;
  border: 1.5px solid ${T.border};
  padding: 14px 18px;
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 8px;
  position: relative;
  transition: transform .15s;
}
.rec-card:hover { transform: translateY(-2px); }
.rec-cat-badge {
  width: 40px; height: 40px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}
.rec-info { flex: 1; min-width: 0; }
.rec-stock { font-size: 13px; font-weight: 800; }
.rec-desc { font-size: 11px; color: ${T.sub}; font-weight: 600; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rec-right { text-align: right; }
.rec-amt { font-size: 14px; font-weight: 800; font-family: 'DM Mono', monospace; }
.rec-gain { font-size: 11px; font-weight: 700; font-family: 'DM Mono', monospace; margin-top: 3px; }
.rec-del {
  position: absolute; right: -6px; top: -6px;
  width: 20px; height: 20px; border-radius: 50%;
  background: ${T.red}; color: #fff; border: none; font-size: 11px;
  cursor: pointer; display: none; align-items: center; justify-content: center;
}
.rec-card:hover .rec-del { display: flex; }

/* ── Calendar ── */
.cal-card {
  background: ${T.card}; border-radius: 28px;
  border: 1.5px solid ${T.border};
  padding: 22px 24px;
  margin-bottom: 12px;
}
.cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.cal-btn {
  width: 32px; height: 32px; border-radius: 99px;
  background: ${T.bg}; border: 1.5px solid ${T.border};
  color: ${T.sub}; font-size: 15px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .15s; font-weight: 800;
}
.cal-btn:hover { background: ${T.purpleL}; border-color: ${T.purple}; color: ${T.purple}; }
.cal-month { font-size: 15px; font-weight: 800; }
.cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; }
.cal-lbl { text-align: center; font-size: 11px; color: ${T.muted}; padding: 4px 0; font-weight: 700; }
.cal-day {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 36px; font-size: 13px; font-weight: 600; color: ${T.sub};
  border-radius: 99px; position: relative; cursor: default;
}
.cal-day.today { background: ${T.purple}; color: #fff; font-weight: 800; }
.cal-dot { width: 5px; height: 5px; border-radius: 50%; background: ${T.red}; margin-top: 1px; }
.cal-day.today .cal-dot { background: rgba(255,255,255,.8); }
.cal-day.empty { visibility: hidden; }

/* ── Cat breakdown ── */
.cat-wrap { background: ${T.card}; border-radius: 28px; border: 1.5px solid ${T.border}; padding: 22px 24px; }
.cat-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.cat-row:last-child { margin-bottom: 0; }
.cat-icon-badge { width: 34px; height: 34px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.cat-lbl { font-size: 13px; font-weight: 700; min-width: 60px; }
.cat-bar-bg { flex: 1; height: 8px; background: ${T.bg}; border-radius: 99px; overflow: hidden; }
.cat-bar { height: 100%; border-radius: 99px; transition: width .6s cubic-bezier(.4,0,.2,1); }
.cat-amt { font-size: 12px; font-weight: 700; font-family: 'DM Mono', monospace; color: ${T.sub}; min-width: 56px; text-align: right; }

/* ── Add form ── */
.form-card { background: ${T.card}; border-radius: 28px; border: 1.5px solid ${T.border}; padding: 28px; max-width: 580px; }
.form-title { font-size: 18px; font-weight: 900; margin-bottom: 22px; }
.fg { margin-bottom: 18px; }
.fl { font-size: 12px; font-weight: 800; color: ${T.sub}; margin-bottom: 8px; display: block; letter-spacing: .3px; }
.fi {
  width: 100%; padding: 13px 18px;
  background: ${T.bg}; border: 1.5px solid ${T.border};
  border-radius: 16px; color: ${T.text}; font-size: 15px;
  font-family: 'Noto Sans KR', sans-serif; font-weight: 600;
  outline: none; transition: border-color .15s, background .15s;
}
.fi:focus { border-color: ${T.purple}; background: #fff; }
.fi::placeholder { color: ${T.muted}; font-weight: 600; }
.fi-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }

.cpills { display: flex; gap: 8px; flex-wrap: wrap; }
.cpill {
  padding: 9px 18px; border-radius: 99px; font-size: 13px; font-weight: 700;
  border: 1.5px solid ${T.border}; background: ${T.bg}; color: ${T.sub};
  cursor: pointer; transition: all .15s; font-family: 'Noto Sans KR', sans-serif;
}
.cpill.on { border-color: ${T.purple}; background: ${T.purpleL}; color: ${T.purple}; }

.schips { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 10px; }
.schip {
  padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 700;
  font-family: 'DM Mono', monospace;
  background: ${T.bg}; border: 1.5px solid ${T.border}; color: ${T.sub};
  cursor: pointer; transition: all .15s;
}
.schip:hover { border-color: ${T.green}; color: ${T.green}; background: ${T.greenL}; }

.total-preview {
  margin-top: 10px; padding: 12px 16px;
  background: ${T.goldL}; border: 1.5px solid #FFD580;
  border-radius: 14px;
  font-size: 13px; font-weight: 700; color: #9A6200;
  font-family: 'DM Mono', monospace;
}

.submit-btn {
  width: 100%; padding: 16px;
  border: none; border-radius: 99px;
  font-size: 16px; font-weight: 900;
  cursor: pointer; font-family: 'Noto Sans KR', sans-serif;
  background: ${T.purple}; color: #fff;
  transition: transform .15s, box-shadow .15s;
  margin-top: 8px; letter-spacing: -.2px;
  box-shadow: 0 6px 20px rgba(108,99,255,.35);
}
.submit-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(108,99,255,.4); }
.submit-btn:active { transform: translateY(0); box-shadow: 0 4px 12px rgba(108,99,255,.3); }
.submit-btn:disabled { opacity: .4; cursor: not-allowed; transform: none; box-shadow: none; }

/* ── Bottom nav ── */
.bottom-nav {
  display: none;
  position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
  background: ${T.card};
  border: 1.5px solid ${T.border};
  border-radius: 99px;
  padding: 8px 12px;
  justify-content: space-around;
  gap: 4px;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0,0,0,.1);
  min-width: 260px;
}
.bn-item {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 8px 20px; border-radius: 99px;
  font-size: 11px; font-weight: 700; color: ${T.sub};
  cursor: pointer; transition: all .18s;
  min-width: 72px;
}
.bn-item.active {
  background: ${T.purpleL};
  color: ${T.purple};
}
.bn-icon { font-size: 18px; line-height: 1; }

/* ── Page header ── */
.page-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 28px 28px 0;
}
.page-title { font-size: 22px; font-weight: 900; }
.add-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 20px; border-radius: 99px;
  background: ${T.purple}; color: #fff;
  border: none; font-size: 13px; font-weight: 800;
  cursor: pointer; font-family: 'Noto Sans KR', sans-serif;
  box-shadow: 0 4px 14px rgba(108,99,255,.3);
  transition: transform .15s;
}
.add-btn:hover { transform: translateY(-1px); }

/* ── Tab pills ── */
.tab-pills { display: flex; gap: 8px; padding: 20px 28px 0; }
.t-pill {
  padding: 9px 20px; border-radius: 99px; font-size: 13px; font-weight: 700;
  border: 1.5px solid ${T.border}; background: ${T.card}; color: ${T.sub};
  cursor: pointer; font-family: 'Noto Sans KR', sans-serif; transition: all .15s;
}
.t-pill.on { background: ${T.purple}; border-color: ${T.purple}; color: #fff; }

/* ── Spinner ── */
.spin {
  display: inline-block; width: 13px; height: 13px;
  border: 2px solid ${T.border}; border-top-color: ${T.purple};
  border-radius: 50%; animation: spin .6s linear infinite;
  margin-left: 6px; vertical-align: middle;
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

/* ── Empty ── */
.empty-state { text-align: center; padding: 48px 20px; color: ${T.muted}; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-txt { font-size: 15px; font-weight: 700; }
.empty-sub { font-size: 13px; font-weight: 600; margin-top: 4px; }

/* ── Refresh btn ── */
.refresh-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 18px; border-radius: 99px;
  border: 1.5px solid ${T.border}; background: ${T.card};
  color: ${T.sub}; font-size: 12px; font-weight: 700;
  cursor: pointer; font-family: 'Noto Sans KR', sans-serif; transition: all .15s;
}
.refresh-btn:hover { border-color: ${T.green}; color: ${T.green}; background: ${T.greenL}; }
.refresh-btn:disabled { opacity: .4; cursor: not-allowed; }

@media (max-width: 860px) {
  .sidebar { display: none; }
  .bottom-nav { display: flex; }
  .main { padding-bottom: 100px; }
  .kpi-row { grid-template-columns: 1fr 1fr; }
  .dash-grid { grid-template-columns: 1fr; }
}
@media (max-width: 520px) {
  .hero { padding: 28px 20px 36px; }
  .hero-amount { font-size: 36px; }
  .content { padding: 0 16px 48px; }
  .page-hdr { padding: 20px 16px 0; }
  .tab-pills { padding: 16px 16px 0; }
  .fi-row { grid-template-columns: 1fr 1fr; }
}
`;

function Spinner(){ return <span className="spin"/>; }

// Palette for stock avatars
const AVATAR_COLORS = [
  {bg:"#EEF2FF",color:"#6C63FF"},{bg:"#EDFBF3",color:"#22C77A"},
  {bg:"#FFF0F3",color:"#FF5C7A"},{bg:"#FFF8EC",color:"#F5A623"},
  {bg:"#F0F9FF",color:"#3B82F6"},{bg:"#F5F0FF",color:"#A78BFA"},
];
function avatarColor(tk){ const i=tk.charCodeAt(0)%AVATAR_COLORS.length; return AVATAR_COLORS[i]; }

export default function App(){
  const [records,  setRecords]  = useState([]);
  const [prices,   setPrices]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [hidden,   setHidden]   = useState(false);
  const [page,     setPage]     = useState("dashboard");
  const [tab,      setTab]      = useState("records");
  const [calMo,    setCalMo]    = useState(()=>{ const d=new Date(); return {y:d.getFullYear(),m:d.getMonth()}; });
  const [calSelected, setCalSelected] = useState(null);
  const [form,     setForm]     = useState({
    item:"", ticker:"", buyPrice:"", shares:"", category:"food",
    date: new Date().toISOString().slice(0,10),
  });

  useEffect(()=>{
    (async()=>{ try{ const r=await window.storage.get(STORAGE_KEY); if(r?.value) setRecords(JSON.parse(r.value)); }catch{} })();
  },[]);

  const save = useCallback(async nr=>{ setRecords(nr); try{ await window.storage.set(STORAGE_KEY,JSON.stringify(nr)); }catch(e){ console.error(e); } },[]);

  const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
  const TWELVEDATA_KEY = import.meta.env.VITE_TWELVEDATA_API_KEY;

  // 캐시: 1시간 이내 조회한 시세는 재사용
  const CACHE_KEY = "price-cache-v1";
  const CACHE_TTL = 60 * 60 * 1000; // 1시간

  const loadCache = () => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)||"{}"); } catch { return {}; }
  };
  const saveCache = (cache) => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
  };

  const fetchFinnhub = async (ticker) => {
    const resp = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`
    );
    const data = await resp.json();
    if (!data.c || data.c === 0) throw new Error("no data");
    return { price: data.c, currency: "USD" };
  };

  const fetchTwelveData = async (ticker) => {
    // 한국 주식: 005930.KS → 005930/KRX 형식으로 변환
    const symbol = ticker.replace(".KS", "/KRX").replace(".KQ", "/KOSDAQ");
    const resp = await fetch(
      `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${TWELVEDATA_KEY}`
    );
    const data = await resp.json();
    if (!data.price) throw new Error("no data");
    return { price: parseFloat(data.price), currency: "KRW" };
  };

  const fetchPrices = useCallback(async()=>{
    const tickers=[...new Set(records.map(r=>r.ticker))]; if(!tickers.length) return;
    setLoading(true);
    const np={...prices};
    const cache = loadCache();
    const now = Date.now();

    for(const tk of tickers){
      // 캐시 확인
      if(cache[tk] && now - cache[tk].ts < CACHE_TTL){
        np[tk] = cache[tk].data;
        continue;
      }
      try{
        let result;
        if(isKR(tk)){
          result = await fetchTwelveData(tk);
        } else {
          result = await fetchFinnhub(tk);
        }
        np[tk] = result;
        cache[tk] = { data: result, ts: now };
      }catch(e){ console.error(tk, e); }
    }

    saveCache(cache);
    setPrices(np); setLoading(false);
  },[records,prices]);

  const handleAdd=()=>{
    if(!form.item||!form.ticker||!form.buyPrice||!form.shares) return;
    const bp=parseFloat(form.buyPrice), sh=parseFloat(form.shares);
    if(isNaN(bp)||bp<=0||isNaN(sh)||sh<=0) return;
    const ticker=resolve(form.ticker);
    const nr=[...records,{ id:Date.now().toString(), item:form.item, ticker, buyPrice:bp, shares:sh, totalCost:bp*sh, category:form.category, date:form.date }]
      .sort((a,b)=>new Date(a.date)-new Date(b.date));
    save(nr); setForm({...form,item:"",ticker:"",buyPrice:"",shares:""}); setPage("dashboard");
  };
  const handleDelete=id=>save(records.filter(r=>r.id!==id));

  const totalInvested = useMemo(()=>records.reduce((s,r)=>{ const c=r.totalCost||(r.buyPrice*r.shares); return s+toKRW(c,r.ticker); },0),[records]);

  const stockSummary = useMemo(()=>{
    const map={};
    for(const r of records){
      if(!map[r.ticker]) map[r.ticker]={ticker:r.ticker,totalCost:0,totalShares:0,count:0};
      const c=r.totalCost||(r.buyPrice*r.shares);
      map[r.ticker].totalCost+=c; map[r.ticker].totalShares+=r.shares; map[r.ticker].count++;
    }
    return Object.values(map).map(s=>{
      const pi=prices[s.ticker]; const avg=s.totalCost/s.totalShares;
      let cv=null,gl=null,gp=null;
      if(pi){
        const priceKRW = toKRW(pi.price, s.ticker);
        cv = s.totalShares * priceKRW;
        gl = cv - s.totalCost;
        gp = gl/s.totalCost*100;
      }
      return{...s,pi,cv,gl,gp,avg};
    });
  },[records,prices]);

  const totalCV = useMemo(()=>stockSummary.reduce((s,st)=>{ if(!st.cv) return s; return s+st.cv; },0),[stockSummary]);
  const hasPrices = useMemo(()=>stockSummary.some(s=>s.pi!=null),[stockSummary]);
  const pl = hasPrices ? totalCV-totalInvested : null;
  const plp = pl!=null && totalInvested>0 ? (pl/totalInvested)*100 : null;
  const recDates=useMemo(()=>new Set(records.map(r=>r.date)),[records]);

  const streak=useMemo(()=>{
    if(!records.length) return 0;
    const sorted=[...new Set(records.map(r=>r.date))].sort().reverse();
    let c=0; const d=new Date();
    for(let i=0;i<365;i++){
      const ds=d.toISOString().slice(0,10);
      if(sorted.includes(ds)){ c++; d.setDate(d.getDate()-1); }
      else if(i===0){ d.setDate(d.getDate()-1); } else break;
    }
    return c;
  },[records]);

  /* ── Calendar ── */
  const renderCal=()=>{
    const{y,m}=calMo;
    const fd=new Date(y,m,1).getDay(), dim=new Date(y,m+1,0).getDate();
    const today=new Date().toISOString().slice(0,10);
    const DAYS=["일","월","화","수","목","금","토"];
    const MONTHS=["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
    const cells=[];
    for(let i=0;i<fd;i++) cells.push(<div key={`e${i}`} className="cal-day empty"/>);
    for(let d=1;d<=dim;d++){
      const ds=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      cells.push(
        <div
          key={d}
          className={`cal-day${ds===today?" today":""}`}
          onClick={()=>setCalSelected(s=>s===ds?null:ds)}
          style={{cursor:"pointer", outline: calSelected===ds?`2px solid ${T.purple}`:"none", background: calSelected===ds&&ds!==today? T.purpleL : undefined}}
        >
          {d}{recDates.has(ds)&&<div className="cal-dot"/>}
        </div>
      );
    }
    return(
      <div className="cal-card">
        <div className="cal-nav">
          <button className="cal-btn" onClick={()=>setCalMo(p=>p.m===0?{y:p.y-1,m:11}:{y:p.y,m:p.m-1})}>‹</button>
          <span className="cal-month">{y}년 {MONTHS[m]}</span>
          <button className="cal-btn" onClick={()=>setCalMo(p=>p.m===11?{y:p.y+1,m:0}:{y:p.y,m:p.m+1})}>›</button>
        </div>
        <div className="cal-grid">
          {DAYS.map(l=><div key={l} className="cal-lbl">{l}</div>)}
          {cells}
        </div>
        {/* Day detail popup */}
        {calSelected&&(()=>{
          const dayRecs=records.filter(r=>r.date===calSelected);
          return(
            <div style={{
              marginTop:14,padding:"14px 16px",
              background:T.bg,borderRadius:18,
              border:`1.5px solid ${T.border}`,
              animation:"fadeUp .2s ease",
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:13,fontWeight:800,color:T.text}}>
                  {calSelected.replace(/-/g,".")}
                </span>
                <button onClick={()=>setCalSelected(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:T.muted,lineHeight:1}}>×</button>
              </div>
              {dayRecs.length===0?(
                <div style={{fontSize:13,color:T.muted,fontWeight:600,textAlign:"center",padding:"8px 0"}}>이 날은 기록이 없어요</div>
              ):dayRecs.map(r=>{
                const cat=CATS.find(c=>c.id===r.category);
                const cost=r.totalCost||(r.buyPrice*r.shares);
                const pi=prices[r.ticker];
                const cv=pi?r.shares*pi.price:null;
                const gl=cv!=null?cv-cost:null;
                const gp=gl!=null&&cost>0?(gl/cost)*100:null;
                return(
                  <div key={r.id} style={{
                    display:"flex",alignItems:"center",gap:10,
                    padding:"10px 12px",borderRadius:14,
                    background:T.card,marginBottom:6,
                    border:`1.5px solid ${T.border}`,
                  }}>
                    <div style={{width:34,height:34,borderRadius:12,background:cat?.bg||T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{cat?.icon||"📦"}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:800}}>{displayName(r.ticker)}</div>
                      <div style={{fontSize:11,color:T.sub,fontWeight:600,marginTop:1}}>{r.item} · {r.shares}주 @ {fmtMoney(r.buyPrice,r.ticker)}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:13,fontWeight:800,fontFamily:"'DM Mono',monospace"}}>{fmtMoney(cost,r.ticker)}</div>
                      {gl!=null&&<div style={{fontSize:11,fontWeight:700,fontFamily:"'DM Mono',monospace",color:gl>=0?T.green:T.red,marginTop:2}}>{gl>=0?"+":""}{gp.toFixed(1)}%</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    );
  };

  /* ── Dashboard ── */
  const mask = (str) => hidden ? "●●●●" : str;

  const PageDashboard=(
    <div className="dashboard-wrap">
      {/* Hero */}
      <div className="hero">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <div className="hero-label">📊 포트폴리오 현황</div>
          <button
            onClick={()=>setHidden(h=>!h)}
            style={{
              background:"rgba(255,255,255,.5)",border:"1.5px solid rgba(255,255,255,.8)",
              borderRadius:"99px",padding:"5px 12px",cursor:"pointer",
              fontSize:12,fontWeight:700,color:T.text,fontFamily:"'Noto Sans KR',sans-serif",
              display:"flex",alignItems:"center",gap:5,backdropFilter:"blur(6px)",
            }}
          >
            {hidden ? "👁️ 보기" : "🙈 숨기기"}
          </button>
        </div>
        <div className="hero-amount">
          {hidden ? <span style={{letterSpacing:4,fontSize:36}}>●●●●</span> : <span style={{fontFamily:"'DM Mono',monospace"}}>₩{fmtKRW(totalCV||totalInvested)}{loading&&<Spinner/>}</span>}
        </div>
        <div className="hero-sub">{records.length}번의 현명한 선택 · {stockSummary.length}개 종목</div>
        <div className="hero-chips">
          <div className="hero-chip">
            <div className="dot" style={{background:T.purple}}/>
            원금 {hidden?"●●●●":<span style={{fontFamily:"'DM Mono',monospace"}}>₩{fmtKRW(totalInvested)}</span>}
          </div>
          {pl!=null&&(
            <div className="hero-chip" style={{color:pl>=0?T.green:T.red}}>
              <div className="dot" style={{background:pl>=0?T.green:T.red}}/>
              {hidden ? "●●●●" : <span style={{fontFamily:"'DM Mono',monospace"}}>{pl>=0?"+":""}₩{fmtKRW(Math.abs(pl))} ({pl>=0?"+":""}{plp.toFixed(1)}%)</span>}
            </div>
          )}
        </div>
      </div>

      <div className="content">
        {/* KPI cards */}
        <div className="sec-hdr" style={{marginTop:20}}>
          <div className="sec-title">요약</div>
          <button className="refresh-btn" onClick={fetchPrices} disabled={loading}>
            {loading?<><Spinner/>갱신 중</>:"↻ 시세 갱신"}
          </button>
        </div>
        <div className="kpi-row">
          <div className="kpi-card" style={{background:T.purpleL}}>
            <div className="kpi-icon">💰</div>
            <div className="kpi-lbl" style={{color:T.purple}}>총 투자 원금</div>
            <div className="kpi-val" style={{color:T.purple}}>{hidden?"●●●●":<span style={{fontFamily:"'DM Mono',monospace"}}>₩{fmtKRW(totalInvested)}</span>}</div>
            <div className="kpi-sub" style={{color:T.purple}}>{records.length}번 참음</div>
          </div>
          <div className="kpi-card" style={{background:pl==null?T.purpleL:pl>=0?T.greenL:T.redL}}>
            <div className="kpi-icon">{pl==null?"⏳":pl>=0?"🚀":"📉"}</div>
            <div className="kpi-lbl" style={{color:pl==null?T.purple:pl>=0?T.green:T.red}}>수익 / 손실</div>
            <div className="kpi-val" style={{color:pl==null?T.sub:pl>=0?T.green:T.red}}>
              {pl==null?"—":hidden?"●●●●":<span style={{fontFamily:"'DM Mono',monospace"}}>{pl>=0?"+":""}₩{fmtKRW(Math.abs(pl))}</span>}
            </div>
            <div className="kpi-sub" style={{color:pl==null?T.muted:pl>=0?T.green:T.red}}>
              {pl==null?"시세 갱신 후 표시":hidden?"●●%":`${pl>=0?"+":""}${plp.toFixed(2)}%`}
            </div>
          </div>
        </div>

        {/* Stocks */}
        {stockSummary.length>0&&(
          <>
            <div className="sec-hdr">
              <div className="sec-title">종목별 요약</div>
            </div>
            {stockSummary.map(s=>{
              const dn=displayName(s.ticker); 
              const av=avatarColor(s.ticker);
              return(
                <div key={s.ticker} className="stock-card">
                  <div className="stock-avatar" style={{background:av.bg,color:av.color}}>{dn.slice(0,2)}</div>
                  <div className="stock-info">
                    <div className="stock-name">{dn}</div>
                    <div className="stock-meta">{s.count}회 · {s.totalShares.toFixed(s.totalShares<1?4:2)}주 · 평균 {hidden?"●●●":(`₩${fmtKRW(s.avg)}`)}</div>
                  </div>
                  <div className="stock-right">
                    {s.pi&&<div className="stock-price">{hidden?"●●●":`₩${fmtKRW(toKRW(s.pi.price,s.ticker))}`}</div>}
                    {s.gl!=null&&(
                      <div className="gain-pill" style={{background:s.gl>=0?T.greenL:T.redL,color:s.gl>=0?T.green:T.red}}>
                        {hidden?"●●%":`${s.gl>=0?"+":""}${s.gp.toFixed(1)}%`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Calendar */}
        <div className="sec-hdr"><div className="sec-title">📅 투자 캘린더</div></div>
        {renderCal()}

        {/* Cat breakdown */}
        {records.length>0&&(()=>{
          const hasCat=CATS.some(cat=>records.some(r=>r.category===cat.id));
          if(!hasCat) return null;
          return(
            <>
              <div className="sec-hdr"><div className="sec-title">🏷️ 카테고리별</div></div>
              <div className="cat-wrap">
                {CATS.map(cat=>{
                  const tot=records.filter(r=>r.category===cat.id).reduce((s,r)=>{
                    const c=r.totalCost||(r.buyPrice*r.shares); return s+toKRW(c,r.ticker);
                  },0);
                  if(tot===0) return null;
                  const pct=totalInvested>0?(tot/totalInvested)*100:0;
                  return(
                    <div key={cat.id} className="cat-row">
                      <div className="cat-icon-badge" style={{background:cat.bg}}>{cat.icon}</div>
                      <div className="cat-lbl">{cat.label}</div>
                      <div className="cat-bar-bg"><div className="cat-bar" style={{width:`${pct}%`,background:cat.color}}/></div>
                      <div className="cat-amt">{hidden?"●●●":<span style={{fontFamily:"'DM Mono',monospace"}}>₩{fmtKRW(tot)}</span>}</div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );

  /* ── Records ── */
  const PageRecords=(
    <div className="content" style={{paddingTop:20}}>
      <div className="tab-pills" style={{padding:"0 0 16px"}}>
        <button className={`t-pill ${tab==="records"?"on":""}`} onClick={()=>setTab("records")}>매수 기록 ({records.length})</button>
        <button className={`t-pill ${tab==="detail"?"on":""}`} onClick={()=>setTab("detail")}>종목 상세</button>
      </div>

      {tab==="records"&&(
        records.length===0
          ?<div className="empty-state"><div className="empty-icon">🎯</div><div className="empty-txt">아직 기록이 없어요</div><div className="empty-sub">첫 투자를 기록해보세요!</div></div>
          :records.map(r=>{
            const cat=CATS.find(c=>c.id===r.category);
            const pi=prices[r.ticker];
            const cost=r.totalCost||(r.buyPrice*r.shares);
            let gainEl=null;
            if(pi){ const cv=r.shares*toKRW(pi.price,r.ticker),cost2=toKRW(cost,r.ticker),gl=cv-cost2,gp=gl/cost2*100; gainEl=<div className="rec-gain" style={{color:gl>=0?T.green:T.red}}>{gl>=0?"+":""}{fmtMoney(Math.abs(gl),r.ticker)} ({gl>=0?"+":""}{gp.toFixed(1)}%)</div>; }
            return(
              <div key={r.id} className="rec-card">
                <button className="rec-del" onClick={()=>handleDelete(r.id)}>×</button>
                <div className="rec-cat-badge" style={{background:cat?.bg||T.bg}}>{cat?.icon||"📦"}</div>
                <div className="rec-info">
                  <div className="rec-stock">{displayName(r.ticker)}</div>
                  <div className="rec-desc">{r.date} · {r.item} · {r.shares}주 @ {fmtMoney(r.buyPrice,r.ticker)}</div>
                </div>
                <div className="rec-right">
                  <div className="rec-amt">{fmtMoney(cost,r.ticker)}</div>
                  {gainEl}
                </div>
              </div>
            );
          })
      )}

      {tab==="detail"&&(
        stockSummary.length===0
          ?<div className="empty-state"><div className="empty-icon">📊</div><div className="empty-txt">종목 데이터가 없어요</div></div>
          :stockSummary.map(s=>{
            const dn=displayName(s.ticker);  const av=avatarColor(s.ticker);
            return(
              <div key={s.ticker} className="stock-card" style={{flexDirection:"column",alignItems:"flex-start",gap:12}}>
                <div style={{display:"flex",alignItems:"center",gap:12,width:"100%"}}>
                  <div className="stock-avatar" style={{background:av.bg,color:av.color}}>{dn.slice(0,2)}</div>
                  <div style={{flex:1}}>
                    <div className="stock-name">{dn}{KR_NAMES[s.ticker]&&<span style={{fontSize:11,color:T.muted,marginLeft:6}}>{s.ticker}</span>}</div>
                    <div className="stock-meta">{s.count}회 · {s.totalShares.toFixed(s.totalShares<1?4:2)}주</div>
                  </div>
                  {s.pi&&<div className="gain-pill" style={{background:T.goldL,color:T.gold,fontSize:12}}>{cs}{s.pi.price?.toLocaleString()}</div>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,width:"100%"}}>
                  {[["평균단가",`₩${fmtKRW(s.avg)}`],["투자원금",`₩${fmtKRW(s.totalCost)}`],s.cv!=null?["평가금액",`₩${fmtKRW(s.cv)}`]:["평가금액","—"]].map(([l,v])=>(
                    <div key={l} style={{background:T.bg,borderRadius:14,padding:"10px 12px"}}>
                      <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:3}}>{l}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700}}>{v}</div>
                    </div>
                  ))}
                </div>
                {s.gl!=null&&(
                  <div style={{display:"flex",gap:8}}>
                    <div className="gain-pill" style={{background:s.gl>=0?T.greenL:T.redL,color:s.gl>=0?T.green:T.red}}>수익률 {s.gl>=0?"+":""}{s.gp.toFixed(2)}%</div>
                    <div className="gain-pill" style={{background:s.gl>=0?T.greenL:T.redL,color:s.gl>=0?T.green:T.red}}>수익금 {s.gl>=0?"+":""}{cs}{Math.abs(Math.round(s.gl)).toLocaleString()}</div>
                  </div>
                )}
              </div>
            );
          })
      )}
    </div>
  );

  /* ── Add ── */
  const tk = resolve(form.ticker||"");
  const totalCost = parseFloat(form.buyPrice||0)*parseFloat(form.shares||0);
  const isEtc = form.category === "etc";

  const PageAdd=(
    <div className="content" style={{paddingTop:24}}>
      <div className="form-card">
        <div className="form-title">🚀 뭘 안 사고 주식 샀나요?</div>
        <div className="fg">
          <label className="fl">어떤 소비를 참았나요?</label>
          <div className="cpills">
            {CATS.map(c=><button key={c.id} className={`cpill ${form.category===c.id?"on":""}`} onClick={()=>setForm({...form,category:c.id})}>{c.icon} {c.label}</button>)}
          </div>
          {isEtc&&(
            <input
              className="fi" style={{marginTop:10}}
              placeholder="직접 입력 (예: 게임 아이템, 스벅 MD...)"
              value={form.customCat||""}
              onChange={e=>setForm({...form,customCat:e.target.value})}
            />
          )}
        </div>
        <div className="fg">
          <label className="fl">참은 것</label>
          <input
            className="fi"
            placeholder="예: 치킨 2마리, 나이키 에어맥스..."
            value={form.item}
            onChange={e=>setForm({...form,item:e.target.value})}
          />
        </div>
        <div className="fg">
          <label className="fl">대신 산 주식</label>
          <input className="fi" placeholder="예: 삼성전자, AAPL, NVDA..." value={form.ticker} onChange={e=>setForm({...form,ticker:e.target.value})}/>
          <div className="schips">
            {POPULAR.map(s=><button key={s} className="schip" onClick={()=>setForm({...form,ticker:KR_NAMES[s]||s})}>{KR_NAMES[s]||s}</button>)}
          </div>
        </div>
        <div className="fg">
          <label className="fl">매수 정보</label>
          <div className="fi-row">
            <input className="fi" type="number" placeholder={isKR(tk)?"매수가 (원)":"매수가 (달러 $)"} value={form.buyPrice} onChange={e=>setForm({...form,buyPrice:e.target.value})}/>
            <input className="fi" type="number" step="0.0001" placeholder="수량 (주)" value={form.shares} onChange={e=>setForm({...form,shares:e.target.value})}/>
            <input className="fi" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
          </div>
          {form.buyPrice&&form.shares&&totalCost>0&&(
            <div className="total-preview">
              💰 총 매수금액 · ₩{Math.round(toKRW(totalCost, tk)).toLocaleString("ko-KR")}
              {!isKR(tk)&&<span style={{fontSize:11,opacity:.7,marginLeft:6}}>(${totalCost.toLocaleString()} × {USD_TO_KRW}원)</span>}
            </div>
          )}
        </div>
        <button className="submit-btn" onClick={handleAdd} disabled={!form.item||!form.ticker||!form.buyPrice||!form.shares}>
          이거 대신 주식 샀다! 🎉
        </button>
      </div>
    </div>
  );

  const NAV=[
    {id:"dashboard",icon:"🏠",label:"홈"},
    {id:"records",icon:"📋",label:"기록"},
    {id:"add",icon:"➕",label:"추가"},
  ];

  return(
    <>
      <style>{CSS}</style>
      <div className="root">
        <nav className="sidebar">
          <div className="logo-wrap">
            <span className="logo-emoji">🔥</span>
            <div className="logo-name">이거 대신<br/>주식 샀다</div>
            <div className="logo-sub">소비 충동 투자 기록장</div>
          </div>
          {NAV.map(n=>(
            <div key={n.id} className={`nav-item ${page===n.id?"active":""}`} onClick={()=>setPage(n.id)}>
              <span className="nav-icon">{n.icon}</span>{n.label}
            </div>
          ))}
          {streak>0&&(
            <div className="sidebar-footer">
              <div className="streak-card">
                <div style={{fontSize:26}}>🔥</div>
                <div><div className="streak-num">{streak}일</div><div className="streak-label">연속 투자 중!</div></div>
              </div>
            </div>
          )}
        </nav>

        <div className="main">
          {page!=="dashboard"&&(
            <div className="page-hdr">
              <div className="page-title">{page==="records"?"📋 매수 기록":"✍️ 기록 추가"}</div>
              {page==="records"&&<button className="refresh-btn" onClick={fetchPrices} disabled={loading}>{loading?<><Spinner/>갱신</>:"↻ 시세"}</button>}
            </div>
          )}
          {page==="dashboard"&&PageDashboard}
          {page==="records"&&PageRecords}
          {page==="add"&&PageAdd}
        </div>

        <div className="bottom-nav">
          {NAV.map(n=>(
            <div key={n.id} className={`bn-item ${page===n.id?"active":""}`} onClick={()=>setPage(n.id)}>
              <span className="bn-icon">{n.icon}</span>{n.label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
