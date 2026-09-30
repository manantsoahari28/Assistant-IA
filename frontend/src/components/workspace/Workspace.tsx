// frontend/src/components/workspace/Workspace.tsx
import React, { useState, useEffect } from 'react';
import {
  Inbox,
  BarChart3,
  BookOpen,
  Settings,
  Moon,
  Sun,
  Headphones,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { InboxView } from './InboxView';
import { DashboardView } from './DashboardView';
import { KnowledgeBaseView } from './KnowledgeBaseView';
import { SettingsView } from './SettingsView';
import { cn } from '@/lib/utils';

export type WorkspaceTab = 'inbox' | 'dashboard' | 'knowledge' | 'settings';

export const Workspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('inbox');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [tenantName, setTenantName] = useState<string>('Support Entreprise');
  const [isDark, setIsDark] = useState<boolean>(true);

  // Apply dark mode class to root html/body
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Fetch tenant settings once on mount
  useEffect(() => {
    let isMounted = true;
    api
      .getTenantSettings()
      .then((settings) => {
        if (isMounted && settings?.name) {
          setTenantName(settings.name);
        }
      })
      .catch(() => {
        // Silent error
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Poll pending count every 8 seconds (instead of 4s)
  useEffect(() => {
    let isMounted = true;
    const fetchPending = async () => {
      try {
        const pending = await api.getPendingConversations();
        if (isMounted) {
          setPendingCount(pending.length);
        }
      } catch (e) {
        // Silent poll error
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] flex flex-col font-sans">
      {/* Top Global Navigation Bar */}
      <header className="h-[65px] border-b border-[var(--border-subtle)] bg-[var(--surface)] px-6 flex items-center justify-between shrink-0">
        {/* Left: Brand & Tenant */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Headphones className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
                Assistant-IA
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] font-medium block -mt-0.5">
                Espace Conseiller
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-[var(--border-subtle)]" />

          <Badge variant="secondary" className="text-xs font-medium">
            {tenantName}
          </Badge>
        </div>

        {/* Center: Navigation Views */}
        <nav className="flex items-center gap-1 bg-[var(--surface-hover)] p-1 rounded-xl border border-[var(--border-subtle)]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
              activeTab === 'dashboard'
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Tableau de bord</span>
          </button>

          <button
            onClick={() => setActiveTab('inbox')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
              activeTab === 'inbox'
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <Inbox className="h-4 w-4" />
            <span>Boîte de réception</span>
            {pendingCount > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-amber-500 text-white font-mono text-[10px] font-bold flex items-center justify-center animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
              activeTab === 'knowledge'
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <BookOpen className="h-4 w-4" />
            <span>Base RAG</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
              activeTab === 'settings'
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <Settings className="h-4 w-4" />
            <span>Paramètres</span>
          </button>
        </nav>

        {/* Right: Operator Presence & Theme Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDark(!isDark)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            aria-label="Basculer le thème"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-2.5 pl-2 border-l border-[var(--border-subtle)]">
            <div className="relative">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                SC
              </div>
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[var(--surface)]" />
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-semibold text-[var(--text-primary)] block leading-tight">
                Sarah Chen
              </span>
              <span className="text-[10px] text-emerald-400 font-medium block">
                Conseiller En Ligne
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'inbox' && <InboxView />}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'knowledge' && <KnowledgeBaseView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};
