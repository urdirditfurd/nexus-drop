"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";

const quickReplies = [
  "Où est ma commande ?",
  "Politique de retour",
  "Contact support",
];

export function HelpChat() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; text: string }[]
  >([
    {
      role: "bot",
      text: "Bonjour ! 👋 Comment puis-je vous aider aujourd'hui ?",
    },
  ]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setMessage("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Merci pour votre message ! Un conseiller vous répondra sous 24h. En attendant, consultez notre FAQ ou suivez votre commande dans votre compte.",
        },
      ]);
    }, 800);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 z-50 flex h-[420px] w-[340px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-elevated dark:border-zinc-700 dark:bg-zinc-900 sm:right-6"
          >
            <div className="flex items-center justify-between bg-accent px-4 py-3 text-white">
              <div>
                <p className="text-sm font-semibold">Support NEXUS-DROP</p>
                <p className="text-xs opacity-80">Réponse sous 24h</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-accent text-white"
                        : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-200 p-3 dark:border-zinc-700">
              <div className="mb-2 flex flex-wrap gap-1">
                {quickReplies.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(message);
                }}
                className="flex gap-2"
              >
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Votre message..."
                  className="flex-1 rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent dark:border-zinc-700"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-accent p-2 text-white hover:bg-accent-hover"
                  aria-label="Envoyer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-elevated sm:right-6"
        aria-label="Aide"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>
    </>
  );
}
