import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  User,
  Bot,
  CheckCircle,
  RotateCcw,
  Send,
  AlertCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  api,
  type Conversation,
  type ConversationStatus,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const STATUS_DOT: Record<string, string> = {
  PENDING_HUMAN: 'bg-amber-400',
  HUMAN_ACTIVE: 'bg-emerald-400',
  BOT: 'bg-indigo-400',
  CLOSED: 'bg-[var(--text-muted)]',
};

export const InboxView: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [counselorReply, setCounselorReply] = useState('');
  const [_loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Poll conversations every 3 seconds
  useEffect(() => {
    let isMounted = true;

    const fetchQueue = async () => {
      try {
        const filter = statusFilter === 'ALL' ? undefined : (statusFilter as ConversationStatus);
        const list = await api.getConversations(filter);
        if (isMounted) {
          setConversations(list);
          if (!selectedId && list.length > 0) {
            setSelectedId(list[0].id);
          }
        }
      } catch (err) {
        // Silent poll error
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [statusFilter, selectedId]);

  // Fetch full conversation history when selected
  useEffect(() => {
    if (!selectedId) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const detail = await api.getConversationById(selectedId);
        setActiveConversation(detail);
      } catch (err) {
        console.error('Error fetching conversation detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    // Poll active conversation every 3s
    const detailInterval = setInterval(fetchDetail, 3000);
    return () => clearInterval(detailInterval);
  }, [selectedId]);

  // Handle Counselor 1-Click Takeover
  const handleTakeOver = async () => {
    if (!selectedId || actionLoading) return;
    try {
      setActionLoading(true);
      await api.takeOver(selectedId, 'Sarah (Support)');
      const updated = await api.getConversationById(selectedId);
      setActiveConversation(updated);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la prise en main');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Counselor Message Send
  const handleSendAgentMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedId || !counselorReply.trim() || actionLoading) return;

    try {
      setActionLoading(true);
      await api.sendAgentMessage(selectedId, counselorReply.trim());
      setCounselorReply('');
      const updated = await api.getConversationById(selectedId);
      setActiveConversation(updated);
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'envoi");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Resolve (Closed or Return to Bot)
  const handleResolve = async (returnToBot: boolean) => {
    if (!selectedId || actionLoading) return;
    try {
      setActionLoading(true);
      await api.resolveConversation(selectedId, returnToBot);
      const updated = await api.getConversationById(selectedId);
      setActiveConversation(updated);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la resolution');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = c.id.toLowerCase().includes(q);
      const matchUser = c.userExternalId?.toLowerCase().includes(q);
      const matchCategory = c.category?.toLowerCase().includes(q);
      return matchId || matchUser || matchCategory;
    }
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-65px)] overflow-hidden font-sans">
      {/* COLUMN 1: Triage Queue */}
      <div className="w-[340px] shrink-0 border-r border-[var(--border-subtle)] bg-[var(--surface)] flex flex-col">
        <div className="p-3 border-b border-[var(--border-subtle)] space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
              File de Triage
            </h2>
            <Badge variant="secondary" className="font-mono text-[11px]">
              {filteredConversations.length} fil(s)
            </Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
            <Input
              type="text"
              placeholder="Rechercher utilisateur, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-[var(--surface-hover)]"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              { id: 'ALL', label: 'Tous' },
              { id: 'PENDING_HUMAN', label: 'En attente', alert: true },
              { id: 'HUMAN_ACTIVE', label: 'En direct' },
              { id: 'BOT', label: 'IA Bot' },
              { id: 'CLOSED', label: 'Fermes' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer select-none',
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                  tab.alert && statusFilter !== tab.id && 'text-amber-400 font-semibold'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)]">
              Aucune conversation dans cette vue.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedId;
              const isPending = conv.status === 'PENDING_HUMAN';
              const lastMsg =
                conv.messages?.[conv.messages.length - 1]?.content || 'Nouvelle conversation';
              const dotColor = STATUS_DOT[conv.status] ?? 'bg-[var(--text-muted)]';

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setSelectedId(conv.id);
                    setActiveConversation(null);
                  }}
                  className={cn(
                    'py-2 px-3 cursor-pointer transition-colors relative hover:bg-[var(--surface-hover)]',
                    isSelected ? 'bg-[var(--surface-active)]' : '',
                    isPending ? 'border-l-4 border-l-amber-500 bg-amber-500/5' : ''
                  )}
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColor)} />
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {conv.userExternalId || `Client #${conv.id.substring(0, 6)}`}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                      {new Date(conv.updatedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-[var(--text-muted)] truncate flex-1">
                      {lastMsg}
                    </p>
                    {conv.category && (
                      <Badge
                        variant={conv.category.toLowerCase() as any}
                        className="shrink-0 text-[10px] px-1.5 py-0"
                      >
                        {conv.category}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* COLUMN 2: Active Conversation */}
      <div className="flex-1 flex flex-col bg-[var(--canvas)] overflow-hidden">
        {activeConversation ? (
          <>
            <div className="h-16 border-b border-[var(--border-subtle)] bg-[var(--surface)] px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-600/15 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {activeConversation.userExternalId || 'Client'}
                  </h3>
                  <Badge variant={activeConversation.status.toLowerCase() as any}>
                    {activeConversation.status}
                  </Badge>
                  {activeConversation.category && (
                    <Badge variant={activeConversation.category.toLowerCase() as any}>
                      {activeConversation.category}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeConversation.status === 'PENDING_HUMAN' && (
                  <Button
                    onClick={handleTakeOver}
                    disabled={actionLoading}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs h-8"
                  >
                    <Zap className="h-3.5 w-3.5 mr-1" />
                    Prendre la main (Handoff)
                  </Button>
                )}

                {activeConversation.status === 'HUMAN_ACTIVE' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(true)}
                      disabled={actionLoading}
                      className="text-xs h-8 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Retransferer au Bot
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(false)}
                      disabled={actionLoading}
                      className="text-xs h-8 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Cloturer et Resoudre
                    </Button>
                  </>
                )}

                {activeConversation.status === 'CLOSED' && (
                  <Badge variant="closed" className="text-xs px-3 py-1">
                    Ticket Resolu
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeConversation.messages
                ?.slice()
                .sort(
                  (a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                )
                .map((msg) => {
                  const isUser = msg.role === 'USER';
                  const isSystem = msg.role === 'SYSTEM';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-3">
                        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex flex-col',
                        isUser ? 'items-start' : 'items-end'
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-[var(--text-muted)] font-mono">
                        {isUser ? (
                          <>
                            <User className="h-3 w-3" />
                            <span>Client ({activeConversation.userExternalId})</span>
                          </>
                        ) : (
                          <>
                            <Bot className="h-3 w-3 text-indigo-400" />
                            <span>
                              {activeConversation.status === 'HUMAN_ACTIVE'
                                ? 'Conseiller Sarah'
                                : 'Assistant IA (RAG)'}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl p-4 text-sm whitespace-pre-wrap leading-relaxed shadow-xs',
                          isUser
                            ? 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-tl-xs'
                            : 'bg-indigo-600 text-white rounded-tr-xs'
                        )}
                      >
                        {msg.content}
                      </div>

                      {msg.tokensUsed && (
                        <span className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
                          {msg.tokensUsed} tokens utilises
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--surface)]">
              <div className="flex items-center gap-2 mb-2.5 overflow-x-auto pb-1">
                {[
                  'Bonjour, je prends en charge votre dossier.',
                  'Pourriez-vous nous fournir une photo du colis endommage ?',
                  'Votre remboursement a bien ete initie.',
                  'Je reste a votre disposition si besoin.',
                ].map((macro, i) => (
                  <button
                    key={i}
                    onClick={() => setCounselorReply(macro)}
                    className="text-xs rounded-md bg-[var(--surface-hover)] border border-[var(--border-subtle)] px-2.5 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-indigo-500/40 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {macro}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendAgentMessage} className="flex gap-2">
                <textarea
                  rows={2}
                  value={counselorReply}
                  onChange={(e) => setCounselorReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAgentMessage();
                    }
                  }}
                  placeholder={
                    activeConversation.status === 'HUMAN_ACTIVE'
                      ? 'Ecrivez votre message en direct au client... (Entree pour envoyer)'
                      : 'Prenez la main sur le ticket pour repondre directement...'
                  }
                  disabled={activeConversation.status !== 'HUMAN_ACTIVE' || actionLoading}
                  className="flex-1 bg-[var(--surface-hover)] border border-[var(--border-strong)] rounded-xl p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-50"
                />
                <Button
                  type="submit"
                  disabled={
                    !counselorReply.trim() ||
                    activeConversation.status !== 'HUMAN_ACTIVE' ||
                    actionLoading
                  }
                  className="self-end h-10 px-5"
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  Envoyer
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-muted)]">
            Selectionnez une conversation dans la file de triage a gauche
          </div>
        )}
      </div>

      {/* COLUMN 3: Context & RAG */}
      <div className="w-[320px] shrink-0 border-l border-[var(--border-subtle)] bg-[var(--surface)] p-4 space-y-6 overflow-y-auto">
        <div>
          <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Client
          </h4>
          <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-hover)] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Identifiant :</span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {activeConversation?.userExternalId || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Cree le :</span>
              <span className="font-mono text-[var(--text-secondary)]">
                {activeConversation
                  ? new Date(activeConversation.createdAt).toLocaleDateString()
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Messages :</span>
              <span className="font-mono text-[var(--text-secondary)]">
                {activeConversation?.messages?.length || 0}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              RAG
            </h4>
            <Badge variant="bot" className="text-[10px]">
              pgvector 768
            </Badge>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-hover)] space-y-3 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                Strategie de recherche
              </span>
              <p className="text-xs text-[var(--text-primary)]">
                Distance Cosinus sur Embeddings Gemini 3.1
              </p>
            </div>

            <div className="space-y-1 pt-2 border-t border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                Derniere detection d'intention
              </span>
              <div className="flex items-center gap-2 mt-1">
                {activeConversation?.category ? (
                  <Badge variant={activeConversation.category.toLowerCase() as any}>
                    {activeConversation.category}
                  </Badge>
                ) : (
                  <span className="text-[var(--text-muted)] italic">Non classifie</span>
                )}
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">
                Regle d'escalade automatique
              </span>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Declenchee automatiquement si l'utilisateur demande un humain ou si
                l'IA emet <code className="text-amber-400">[ESCALATE_TO_HUMAN]</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
