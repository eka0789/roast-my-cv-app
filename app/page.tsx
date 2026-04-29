"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Send, RefreshCw, Lightbulb, AlertCircle, Settings, Key, Cpu, FileUp, X } from "lucide-react";

type Status = "idle" | "loading" | "done" | "error";

interface RoastResult {
  roast: string;
  suggestions: string;
}

const LOADING_MESSAGES = [
  "AI is judging your life choices...",
  "Analyzing your questionable career decisions...",
  "Consulting the roast committee...",
  "Reading between the lines (and wincing)...",
  "Finding diplomatic ways to say this...",
  "Preparing constructive criticism with extra spice...",
];

const PROVIDERS = {
  gemini: {
    name: "Gemini",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  },
  claude: {
    name: "Claude",
    models: ["claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
  },
  openrouter: {
    name: "OpenRouter",
    models: ["meta-llama/llama-3.1-405b-instruct", "meta-llama/llama-3.1-70b-instruct", "anthropic/claude-3.5-sonnet"],
  },
};

export default function Home() {
  const [cvText, setCvText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<RoastResult | null>(null);
  const [error, setError] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseStatus, setParseStatus] = useState<"idle" | "parsing" | "done" | "error">("idle");
  const [parseError, setParseError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings state
  const [provider, setProvider] = useState("gemini");
  const [model, setModel] = useState("gemini-2.0-flash");
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedProvider = localStorage.getItem("roast-cv-provider");
    const savedModel = localStorage.getItem("roast-cv-model");
    const savedKey = localStorage.getItem("roast-cv-key");

    if (savedProvider) setProvider(savedProvider);
    if (savedModel) setModel(savedModel);
    if (savedKey) setApiKey(savedKey);
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("roast-cv-provider", provider);
    localStorage.setItem("roast-cv-model", model);
    localStorage.setItem("roast-cv-key", apiKey);
  }, [provider, model, apiKey]);

  const handleSubmit = async () => {
    if (cvText.trim().length < 50) return;

    setStatus("loading");
    setResult(null);
    setError("");

    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIndex]);
    }, 2500);

    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cvText,
          provider,
          model,
          apiKey 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to roast your CV"
      );
      setStatus("error");
    } finally {
      clearInterval(msgInterval);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setParseStatus("parsing");
    setParseError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse-file", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse file");
      setCvText(data.text);
      setParseStatus("done");
    } catch (err) {
      setParseStatus("error");
      setParseError(err instanceof Error ? err.message : "Failed to parse file");
      setUploadedFile(null);
    }

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearFile = () => {
    setUploadedFile(null);
    setParseStatus("idle");
    setParseError("");
    setCvText("");
  };

  const handleReset = () => {
    setStatus("idle");
    setResult(null);
    setError("");
    setCvText("");
    setUploadedFile(null);
    setParseStatus("idle");
    setParseError("");
  };

  const isInputShown = status === "idle" || status === "error";

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="fixed inset-0 bg-gradient-to-br from-orange-950/20 via-transparent to-red-950/10 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Flame className="w-10 h-10 text-orange-500" />
            <h1 className="text-5xl font-bold tracking-tight">
              Roast My <span className="text-orange-500">CV</span>
            </h1>
            <Flame className="w-10 h-10 text-orange-500" />
          </div>
          <p className="text-zinc-400 text-lg">
            Paste your CV and let AI tear it apart — then help you fix it.
          </p>

          <div className="mt-8 flex flex-col items-center">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 text-zinc-500 hover:text-orange-400 transition-colors text-sm font-medium"
            >
              <Settings className={`w-4 h-4 ${showSettings ? 'rotate-90' : ''} transition-transform`} />
              AI Settings {apiKey ? "(Key Set)" : "(Add API Key)"}
            </button>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden w-full max-w-md text-left"
                >
                  <div className="pt-6 pb-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">Provider</label>
                        <div className="relative">
                          <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <select
                            value={provider}
                            onChange={(e) => {
                              const newProvider = e.target.value as keyof typeof PROVIDERS;
                              setProvider(newProvider);
                              setModel(PROVIDERS[newProvider].models[0]);
                            }}
                            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-orange-500/50 appearance-none text-zinc-300"
                          >
                            {Object.entries(PROVIDERS).map(([id, p]) => (
                              <option key={id} value={id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">Model</label>
                        <div className="relative">
                          <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-orange-500/50 appearance-none text-zinc-300"
                          >
                            {PROVIDERS[provider as keyof typeof PROVIDERS].models.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">API Key</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={`${PROVIDERS[provider as keyof typeof PROVIDERS].name} API Key...`}
                          className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-orange-500/50 text-zinc-300 placeholder:text-zinc-700"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-600 ml-1">
                        Your key is only used for this session and never stored on the server.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        <AnimatePresence mode="wait">
          {/* Input / Error State */}
          {isInputShown && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-400"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}

              {/* File Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {uploadedFile && parseStatus === "done" ? (
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-900 border border-orange-500/30 text-sm">
                    <div className="flex items-center gap-2 text-zinc-400 truncate">
                      <FileUp className="w-4 h-4 text-orange-400 shrink-0" />
                      <span className="truncate">{uploadedFile.name}</span>
                      <span className="text-zinc-600 shrink-0">· {cvText.length} chars</span>
                    </div>
                    <button onClick={clearFile} className="ml-2 text-zinc-600 hover:text-zinc-400 transition-colors shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={parseStatus === "parsing"}
                    className="w-full py-3 rounded-xl border border-dashed border-zinc-700 hover:border-orange-500/40 text-zinc-500 hover:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <FileUp className="w-4 h-4" />
                    {parseStatus === "parsing" ? "Extracting text…" : "Upload PDF or DOCX"}
                  </button>
                )}
                {parseStatus === "error" && (
                  <p className="mt-1.5 text-xs text-red-400 text-center">{parseError}</p>
                )}
                {parseStatus !== "done" && (
                  <p className="mt-1.5 text-center text-zinc-700 text-xs">or paste below</p>
                )}
              </div>

              <div className="relative">
                <textarea
                  value={cvText}
                  onChange={(e) => { setCvText(e.target.value); if (uploadedFile) setUploadedFile(null); }}
                  placeholder="Paste your CV content here — work experience, skills, education, objective statement... all of it."
                  className="w-full h-72 p-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-colors text-sm leading-relaxed"
                />
                <span className="absolute bottom-4 right-4 text-xs text-zinc-700">
                  {cvText.length} chars
                </span>
              </div>

              <motion.button
                onClick={handleSubmit}
                disabled={cvText.trim().length < 50}
                whileHover={{ scale: cvText.trim().length >= 50 ? 1.02 : 1 }}
                whileTap={{ scale: cvText.trim().length >= 50 ? 0.98 : 1 }}
                className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed font-semibold text-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Flame className="w-5 h-5" />
                Roast My CV
                <Send className="w-5 h-5" />
              </motion.button>

              {cvText.trim().length > 0 && cvText.trim().length < 50 && (
                <p className="text-center text-zinc-600 text-xs">
                  Need at least 50 characters
                </p>
              )}
            </motion.div>
          )}

          {/* Loading State */}
          {status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-28 gap-8"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin" />
                <Flame className="absolute inset-0 m-auto w-7 h-7 text-orange-500" />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingMsg}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-zinc-400 text-center text-lg max-w-sm"
                >
                  {loadingMsg}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}

          {/* Result State */}
          {status === "done" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-2xl bg-zinc-900 border border-orange-900/40"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <h2 className="font-semibold text-orange-400">The Roast</h2>
                </div>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm">
                  {result.roast}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl bg-zinc-900 border border-emerald-900/40"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-emerald-400" />
                  <h2 className="font-semibold text-emerald-400">
                    How to Fix It
                  </h2>
                </div>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm">
                  {result.suggestions}
                </p>
              </motion.div>

              <motion.button
                onClick={handleReset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-2xl border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Roast Another CV
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
