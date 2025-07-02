// src/App.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Send, User, Bot } from "lucide-react";
import clsx from "clsx";

const {
  REACT_APP_OPENAI_KEY,
  REACT_APP_SEARCH_KEY,
  REACT_APP_CHAT_ENDPOINT,
  REACT_APP_SEARCH_ENDPOINT,
  REACT_APP_DEPLOYMENT = "gpt-4o-mini",
  REACT_APP_API_VERSION = "2025-01-01-preview"
} = process.env;

const MODES = {
  FREE: "Free Chat",
  RAG: "Chat with Your Data (RAG)"
};

const buildUrl = (mode) => {
  let endpoint = REACT_APP_CHAT_ENDPOINT;
  if (endpoint && !endpoint.endsWith("/")) endpoint += "/";
  if (mode === MODES.RAG) {
    return `${endpoint}openai/deployments/${REACT_APP_DEPLOYMENT}/extensions/chat/completions?api-version=${REACT_APP_API_VERSION}`;
  }
  return `${endpoint}openai/deployments/${REACT_APP_DEPLOYMENT}/chat/completions?api-version=${REACT_APP_API_VERSION}`;
};

export default function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(MODES.FREE);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ask = async () => {
    setError("");
    const prompt = question.trim();
    if (!prompt) return;
    setQuestion("");
    setMessages((m) => [...m, { role: "user", text: prompt }]);
    setLoading(true);

    const url = buildUrl(mode);
    let requestBody = {
      messages: [
        { role: "system", content: "You are a helpful assistant that cites sources." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    };
    if (mode === MODES.RAG) {
      requestBody.dataSources = [
        {
          type: "AzureCognitiveSearch",
          parameters: {
            endpoint: REACT_APP_SEARCH_ENDPOINT,
            key: REACT_APP_SEARCH_KEY,
            indexName: "idx-minirag",
            topNDocuments: 5
          }
        }
      ];
    }
    try {
      const { data } = await axios.post(
        url,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": REACT_APP_OPENAI_KEY
          }
        }
      );
      const content = data.choices[0].message.content;
      setMessages((m) => [...m, { role: "bot", text: content }]);
    } catch (err) {
      setError(`Error: ${err.message}\n${err.response?.data?.error?.message || ""}`);
      setMessages((m) => [
        ...m,
        { role: "bot", text: `❌ ${err.response?.data?.error?.message || err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) ask();
  };

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

        {error && (
          <div className="px-6 pb-2">
            <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg px-4 py-2 text-sm font-medium shadow">
              {error}
            </div>
          </div>
        )}

        <div className="border-t p-4 bg-white">
          <div className="flex gap-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKey}
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
