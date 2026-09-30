// frontend/src/components/widget/ChatWidget.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  Headphones,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import {
  api,
  type Message,
  type ConversationStatus,
  type Category,
  type SendMessageResponse,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


export interface ChatWidgetProps {
  userExternalId?: string;
  className?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  userExternalId = 'client-demo-1',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConversationStatus>('BOT');
  const [category, setCategory] = useState<Category | null>(null);
  const [messages, setMessages] = useState<Array<Message & { sources?: any[] }>>([
    {
      id: 'welcome',
      conversationId: '',
      role: 'ASSISTANT',
      content:
        'Bonjour ! Comment pouvons-nous vous aider aujourd’hui ?',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Active polling to check if an agent took over or resolved the conversation
  useEffect(() => {
    if (!conversationId || !isOpen) return;

    const interval = setInterval(async () => {
      try {
        const conv = await api.getConversationById(conversationId);
        if (conv) {
          if (conv.status !== status) {
            setStatus(conv.status);
          }
          if (conv.category !== category && conv.category) {
            setCategory(conv.category);
          }
          if (conv.messages && conv.messages.length > messages.length) {
            setMessages(conv.messages);
          }
        }
      } catch (err) {
        // Silent poll error
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [conversationId, isOpen, status, category, messages.length]);

  const handleSend = async (forcedText?: string, requestHuman: boolean = false) => {
    const textToSend = (forcedText || input).trim();
    if (!textToSend || loading) return;

    setInput('');
    const userMsgId = 'usr_' + Date.now();
    const tempUserMsg: Message = {
      id: userMsgId,
      conversationId: conversationId || '',
      role: 'USER',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res: SendMessageResponse = await api.sendMessage(
        textToSend,
        conversationId || undefined,
        userExternalId,
        requestHuman
      );

      if (res.conversationId) {
        setConversationId(res.conversationId);
      }
      if (res.status) {
        setStatus(res.status);
      }
      if (res.category) {
        setCategory(res.category);
      }

      // Add assistant response if returned
      if (res.reply) {
        const assistantMsg: Message & { sources?: any[] } = {
          id: 'asst_' + Date.now(),
          conversationId: res.conversationId,
          role: res.status === 'HUMAN_ACTIVE' ? 'ASSISTANT' : 'ASSISTANT',
          content: res.reply,
          sources: res.sources,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          conversationId: conversationId || '',
          role: 'SYSTEM',
          content: `⚠️ Erreur : ${err.message || 'Impossible de joindre le serveur'}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSource = (msgId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  return (
    <div className={cn('fixed bottom-6 right-6 z-50 font-sans', className)}>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 transition-all duration-200 active:scale-[0.97] cursor-pointer"
          aria-label="Ouvrir le support"
        >
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[var(--surface)] shadow-xs"></span>
          </span>
          <MessageSquare className="h-6 w-6 transition-transform group-hover:scale-105" />
        </button>
      )}

      {/* Main Chat Window */}
      {isOpen && (
        <div className="flex flex-col w-[380px] sm:w-[420px] h-[600px] max-h-[85vh] rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-hover)] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-500 border border-indigo-500/20">
                {status === 'HUMAN_ACTIVE' ? (
                  <Headphones className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Bot className="h-5 w-5 text-indigo-500" />
                )}
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)]',
                    status === 'HUMAN_ACTIVE'
                      ? 'bg-emerald-500'
                      : status === 'PENDING_HUMAN'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  )}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                    Support Client
                  </span>
                  {category && (
                    <Badge variant={category.toLowerCase() as any}>
                      {category}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-[var(--text-secondary)]">
                  {status === 'HUMAN_ACTIVE'
                    ? 'Conseiller en ligne'
                    : status === 'PENDING_HUMAN'
                    ? 'Mise en relation...'
                    : 'Support automatisé'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {status === 'BOT' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend('Je souhaite parler à un conseiller', true)}
                  className="text-xs h-7 px-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                >
                  <Headphones className="h-3.5 w-3.5 mr-1" />
                  Humain
                </Button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-active)] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Pending Human Banner */}
          {status === 'PENDING_HUMAN' && (
            <div className="flex items-center gap-2 bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0 animate-pulse text-amber-400" />
              <span>Votre demande est en file d’attente. Un conseiller prend le relais sous peu.</span>
            </div>
          )}

          {/* Human Active Banner */}
          {status === 'HUMAN_ACTIVE' && (
            <div className="flex items-center gap-2 bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-300">
              <Headphones className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Un conseiller support a rejoint la conversation. Le bot est désactivé.</span>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'USER';
              const isSystem = msg.role === 'SYSTEM';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--surface-hover)] px-2.5 py-1 rounded-full border border-[var(--border-subtle)]">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-xs whitespace-pre-wrap leading-relaxed',
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-bl-xs'
                    )}
                  >
                    {msg.content}

                    {/* Documentation Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)]">
                        <button
                          onClick={() => toggleSource(msg.id)}
                          className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium cursor-pointer"
                        >
                          <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                          <span>
                            {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''} officielle{msg.sources.length > 1 ? 's' : ''}
                          </span>
                          {expandedSources[msg.id] ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>

                        {expandedSources[msg.id] && (
                          <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
                            {msg.sources.map((src, idx) => (
                              <div
                                key={idx}
                                className="rounded-lg bg-[var(--surface)] p-2.5 text-xs border border-[var(--border-subtle)]"
                              >
                                <div className="font-medium text-[var(--text-primary)]">
                                  {src.documentTitle}
                                </div>
                                {src.chunkContent && (
                                  <p className="mt-1 text-[11px] text-[var(--text-secondary)] leading-relaxed">
                                    {src.chunkContent}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <span className="mt-1 text-[10px] text-[var(--text-muted)] font-mono px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-[var(--surface-hover)] text-[var(--text-secondary)] w-fit border border-[var(--border-subtle)] rounded-bl-xs">
                <span className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-[var(--text-muted)] animate-bounce" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions pills */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-[var(--border-subtle)] bg-[var(--surface)]">
              {[
                'Conditions de retour ?',
                'Signaler un problème',
                'Parler à un conseiller',
              ].map((pill, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(pill, pill.includes('conseiller'))}
                  className="rounded-full bg-[var(--surface-hover)] border border-[var(--border-subtle)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-indigo-500/50 transition-colors cursor-pointer"
                >
                  {pill}
                </button>
              ))}
            </div>
          )}

          {/* Footer Input */}
          <div className="border-t border-[var(--border-subtle)] bg-[var(--surface)] p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  status === 'PENDING_HUMAN'
                    ? 'Ajouter un message pour le conseiller...'
                    : 'Posez votre question...'
                }
                disabled={loading || status === 'CLOSED'}
                className="flex-1 bg-[var(--surface-hover)] border border-[var(--border-strong)] rounded-xl px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || loading || status === 'CLOSED'}
                className="h-9 w-9 rounded-xl shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-[var(--text-muted)]">
              <span>Propulsé par Assistant-IA (RAG + pgvector)</span>
              <span>Session: {userExternalId}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
