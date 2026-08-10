import React, { useState, useEffect, useRef } from 'react';
import { Property, ChatMessage } from '../types';
import { smartReplies } from '../data';
import { Send, Check, ShieldAlert, MessageCircle, Clock, Home } from 'lucide-react';

interface ChatSystemProps {
  properties: Property[];
  activePropertyId: string | null;
  chatMessages: ChatMessage[];
  onSendMessage: (propertyId: string, text: string) => void;
  onSelectPropertyChat: (id: string) => void;
}

export default function ChatSystem({ 
  properties, 
  activePropertyId, 
  chatMessages, 
  onSendMessage,
  onSelectPropertyChat
}: ChatSystemProps) {
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentMessages = chatMessages.filter(m => m.propertyId === activePropertyId);
  const activeProperty = properties.find(p => p.id === activePropertyId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages, isTyping]);

  useEffect(() => {
    if (!activePropertyId || currentMessages.length === 0) return;
    const lastMessage = currentMessages[currentMessages.length - 1];
    if (lastMessage.sender === 'tenant') {
      setIsTyping(true);
      const delayTimer = setTimeout(() => {
        setIsTyping(false);
        const replies = smartReplies[activePropertyId] || smartReplies.default;
        const tenantMsgsCount = currentMessages.filter(m => m.sender === 'tenant').length;
        const selectedReply = replies[(tenantMsgsCount - 1) % replies.length];
        onSendMessage(activePropertyId, selectedReply);
      }, 2000);
      return () => clearTimeout(delayTimer);
    }
  }, [chatMessages, activePropertyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedText.trim() || !activePropertyId) return;
    onSendMessage(activePropertyId, typedText.trim());
    setTypedText('');
  };

  return (
    <div className="bg-white rounded-lg border border-stone-200 shadow-premium overflow-hidden flex h-full" id="chat-system-root">
      {/* Sidebar - active conversations lists */}
      <div className="w-80 border-r border-stone-200 bg-stone-50 flex flex-col hidden lg:flex" id="chat-users-list">
        <div className="p-6 border-b border-stone-200 bg-white">
          <h3 className="font-bold text-lg font-display text-ink uppercase tracking-wide">Messages</h3>
          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest font-mono mt-1">Direct Channels</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-none">
          {properties.map((p, idx) => {
            const hasMsgs = chatMessages.some(m => m.propertyId === p.id);
            const isSelected = activePropertyId === p.id;
            
            return (
              <button
                key={idx}
                onClick={() => onSelectPropertyChat(p.id)}
                className={`w-full text-left p-3 rounded-sm transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected 
                    ? 'bg-ink text-white border border-stone-850 shadow-sm' 
                    : 'hover:bg-stone-100 text-stone-700'
                }`}
              >
                <div className="relative">
                  <img referrerPolicy="no-referrer" src={p.ownerAvatar} alt="" className="w-10 h-10 rounded-sm object-cover shrink-0 border border-white/10" />
                  {hasMsgs && !isSelected && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-sage border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`font-bold text-xs uppercase font-display tracking-wide truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>{p.ownerName}</p>
                    <span className={`text-[9px] font-bold font-mono ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>12:45</span>
                  </div>
                  <p className={`text-[11px] truncate font-medium ${isSelected ? 'text-stone-300/90' : 'text-stone-500'}`}>{p.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main chat details viewport container */}
      <div className="flex-1 flex flex-col h-full bg-parchment/20" id="chat-main-view">
        {activeProperty ? (
          <>
            {/* Header info bar */}
            <div className="bg-white p-5 border-b border-stone-200 flex items-center justify-between shrink-0 z-10 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    referrerPolicy="no-referrer"
                    src={activeProperty.ownerAvatar} 
                    alt={activeProperty.ownerName} 
                    className="w-10 h-10 rounded-sm object-cover border border-stone-200 shadow-sm"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-sage border border-white rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm font-display text-ink uppercase tracking-wide">{activeProperty.ownerName}</h4>
                    <span className="bg-parchment text-ink border border-stone-250 text-[9px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-sm">
                      Verified Owner
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-medium tracking-tight">
                    Discussing: {activeProperty.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-ink">₹{activeProperty.price.toLocaleString('en-IN')}</p>
                  <p className="text-[8px] font-mono tracking-widest text-stone-400 uppercase">No Broker Fee</p>
                </div>
                <div className="h-8 w-px bg-stone-250 hidden sm:block" />
                <button className="p-2.5 rounded-sm bg-stone-100 border border-stone-200 text-stone-400 hover:text-stone-950 hover:bg-stone-150 transition-colors cursor-pointer">
                  <ShieldAlert className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Chat message bubbles list scroller */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none" ref={scrollRef} id="chat-messages-container">
              {currentMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center" id="chat-empty-state">
                  <div className="w-14 h-14 bg-stone-50 border border-stone-200 rounded-sm flex items-center justify-center mb-4">
                    <MessageCircle className="w-6 h-6 text-stone-400" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-sm font-bold font-display uppercase tracking-wide text-ink">Start the Handover</h4>
                  <p className="text-xs text-stone-500 mt-2 max-w-[280px] font-medium leading-relaxed">
                    Say hello to {activeProperty.ownerName} to begin your direct rental negotiation.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-6">
                    <div className="px-3 py-1 bg-stone-100 border border-stone-200 rounded-sm text-[8px] font-bold text-stone-500 uppercase tracking-widest font-mono">
                      Today
                    </div>
                  </div>
                  {currentMessages.map((msg, idx) => {
                    const isTenant = msg.sender === 'tenant';
                    return (
                      <div 
                        key={idx} 
                        className={`flex ${isTenant ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] space-y-1 ${isTenant ? 'items-end' : 'items-start'}`}>
                          <div className={`rounded-sm px-4 py-3 text-xs font-medium border shadow-sm transition-all hover:shadow-md ${
                            isTenant 
                              ? 'bg-ink text-white border-stone-850 rounded-br-none' 
                              : 'bg-white text-ink border-stone-200 rounded-bl-none'
                          }`}>
                            <p className="leading-relaxed">{msg.text}</p>
                          </div>
                          <div className={`flex items-center gap-1 text-[9px] font-bold font-mono text-stone-400 ${isTenant ? 'justify-end' : 'justify-start'}`}>
                            <span>{msg.timestamp}</span>
                            {isTenant && <Check className="w-3 h-3 text-sage" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-stone-200 rounded-sm px-4 py-3 rounded-bl-none text-stone-400 flex items-center gap-2 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                      <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Typing input footer */}
            <div className="p-4 bg-white border-t border-stone-200">
              <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
                <div className="relative flex-1 group">
                  <input
                    type="text"
                    value={typedText}
                    onChange={(e) => setTypedText(e.target.value)}
                    placeholder={`Message ${activeProperty.ownerName}...`}
                    className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-3 text-xs font-medium focus:border-terracotta focus:bg-white focus:outline-none transition-all placeholder:text-stone-300"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!typedText.trim()}
                  className="bg-terracotta hover:bg-terracotta/95 text-white w-10 h-10 rounded-sm flex items-center justify-center transition-all shadow-md active:scale-95 disabled:bg-stone-150 disabled:text-stone-300 disabled:shadow-none cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-14 h-14 bg-stone-50 border border-stone-200 rounded-sm flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-stone-400" strokeWidth={1.5} />
            </div>
            <h4 className="text-sm font-bold font-display uppercase tracking-wide text-ink">Direct Negotiation Panel</h4>
            <p className="text-xs text-stone-500 mt-2 max-w-[280px] font-medium leading-relaxed">
              Select an owner to start a secure, direct-to-landlord conversation without broker overhead.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
