import React, { useState, useRef, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  DollarSign,
  Zap,
  Shield,
  Terminal,
  Send,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Activity,
  Layers,
  Network,
  LayoutTemplate,
  Play,
  Calculator,
  Target,
  TrendingDown,
  Lock,
  Server,
  ShieldAlert,
} from "lucide-react";

// --- ГЕНЕРАТОР ЖИВОЙ ПРЕДЫСТОРИИ ---
const generateLiveHistory = () => {
  const c = [],
    l = [];
  const now = new Date();
  for (let i = 12; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    c.push({ time: t, oldCost: 0.15, newCost: 0.05 });
    l.push({ time: t, openai: 420 + Math.random() * 20, claude: 0 });
  }
  return { costHistory: c, latencyHistory: l };
};

export default function App() {
  const [activeTab, setActiveTab] = useState("simulator");

  // Состояния симулятора
  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [gatewayLogs, setGatewayLogs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);

  // Живая телеметрия (эффект активности в шапке)
  const [rps, setRps] = useState(124);
  const [p99Latency, setP99Latency] = useState(412);

  const [simulateOutage, setSimulateOutage] = useState(false);
  const [complianceMode, setComplianceMode] = useState(true);
  const [useSemanticCache, setUseSemanticCache] = useState(true);

  // --- ДИНАМИЧЕСКИЕ МЕТРИКИ (ТО, ЧТО ТЕПЕРЬ МЕНЯЕТСЯ) ---
  const [totalSaved, setTotalSaved] = useState(1240.5);
  const [totalTokens, setTotalTokens] = useState(145000);
  const [piiSecured, setPiiSecured] = useState(142);
  const [blockedRequests, setBlockedRequests] = useState(24);

  const history = generateLiveHistory();
  const [costData, setCostData] = useState(history.costHistory);
  const [latencyData, setLatencyData] = useState(history.latencyHistory);

  // Состояния для аудита
  const [auditSpend, setAuditSpend] = useState(50000);
  const [auditSetup, setAuditSetup] = useState({
    directApi: true,
    noCache: false,
    singleProvider: true,
    noPiiFilter: true,
  });

  const potentialSavingsCalc =
    (auditSetup.noCache ? 0 : auditSpend * 0.35) +
    (auditSetup.singleProvider ? 0 : auditSpend * 0.15);
  const newProjectedSpend = auditSpend - potentialSavingsCalc;
  const riskScore =
    (auditSetup.directApi ? 25 : 0) +
    (auditSetup.singleProvider ? 25 : 0) +
    (auditSetup.noPiiFilter ? 50 : 0);

  const logsEndRef = useRef(null);
  const chatEndRef = useRef(null);

  // Эффект обновления телеметрии в шапке
  useEffect(() => {
    const interval = setInterval(() => {
      setRps((prev) => Math.max(100, prev + (Math.random() > 0.5 ? 2 : -2)));
      if (!simulateOutage) setP99Latency((prev) => 380 + Math.random() * 40);
    }, 2000);
    return () => clearInterval(interval);
  }, [simulateOutage]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [gatewayLogs]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // --- ГЛАВНЫЙ ДВИЖОК ОБНОВЛЕНИЯ ДАННЫХ ---
  const triggerUpdate = (
    model,
    latency,
    legacyCost,
    newCost,
    tokens = 0,
    isPii = false,
    isBlocked = false
  ) => {
    const timeNow = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // 1. Обновляем счетчики
    if (tokens > 0) setTotalTokens((prev) => prev + tokens);
    if (newCost < legacyCost && !isBlocked)
      setTotalSaved((prev) => prev + (legacyCost - newCost));
    if (isPii) setPiiSecured((prev) => prev + 1);
    if (isBlocked) setBlockedRequests((prev) => prev + 1);

    // 2. Обновляем графики (сдвиг влево)
    setLatencyData((prev) => {
      const newData = [
        ...prev.slice(1),
        {
          time: timeNow,
          openai: model.includes("gpt") || model === "Azure" ? latency : 0,
          claude:
            model.includes("Claude") || model.includes("Local") ? latency : 0,
        },
      ];
      return newData;
    });

    setCostData((prev) => {
      const newData = [
        ...prev.slice(1),
        {
          time: timeNow,
          oldCost: legacyCost,
          newCost: newCost,
        },
      ];
      return newData;
    });
  };

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setGatewayLogs((prev) => [...prev, { time: timestamp, message, type }]);
  };

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const clearSession = () => {
    setChatHistory([]);
    setGatewayLogs([]);
    addLog("[System] Ready.", "info");
  };

  // --- СЦЕНАРИЙ 1: CACHE ---
  const runMarginCollapseScenario = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setActiveScenario("margin");
    clearSession();
    addLog("--- SCENARIO: AI MARGIN COLLAPSE ---", "warning");
    await delay(800);

    const prompt = "Summarize the Q3 Financial Report.";
    setChatHistory([{ role: "user", content: prompt }]);
    addLog(`[Client] Initial request...`, "info");
    await delay(1000);

    // Первый запрос (Дорогой)
    triggerUpdate("gpt-4o", 450, 0.15, 0.05, 345);
    setChatHistory((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Q3 Summary: Revenue up 14%...",
        model: "gpt-4o",
        tokens: 345,
      },
    ]);
    addLog(`[FinOps] Request cost: $0.05. Caching result.`, "info");

    await delay(1500);

    // Повторные запросы (Бесплатные)
    for (let i = 0; i < 3; i++) {
      addLog(`[Cache] Match Found for identical query!`, "success");
      triggerUpdate("Semantic Cache", 12, 0.15, 0.0, 0);
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: prompt },
        {
          role: "assistant",
          content: "Q3 Summary: Revenue up 14%...",
          model: "Semantic Cache",
          tokens: 0,
        },
      ]);
      await delay(1000);
    }
    setIsProcessing(false);
    setActiveScenario(null);
  };

  // --- СЦЕНАРИЙ 2: FALLBACK ---
  const runLatencyTrapScenario = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setActiveScenario("latency");
    clearSession();
    addLog("--- SCENARIO: RESILIENCE FALLBACK ---", "warning");
    await delay(800);
    setSimulateOutage(true);

    setChatHistory([{ role: "user", content: "Extract legal clauses." }]);
    addLog("[Router] Attempting Primary Azure OpenAI...", "info");
    await delay(2000);

    triggerUpdate("Azure", 3000, 0.15, 0.15); // Спайк на графике
    addLog("[Alert] Azure OpenAI TIMEOUT (504).", "error");
    await delay(800);

    addLog("[Circuit Breaker] Rerouting to Claude-3-Haiku...", "warning");
    await delay(1000);

    triggerUpdate("Claude-3", 420, 0.15, 0.04, 850);
    setChatHistory((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Legal summary ready.",
        model: "Claude-3",
        tokens: 850,
      },
    ]);

    setSimulateOutage(false);
    setIsProcessing(false);
    setActiveScenario(null);
  };

  // --- СЦЕНАРИЙ 3: SECURITY ---
  const runIntegrationZooScenario = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setActiveScenario("zoo");
    clearSession();
    addLog("--- SCENARIO: RATE LIMIT ENFORCEMENT ---", "warning");
    await delay(800);

    for (let i = 1; i <= 3; i++) {
      addLog(`[Marketing_Bot] Request ${i}/3`, "warning");
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: `Bulk Request ${i}` },
      ]);
      await delay(600);

      if (i < 3) {
        triggerUpdate("gpt-4o", 430, 0.15, 0.05, 1200);
        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Processing...",
            model: "gpt-4o",
            tokens: 1200,
          },
        ]);
      } else {
        addLog(`[SECURITY] QUOTA EXCEEDED!`, "error");
        triggerUpdate("BLOCKED", 0, 0.15, 0.0, 0, false, true);
        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Error 429: Quota Exceeded.",
            model: "BLOCKED",
            tokens: 0,
          },
        ]);
      }
      await delay(1000);
    }
    setIsProcessing(false);
    setActiveScenario(null);
  };

  // --- СЦЕНАРИЙ 4: COMPLIANCE ---
  const runSovereigntyScenario = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setActiveScenario("sovereignty");
    clearSession();
    addLog("--- SCENARIO: PII DATA SOVEREIGNTY ---", "warning");
    await delay(800);

    const piiPrompt = "Analyze profile: John Doe, SSN: 999-00-1111.";
    setChatHistory([{ role: "user", content: piiPrompt }]);
    addLog("[Scanner] Analyzing payload for PII...", "info");
    await delay(1200);

    addLog("[ALERT] Social Security Number detected!", "error");
    await delay(800);
    addLog("[Router] Routing to Local Sovereign VPC...", "success");

    triggerUpdate("Llama-3-Local", 850, 0.15, 0.0, 120, true);
    setChatHistory((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Analysis complete (Local Processing).",
        model: "Llama-3-Local",
        tokens: 120,
      },
    ]);

    setIsProcessing(false);
    setActiveScenario(null);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isProcessing) return;
    const msg = prompt.trim();
    setPrompt("");
    setIsProcessing(true);
    setChatHistory((prev) => [...prev, { role: "user", content: msg }]);

    const isPii = msg.includes("SSN") || msg.toLowerCase().includes("password");
    const isHello = msg.toLowerCase().includes("hello");

    await delay(800);
    if (isPii) {
      triggerUpdate("Llama-3-Local", 850, 0.15, 0.0, 100, true);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "PII detected. Local routing active.",
          model: "Llama-3-Local",
          tokens: 100,
        },
      ]);
    } else if (isHello && useSemanticCache) {
      triggerUpdate("Semantic Cache", 15, 0.15, 0.0, 0);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Served from Cache.",
          model: "Semantic Cache",
          tokens: 0,
        },
      ]);
    } else {
      triggerUpdate("gpt-4o", 420, 0.15, 0.05, 150);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Standard Response.",
          model: "gpt-4o",
          tokens: 150,
        },
      ]);
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100 font-sans p-4 lg:p-8 overflow-x-hidden selection:bg-indigo-500/30">
      {/* 🚀 ТЕЛЕМЕТРИЯ (ЖИВАЯ) */}
      <div className="bg-[#0A1220]/80 border border-slate-800/50 rounded-lg p-3 mb-8 flex flex-wrap justify-between items-center text-xs font-mono tracking-wider text-slate-400 shadow-sm">
        <div className="flex items-center space-x-6 px-2">
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mr-2 shadow-[0_0_8px_#10b981]"></span>{" "}
            K8s Cluster: ACTIVE
          </span>
          <span className="flex items-center">
            <Activity className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Global
            RPS: <strong className="text-white ml-1.5">{rps}</strong>
          </span>
          <span className="flex items-center">
            <Zap className="w-3.5 h-3.5 mr-1.5 text-yellow-500" /> P99 Latency:{" "}
            <strong className="text-white ml-1.5">
              {p99Latency.toFixed(0)}ms
            </strong>
          </span>
        </div>
        <div className="hidden md:flex items-center px-2 text-indigo-400 font-bold uppercase tracking-tighter">
          SOC2 & GDPR COMPLIANT
        </div>
      </div>

      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6 relative z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white flex items-center">
            <Layers className="w-8 h-8 mr-3 text-blue-500" /> Sovereign AI
            Gateway
          </h1>
          <p className="text-slate-500 text-sm mt-2 ml-11 font-medium tracking-wide uppercase">
            Infrastructure Control Panel
          </p>
        </div>

        <div className="flex bg-[#0A1220] p-1.5 rounded-xl border border-slate-800 shadow-lg overflow-x-auto w-full xl:w-auto">
          <button
            onClick={() => setActiveTab("simulator")}
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center whitespace-nowrap ${
              activeTab === "simulator"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-4 h-4 mr-2" /> Ops Console
          </button>
          <button
            onClick={() => setActiveTab("architecture")}
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center whitespace-nowrap ${
              activeTab === "architecture"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Network className="w-4 h-4 mr-2" /> Architecture
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center whitespace-nowrap ${
              activeTab === "audit"
                ? "bg-emerald-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calculator className="w-4 h-4 mr-2" /> ROI Engine
          </button>
        </div>
      </header>

      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
          <div className="lg:col-span-12 bg-[#0A1220]/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <h3 className="text-slate-400 font-bold mb-5 flex items-center text-[10px] uppercase tracking-[0.2em]">
              <Play className="w-4 h-4 mr-2 text-indigo-400" /> Executive Demos
              (Live Action)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 relative z-10">
              <button
                onClick={runMarginCollapseScenario}
                disabled={isProcessing}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                  activeScenario === "margin"
                    ? "bg-emerald-900/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                    : "bg-[#0F172A] border-slate-800 hover:border-emerald-500/50"
                } disabled:opacity-40`}
              >
                <div className="flex items-center text-emerald-400 font-bold text-sm mb-2">
                  <DollarSign className="w-4 h-4 mr-1.5" /> FinOps: Cache
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Demonstrate 40% cost reduction via Qdrant semantic matching.
                </div>
              </button>
              <button
                onClick={runLatencyTrapScenario}
                disabled={isProcessing}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                  activeScenario === "latency"
                    ? "bg-blue-900/30 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    : "bg-[#0F172A] border-slate-800 hover:border-blue-500/50"
                } disabled:opacity-40`}
              >
                <div className="flex items-center text-blue-400 font-bold text-sm mb-2">
                  <AlertTriangle className="w-4 h-4 mr-1.5" /> Resilience:
                  Fallback
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Trigger outage simulation & seamless provider switching.
                </div>
              </button>
              <button
                onClick={runIntegrationZooScenario}
                disabled={isProcessing}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                  activeScenario === "zoo"
                    ? "bg-red-900/30 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                    : "bg-[#0F172A] border-slate-800 hover:border-red-500/50"
                } disabled:opacity-40`}
              >
                <div className="flex items-center text-red-400 font-bold text-sm mb-2">
                  <ShieldAlert className="w-4 h-4 mr-1.5" /> Security: Limits
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Protect budget by blocking rogue microservice traffic.
                </div>
              </button>
              <button
                onClick={runSovereigntyScenario}
                disabled={isProcessing}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                  activeScenario === "sovereignty"
                    ? "bg-purple-900/30 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                    : "bg-[#0F172A] border-slate-800 hover:border-purple-500/50"
                } disabled:opacity-40`}
              >
                <div className="flex items-center text-purple-400 font-bold text-sm mb-2">
                  <Lock className="w-4 h-4 mr-1.5" /> Compliance: PII
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Auto-route sensitive data to air-gapped local models.
                </div>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col space-y-6">
            <div className="bg-[#0A1220]/90 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-[450px]">
              <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-300 text-sm uppercase tracking-widest flex items-center">
                  <Terminal className="w-4 h-4 mr-2 text-indigo-400" />{" "}
                  Microservice Stream
                </h3>
                <button
                  onClick={clearSession}
                  disabled={isProcessing}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm bg-[#050B14]">
                {chatHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 font-mono">
                    <Terminal className="w-12 h-12 mb-4 opacity-10" />
                    <p className="opacity-40">Awaiting payload injection...</p>
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${
                        msg.role === "user" ? "items-end" : "items-start"
                      } animate-in slide-in-from-bottom-2`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                          msg.role === "user"
                            ? "bg-indigo-600/90 text-white"
                            : msg.model === "BLOCKED"
                            ? "bg-red-950/80 text-red-200 border border-red-500/30"
                            : "bg-slate-800/80 text-slate-200 border border-slate-700"
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.role === "assistant" && (
                        <div className="text-[10px] font-mono text-slate-500 mt-2 ml-2 flex items-center">
                          <span
                            className={`px-2 py-0.5 rounded-sm mr-3 border ${
                              msg.model === "Semantic Cache"
                                ? "bg-emerald-950/50 text-emerald-400 border-emerald-900"
                                : msg.model.includes("Claude")
                                ? "bg-blue-950/50 text-blue-400 border-blue-900"
                                : msg.model.includes("Local")
                                ? "bg-purple-950/50 text-purple-400 border-purple-900"
                                : msg.model === "BLOCKED"
                                ? "bg-red-950/50 text-red-400 border-red-900"
                                : "bg-slate-900 text-slate-400 border-slate-800"
                            }`}
                          >
                            {msg.model}
                          </span>
                          <span>{msg.tokens} tokens</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              <form
                onSubmit={handleManualSubmit}
                className="p-4 bg-slate-900/80 border-t border-slate-800 flex gap-3"
              >
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Type prompt (Try 'Hello' for cache or 'SSN' for PII)..."
                  className="flex-1 bg-[#0A1220] border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  disabled={isProcessing || !prompt.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg flex items-center font-medium shadow-lg"
                >
                  <Send className="w-4 h-4 mr-2" /> Execute
                </button>
              </form>
            </div>

            <div className="bg-[#050B14] rounded-xl border border-slate-800 shadow-xl flex flex-col h-[200px]">
              <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/50 flex items-center text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                <Server className="w-3 h-3 mr-2 text-indigo-400" /> Kernel Logs
              </div>
              <div className="flex-1 overflow-y-auto p-5 font-mono text-[11px] leading-relaxed space-y-2">
                {gatewayLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`flex items-start ${
                      log.type === "error"
                        ? "text-red-400"
                        : log.type === "success"
                        ? "text-emerald-400"
                        : log.type === "warning"
                        ? "text-yellow-400"
                        : "text-slate-400"
                    }`}
                  >
                    <span className="text-slate-600 mr-3 shrink-0">
                      [{log.time}]
                    </span>
                    <span>{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5 flex flex-col">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0A1220]/80 p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group">
                <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center">
                  <DollarSign className="w-3 h-3 mr-1 text-emerald-500" /> Total
                  Savings
                </h4>
                <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 animate-pulse-once">
                  ${totalSaved.toFixed(2)}
                </p>
              </div>
              <div className="bg-[#0A1220]/80 p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group">
                <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center">
                  <Lock className="w-3 h-3 mr-1 text-purple-500" /> PII Blocked
                </h4>
                <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-200">
                  {piiSecured}
                </p>
              </div>
            </div>

            <div className="bg-[#0A1220]/80 p-6 rounded-2xl border border-slate-800 shadow-xl flex-1 flex flex-col min-h-[220px]">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center mb-4">
                <Zap className="w-3.5 h-3.5 mr-2 text-indigo-400" /> Latency
                Telemetry (ms)
              </h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={latencyData}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e293b"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      stroke="#475569"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#475569"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, "auto"]}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#1e293b",
                        borderRadius: "8px",
                        color: "#f8fafc",
                        fontSize: "11px",
                      }}
                    />
                    <Line
                      type="stepAfter"
                      isAnimationActive={true}
                      dataKey="openai"
                      name="Primary/Local"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 3, fill: "#3b82f6" }}
                    />
                    <Line
                      type="monotone"
                      isAnimationActive={true}
                      dataKey="claude"
                      name="Fallback"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#0A1220]/80 p-6 rounded-2xl border border-slate-800 shadow-xl flex-1 flex flex-col min-h-[220px]">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                  <Target className="w-3.5 h-3.5 mr-2 text-emerald-400" />{" "}
                  Request Cost ($)
                </h3>
                <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {totalTokens.toLocaleString()} TKNs
                </span>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={costData}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorOld" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#ef4444"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ef4444"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e293b"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      stroke="#475569"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#475569"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 0.2]}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#1e293b",
                        borderRadius: "8px",
                        color: "#f8fafc",
                        fontSize: "11px",
                      }}
                    />
                    <Area
                      type="monotone"
                      isAnimationActive={true}
                      dataKey="oldCost"
                      name="Direct APIs"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOld)"
                    />
                    <Area
                      type="monotone"
                      isAnimationActive={true}
                      dataKey="newCost"
                      name="Gateway"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorNew)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "architecture" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <div className="bg-[#0A1220] p-8 rounded-2xl border border-slate-700 shadow-xl">
            <Network className="w-10 h-10 text-blue-400 mb-6" />
            <h3 className="font-bold text-white mb-3 text-xl">
              1. Gateway Layer
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              LiteLLM for smart model routing & Kong API for centralized rate
              limiting and token tracking.
            </p>
          </div>
          <div className="bg-[#0A1220] p-8 rounded-2xl border border-slate-700 shadow-xl">
            <LayoutTemplate className="w-10 h-10 text-emerald-400 mb-6" />
            <h3 className="font-bold text-white mb-3 text-xl">
              2. Dev Platform
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Spotify Backstage equipped with Golden Paths to provision
              standardized, secure AI microservices.
            </p>
          </div>
          <div className="bg-[#0A1220] p-8 rounded-2xl border border-slate-700 shadow-xl">
            <Shield className="w-10 h-10 text-purple-400 mb-6" />
            <h3 className="font-bold text-white mb-3 text-xl">
              3. Sovereign Enclave
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Air-gapped Llama-3 models hosted in a secure local VPC to handle
              sensitive PII payloads safely.
            </p>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
          <div className="bg-[#0A1220] p-8 rounded-3xl border border-slate-800 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
              <Calculator className="w-7 h-7 mr-3 text-indigo-400" /> System
              Audit
            </h2>
            <label className="block text-sm text-slate-400 mb-4">
              Monthly Spend:{" "}
              <span className="text-emerald-400 font-bold ml-2 text-lg">
                ${auditSpend.toLocaleString()}
              </span>
            </label>
            <input
              type="range"
              min="1000"
              max="150000"
              step="1000"
              value={auditSpend}
              onChange={(e) => setAuditSpend(Number(e.target.value))}
              className="w-full mb-10 cursor-pointer accent-indigo-500"
            />
            <div className="space-y-4 text-sm font-medium">
              <button
                onClick={() => toggleAuditSetup("noPiiFilter")}
                className="flex items-center w-full text-left p-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700"
              >
                {auditSetup.noPiiFilter ? (
                  <CheckCircle className="text-purple-500 mr-4 w-6 h-6" />
                ) : (
                  <Circle className="text-slate-600 mr-4 w-6 h-6" />
                )}{" "}
                <span
                  className={`ml-2 ${
                    auditSetup.noPiiFilter ? "text-white" : "text-slate-500"
                  }`}
                >
                  No PII Filtering (GDPR Risk)
                </span>
              </button>
              <button
                onClick={() => toggleAuditSetup("directApi")}
                className="flex items-center w-full text-left p-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700"
              >
                {auditSetup.directApi ? (
                  <CheckCircle className="text-red-500 mr-4 w-6 h-6" />
                ) : (
                  <Circle className="text-slate-600 mr-4 w-6 h-6" />
                )}{" "}
                <span
                  className={`ml-2 ${
                    auditSetup.directApi ? "text-white" : "text-slate-500"
                  }`}
                >
                  Decentralized API Keys
                </span>
              </button>
              <button
                onClick={() => toggleAuditSetup("noCache")}
                className="flex items-center w-full text-left p-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700"
              >
                {auditSetup.noCache ? (
                  <CheckCircle className="text-emerald-500 mr-4 w-6 h-6" />
                ) : (
                  <Circle className="text-slate-600 mr-4 w-6 h-6" />
                )}{" "}
                <span
                  className={`ml-2 ${
                    auditSetup.noCache ? "text-white" : "text-slate-500"
                  }`}
                >
                  No Semantic Caching
                </span>
              </button>
            </div>
          </div>
          <div className="bg-[#0A1220] p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-white mb-10 flex justify-between items-center">
              <div className="flex items-center">
                <Target className="w-7 h-7 mr-3 text-emerald-400" /> ROI Report
              </div>
              <span
                className={`px-4 py-1.5 rounded-md text-xs font-bold border ${
                  riskScore > 40
                    ? "bg-red-900/30 text-red-400 border-red-500/50"
                    : "bg-emerald-900/30 text-emerald-400 border-emerald-500/50"
                }`}
              >
                RISK SCORE: {riskScore}/100
              </span>
            </h2>
            <div className="space-y-6">
              <div className="bg-[#050B14] p-8 rounded-2xl border border-slate-700 shadow-inner">
                <p className="text-sm text-slate-500 mb-3 font-bold tracking-widest flex items-center">
                  <TrendingDown className="w-5 h-5 mr-2 text-emerald-500" />{" "}
                  Projected Savings
                </p>
                <p className="text-5xl font-extrabold text-emerald-400">
                  ${potentialSavingsCalc.toLocaleString()}
                </p>
              </div>
              <div className="bg-[#050B14] p-8 rounded-2xl border border-slate-700 shadow-inner">
                <p className="text-sm text-slate-500 mb-3 font-bold tracking-widest">
                  Optimized Run Rate
                </p>
                <p className="text-5xl font-extrabold text-indigo-400">
                  ${newProjectedSpend.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
