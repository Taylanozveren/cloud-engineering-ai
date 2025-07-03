// src/App.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Send, User, Bot } from "lucide-react";
import clsx from "clsx";

// ENV değişkenlerini oku ve kontrol et
const env = {
  REACT_APP_FOUNDRY_ENDPOINT: process.env.REACT_APP_FOUNDRY_ENDPOINT,
  REACT_APP_FOUNDRY_KEY: process.env.REACT_APP_FOUNDRY_KEY,
  REACT_APP_OPENAI_DEPLOYMENT: process.env.REACT_APP_OPENAI_DEPLOYMENT,
  REACT_APP_OPENAI_API_VERSION: process.env.REACT_APP_OPENAI_API_VERSION,
  REACT_APP_AZURE_SEARCH_ENDPOINT: process.env.REACT_APP_AZURE_SEARCH_ENDPOINT,
  REACT_APP_AZURE_SEARCH_KEY: process.env.REACT_APP_AZURE_SEARCH_KEY,
  REACT_APP_AZURE_SEARCH_INDEX: process.env.REACT_APP_AZURE_SEARCH_INDEX
};

// Eksik env var mı kontrol et
const missingEnv = Object.entries(env)
  .filter(([k, v]) => !v)
  .map(([k]) => k);

console.table({
  ...env,
  REACT_APP_FOUNDRY_KEY: env.REACT_APP_FOUNDRY_KEY?.slice(0, 5) + "...",
  REACT_APP_AZURE_SEARCH_KEY: env.REACT_APP_AZURE_SEARCH_KEY?.slice(0, 5) + "..."
});

const MODES = {
  FREE: "Free Chat",
  RAG: "Chat with Your Data (RAG)"
};

// Endpoint doğrulama ve URL builder
const buildUrl = (mode) => {
  let ep = env.REACT_APP_FOUNDRY_ENDPOINT;
  if (!ep) throw new Error("REACT_APP_FOUNDRY_ENDPOINT is undefined");
  if (!ep.endsWith("/")) ep += "/";
  if (!ep.includes("openai")) throw new Error("Endpoint 'openai' içermiyor, muhtemelen yanlış endpoint!");
  const base = `${ep}openai/deployments/${env.REACT_APP_OPENAI_DEPLOYMENT}`;
  const q = `?api-version=${env.REACT_APP_OPENAI_API_VERSION}`;
  return mode === MODES.RAG
    ? `${base}/extensions/chat/completions${q}`
    : `${base}/chat/completions${q}`;
};

export default function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(MODES.FREE);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const ask = async () => {
    setError("");
    const prompt = question.trim();
    if (!prompt) return;
    setQuestion("");
    setMessages((m) => [...m, { role: "user", text: prompt }]);
    setLoading(true);

    let url = "";
    try {
      url = buildUrl(mode);
    } catch (e) {
      setError(e.message);
      setLoading(false);
      return;
    }

    const body = {
      messages: [
        { role: "system", content: "You are a helpful assistant that cites sources." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    };

    if (mode === MODES.RAG) {
      body.data_sources = [
        {
          type: "azure_search",
          parameters: {
            endpoint: env.REACT_APP_AZURE_SEARCH_ENDPOINT,
            index_name: env.REACT_APP_AZURE_SEARCH_INDEX,
            semantic_configuration: "default",
            fields_mapping: {
              content_fields_separator: "\n",
              content_fields: ["content"],
              filepath_field: "filepath",
              title_field: "title",
              url_field: "url",
              vector_fields: []
            },
            in_scope: true,
            top_n_documents: 5,
            authentication: {
              type: "api_key",
              key: env.REACT_APP_AZURE_SEARCH_KEY
            }
          }
        }
      ];
    }

    console.log("[ASK] URL", url);
    console.log("[ASK] Body", body);
    try {
      const { data } = await axios.post(url, body, {
        headers: {
          "Content-Type": "application/json",
          "api-key": env.REACT_APP_FOUNDRY_KEY
        }
      });
      setMessages((m) => [...m, { role: "bot", text: data.choices[0].message.content }]);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      setError(msg);
      setMessages((m) => [...m, { role: "bot", text: `❌ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => (e.key === "Enter" && (e.ctrlKey || e.metaKey)) && ask();

  // UI ── mesaj listesi ve giriş bölümü
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-300">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
      >
        <header className="px-6 py-4 bg-blue-700 text-white text-xl font-bold shadow flex items-center justify-between">
          <span className="flex items-center gap-2"><Bot size={24}/> Mini-RAG Chatbot</span>
          <div className="flex gap-2 items-center bg-white rounded-lg px-2 py-1 shadow border border-blue-200">
            <label htmlFor="mode-select" className="text-sm text-blue-700 font-medium">Mode:</label>
            <select
              id="mode-select"
              value={mode}
              onChange={e => setMode(e.target.value)}
              className="rounded px-2 py-1 text-blue-900 border border-blue-300 focus:ring-2 focus:ring-blue-500 bg-blue-50"
            >
              <option value={MODES.FREE}>{MODES.FREE}</option>
              <option value={MODES.RAG}>{MODES.RAG}</option>
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-slate-50">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx(
                "flex items-end gap-2",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {m.role === "bot" && (
                <div className="flex-shrink-0 bg-slate-200 rounded-full p-2"><Bot size={20} className="text-blue-700"/></div>
              )}
              <div
                className={clsx(
                  "max-w-[75%] p-3 rounded-2xl whitespace-pre-wrap shadow-sm text-base",
                  m.role === "user"
                    ? "bg-blue-600 text-white self-end rounded-br-md"
                    : "bg-white border self-start rounded-bl-md"
                )}
              >
                {m.text}
              </div>
              {m.role === "user" && (
                <div className="flex-shrink-0 bg-blue-600 rounded-full p-2"><User size={20} className="text-white"/></div>
              )}
            </motion.div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Hata ve env uyarısı */}
        {(error || missingEnv.length > 0) && (
          <div className="px-6 pb-2">
            {missingEnv.length > 0 && (
              <div className="bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-lg px-4 py-2 text-sm font-medium shadow mb-2">
                Eksik environment değişkenleri: {missingEnv.join(", ")}
              </div>
            )}
            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg px-4 py-2 text-sm font-medium shadow">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="border-t p-4 bg-white">
          <div className="flex gap-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={onKey}
              placeholder="Type your question…  (Ctrl/⌘+Enter)"
              rows={2}
              className="flex-1 resize-none rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={ask}
              disabled={loading}
              className={clsx(
                "shrink-0 h-10 w-16 rounded-xl flex items-center justify-center text-white text-base font-semibold",
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-700 hover:bg-blue-800"
              )}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
