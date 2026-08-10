import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Property } from '../types';
import { Send, Sparkles, Bot, User, Trash2, HelpCircle, ArrowRight, ShieldCheck, Loader2, MapPin } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  groundingMetadata?: any;
}

interface GuruChatBotProps {
  properties: Property[];
}

const QUICK_SUGGESTIONS = [
  {
    label: "Mylapore Deposits",
    prompt: "What are the typical rent pricing levels and security deposit expectations in Mylapore? Can I negotiate them down?",
    icon: "🏦"
  },
  {
    label: "Bypassing Broker Fees",
    prompt: "How much actual money can I save in Chennai by bypassing typical real estate brokers on NestDirect? Can you break down the upfront costs?",
    icon: "💰"
  },
  {
    label: "Agreement Draft",
    prompt: "Can you help me draft a friendly but professional lease agreement message to property owners in Adyar?",
    icon: "📝"
  },
  {
    label: "Adyar to OMR Commute",
    prompt: "Help me compare the commute from OMR vs Mylapore to the IIT Madras Research Park. Which is better for public transit?",
    icon: "🚴"
  }
];

export default function GuruChatBot({ properties }: GuruChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('nestdirect_guru_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'guru-init',
        role: 'assistant',
        text: "Vanakkam! I am your **NestDirect Guru**, your direct rental guide for **Chennai**. \n\nAsk me anything about Chennai neighborhoods (Adyar, OMR, Velachery, Mylapore), negotiating rental security deposits, drafting tenant agreements, or successfully bypassing huge brokerage fees!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    localStorage.setItem('nestdirect_guru_chat_history', JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    const promptText = textToSend.trim();
    if (!promptText || isLoading) return;
    setApiError(null);
    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: promptText,
          inventory: properties.map(p => ({
            title: p.title,
            price: p.price,
            city: p.city,
            bedrooms: p.bedrooms,
            type: p.type,
            id: p.id
          })),
          history: messages.map(m => ({
            role: m.role,
            text: m.text
          }))
        })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }
      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `msg-guru-${Date.now()}`,
        role: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingMetadata: data.groundingMetadata
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("Guru chat request failed:", err);
      setApiError(err.message || "Failed to contact NestDirect Guru. Make sure your server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to reset your conversation with NestDirect Guru?")) {
      const resetMsg: ChatMessage[] = [
        {
          id: 'guru-init',
          role: 'assistant',
          text: "Vanakkam! Let's start fresh. I am your NestDirect Guru. Ask me any direct rental questions or choose one of the suggestions below!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(resetMsg);
      setApiError(null);
    }
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.slice(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="text-slate-900 font-bold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
      }
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        return (
          <li key={idx} className="ml-5 list-disc text-slate-600 mb-2 leading-relaxed text-sm font-medium">
            {parts.length > 0 ? parts : line.slice(2)}
          </li>
        );
      }
      return (
        <p key={idx} className="mb-3 leading-relaxed text-sm text-slate-600 font-medium">
          {parts.length > 0 ? parts : line}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden" id="guru-ai-container">
      {/* Header */}
      <div className="px-10 py-8 bg-white border-b border-slate-100 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-terracotta/10 rounded-lg flex items-center justify-center relative">
            <Bot className="w-8 h-8 text-terracotta" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">NestDirect Guru</h3>
              <span className="text-[10px] font-black text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full border border-terracotta/20 uppercase tracking-widest">
                AI Agent
              </span>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Direct Rental Authority • Chennai</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="w-12 h-12 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center cursor-pointer"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Chat messages */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide"
        id="guru-messages-scroller"
      >
        <div className="max-w-3xl mx-auto space-y-8">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                id={`guru-item-${msg.id}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-white border border-slate-100 text-slate-400'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>

                <div className={`space-y-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-6 rounded-3xl shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-terracotta text-white rounded-tr-none shadow-terracotta/20'
                      : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none'
                  }`}>
                    <div className="text-sm font-medium leading-relaxed">
                      {msg.role === 'assistant' ? formatText(msg.text) : <p>{msg.text}</p>}
                    </div>

                    {msg.role === 'assistant' && msg.groundingMetadata?.groundingChunks && msg.groundingMetadata.groundingChunks.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200/50 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-terracotta animate-pulse" />
                          Verified Google Maps & Search References
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {msg.groundingMetadata.groundingChunks.map((chunk: any, chunkIdx: number) => {
                            const isMaps = !!chunk.maps;
                            const info = chunk.maps || chunk.web;
                            if (!info) return null;
                            return (
                              <a
                                key={chunkIdx}
                                href={info.uri}
                                target="_blank"
                                referrerPolicy="no-referrer"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-terracotta/10 text-slate-600 hover:text-terracotta rounded-lg text-[11px] font-bold border border-slate-200/50 hover:border-terracotta/20 shadow-sm transition-all cursor-pointer"
                              >
                                {isMaps ? (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-terracotta" />
                                )}
                                {info.title || 'View Google Maps Link'}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className={`text-[10px] font-bold text-slate-300 px-2 uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {msg.timestamp}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
              id="guru-writing-loader"
            >
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 text-slate-400 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl rounded-tl-none flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Guru is thinking</span>
              </div>
            </motion.div>
          )}

          {apiError && (
            <div className="p-6 rounded-3xl bg-red-50 border border-red-100 text-red-500 text-sm flex gap-4 items-start max-w-xl mx-auto">
              <HelpCircle className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold text-slate-900 mb-1">Guru is currently offline</p>
                <p className="text-xs text-slate-500 leading-relaxed translate-y-px">{apiError}</p>
                <button
                  onClick={() => handleSendMessage(messages[messages.length - 1]?.text || "Hello")}
                  className="mt-3 text-[10px] font-black text-red-600 hover:underline uppercase tracking-widest cursor-pointer"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {messages.length === 1 && !isLoading && (
        <div className="px-10 pb-8 bg-white z-10">
          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Instant Queries</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(sug.prompt)}
                  className="flex items-center justify-between p-5 bg-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 border border-slate-100 rounded-3xl text-left cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl group-hover:scale-125 transition-transform">{sug.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{sug.label}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">{sug.prompt}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-terracotta transform translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-10 bg-white border-t border-slate-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputMessage);
          }}
          className="max-w-3xl mx-auto flex gap-4 items-center"
        >
          <div className="flex-1 relative group">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about Chennai rentals, agreements, or neighborhoods..."
              disabled={isLoading}
              className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 text-sm font-medium focus:ring-4 focus:ring-terracotta/5 focus:bg-white focus:outline-none transition-all placeholder:text-slate-300"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase hidden lg:block">↵ Enter</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="w-16 h-16 bg-slate-900 hover:bg-black text-white rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none cursor-pointer"
            title="Ask Guru"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="px-10 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-terracotta" />
          Chennai Grounding Active
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          NestDirect P2P Neural Engine
        </div>
      </div>
    </div>
  );
}
