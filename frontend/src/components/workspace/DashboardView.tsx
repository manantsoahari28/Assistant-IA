// frontend/src/components/workspace/DashboardView.tsx
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  Bug,
  FileText,
  Clock,
  Zap,
  Users,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { api, type AnalyticsData } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const DashboardView: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(() => {
    try {
      const cached = sessionStorage.getItem('support_ia_analytics_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAnalytics();
      setData(res);
      sessionStorage.setItem('support_ia_analytics_cache', JSON.stringify(res));
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans animate-pulse">
        <div className="h-8 w-64 bg-[var(--surface-hover)] rounded-md mb-2" />
        <div className="h-4 w-96 bg-[var(--surface-hover)] rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-md bg-[var(--surface)] border border-[var(--border-subtle)] p-4" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="h-80 rounded-md bg-[var(--surface)] border border-[var(--border-subtle)]" />
          <div className="h-80 rounded-md bg-[var(--surface)] border border-[var(--border-subtle)]" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 text-center text-sm text-red-400 bg-red-500/10 rounded-md border border-red-500/20 m-6 max-w-lg mx-auto">
        <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-400" />
        <p className="font-medium text-white mb-1">Erreur de chargement</p>
        <p className="text-xs text-red-300 mb-4">{error}</p>
        <Button onClick={fetchStats} variant="outline" size="sm" className="cursor-pointer">
          <RefreshCw className="h-3 w-3 mr-1.5" />
          Réessayer
        </Button>
      </div>
    );
  }

  const totalCat =
    (data?.categories.BUG || 0) +
    (data?.categories.QUESTION || 0) +
    (data?.categories.RECLAMATION || 0) +
    (data?.categories.UNCLASSIFIED || 0);

  const getPercent = (count: number) => {
    if (!totalCat || count === 0) return 0;
    return Math.round((count / totalCat) * 100);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Tableau de bord des demandes
            </h1>
            <Badge variant="default" className="text-xs">
              Analytique
            </Badge>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Surveillance des flux, catégorisation automatique et demandes les plus fréquentes
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
              Total Demandes
            </CardTitle>
            <Users className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight tabular-nums">
              {data?.totalConversations || 0}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 tabular-nums">
              {data?.totalMessages || 0} messages échangés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
              File Conseiller
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight tabular-nums text-amber-500">
              {data?.statuses.PENDING_HUMAN || 0}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Escalades à traiter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
              Résolution Immédiate
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight tabular-nums text-emerald-500">
              {data?.statuses.BOT || 0}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Traitement automatique
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
              Base Documentaire
            </CardTitle>
            <FileText className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight tabular-nums text-indigo-400">
              {data?.totalDocuments || 0}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Articles actifs indexés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Section: Categories & Frequent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Category Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              <CardTitle className="text-base">
                Répartition des Demandes par Motif
              </CardTitle>
            </div>
            <CardDescription>
              Ventilation par intention détectée lors des échanges clients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Category: Question */}
            <div>
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="flex items-center gap-2 font-medium">
                  <HelpCircle className="h-4 w-4 text-indigo-400" />
                  Questions & Renseignements
                </span>
                <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                  {data?.categories.QUESTION || 0} ({getPercent(data?.categories.QUESTION || 0)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-[var(--surface-hover)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${getPercent(data?.categories.QUESTION || 0)}%` }}
                />
              </div>
            </div>

            {/* Category: Bug */}
            <div>
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="flex items-center gap-2 font-medium">
                  <Bug className="h-4 w-4 text-red-400" />
                  Incidents Techniques
                </span>
                <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                  {data?.categories.BUG || 0} ({getPercent(data?.categories.BUG || 0)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-[var(--surface-hover)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${getPercent(data?.categories.BUG || 0)}%` }}
                />
              </div>
            </div>

            {/* Category: Reclamation */}
            <div>
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                  Réclamations & Commandes
                </span>
                <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                  {data?.categories.RECLAMATION || 0} (
                  {getPercent(data?.categories.RECLAMATION || 0)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-[var(--surface-hover)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${getPercent(data?.categories.RECLAMATION || 0)}%` }}
                />
              </div>
            </div>

            {/* Unclassified */}
            {(data?.categories.UNCLASSIFIED || 0) > 0 && (
              <div>
                <div className="flex justify-between items-center text-sm mb-1.5">
                  <span className="flex items-center gap-2 font-medium text-[var(--text-secondary)]">
                    Autres demandes
                  </span>
                  <span className="text-xs text-[var(--text-muted)] tabular-nums">
                    {data?.categories.UNCLASSIFIED} (
                    {getPercent(data?.categories.UNCLASSIFIED || 0)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-[var(--surface-hover)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${getPercent(data?.categories.UNCLASSIFIED || 0)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Frequent Requests & Trends */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-400" />
              <CardTitle className="text-base">
                Thématiques Récurrentes
              </CardTitle>
            </div>
            <CardDescription>
              Motifs d'échange les plus observés sur les derniers jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  topic: 'Politique de retour & délais de rétractation (30 jours)',
                  freq: 'Élevée',
                  category: 'QUESTION',
                  badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                  matches: 'Documentation validée',
                },
                {
                  topic: 'Colis endommagé à la livraison / Écran fêlé',
                  freq: 'Prioritaire',
                  category: 'RECLAMATION',
                  badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                  matches: 'Escalade conseiller systématique',
                },
                {
                  topic: 'Erreur technique lors de la validation du panier',
                  freq: 'Moyenne',
                  category: 'BUG',
                  badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
                  matches: 'Diagnostic en cours',
                },
                {
                  topic: 'Suivi de commande et lien d’expédition transporteur',
                  freq: 'Élevée',
                  category: 'QUESTION',
                  badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                  matches: 'Résolu automatiquement',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-hover)]"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {item.topic}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border ${item.badgeColor}`}
                      >
                        {item.category}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {item.matches}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                    {item.freq}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational State Machine Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            État des Files de Prise en Charge
          </CardTitle>
          <CardDescription>
            Répartition des tickets selon leur étape de traitement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-hover)]">
              <span className="text-xs text-[var(--text-secondary)] block mb-1">
                Automatique
              </span>
              <span className="text-2xl font-semibold tracking-tight tabular-nums text-[var(--text-primary)]">
                {data?.statuses.BOT || 0}
              </span>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Réponses autonomes
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <span className="text-xs text-amber-500 block mb-1">
                En attente
              </span>
              <span className="text-2xl font-semibold tracking-tight tabular-nums text-amber-500">
                {data?.statuses.PENDING_HUMAN || 0}
              </span>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Demandes d'escalade
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <span className="text-xs text-emerald-500 block mb-1">
                En cours
              </span>
              <span className="text-2xl font-semibold tracking-tight tabular-nums text-emerald-500">
                {data?.statuses.HUMAN_ACTIVE || 0}
              </span>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Conseiller en direct
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-hover)]">
              <span className="text-xs text-[var(--text-secondary)] block mb-1">
                Résolus
              </span>
              <span className="text-2xl font-semibold tracking-tight tabular-nums text-[var(--text-primary)]">
                {(data?.statuses.CLOSED || 0) + (data?.statuses.RESOLVED || 0)}
              </span>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Dossiers clôturés
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
