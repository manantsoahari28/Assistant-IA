// frontend/src/components/workspace/SettingsView.tsx
import React, { useState, useEffect } from 'react';
import {
  Key,
  Bot,
  Save,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { api, type TenantSettings, getApiKey, setApiKey } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [name, setName] = useState('');
  const [botSystemPrompt, setBotSystemPrompt] = useState('');
  const [localKey, setLocalKey] = useState(getApiKey());
  const [_loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getTenantSettings();
      setSettings(res);
      setName(res.name);
      setBotSystemPrompt(res.botSystemPrompt || '');
    } catch (err: any) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateTenantSettings({ name, botSystemPrompt });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      await fetchSettings();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(localKey);
    alert('Clé API mise à jour dans le client frontend !');
    fetchSettings();
  };

  const handleCopy = () => {
    if (settings?.apiKey) {
      navigator.clipboard.writeText(settings.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Paramètres du Service Support
          </h1>
          <Badge variant="secondary" className="text-xs">
            Espace Dédié
          </Badge>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Identité de l'entreprise, consignes de réponse et authentification API
        </p>
      </div>

      {/* Main Settings Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-400" />
            <CardTitle className="text-base">Consignes de Réponse Automatisée</CardTitle>
          </div>
          <CardDescription>
            Ajustez le ton, les règles de courtoisie et les consignes directrices pour les réponses automatiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Nom de l'entreprise
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Entreprise De Démo"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Directives et règles éditoriales
                </label>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  ~{Math.round(botSystemPrompt.length / 4)} tokens
                </span>
              </div>
              <textarea
                rows={5}
                value={botSystemPrompt}
                onChange={(e) => setBotSystemPrompt(e.target.value)}
                placeholder="Tu es un assistant de support client professionnel, courtois et concis..."
                className="w-full bg-[var(--surface-hover)] border border-[var(--border-strong)] rounded-xl p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs leading-relaxed"
              />
              <p className="text-[11px] text-[var(--text-muted)]">
                Ces instructions cadrent la formulation des réponses automatiques générées à partir de votre documentation.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              {savedSuccess ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Paramètres enregistrés avec succès
                </span>
              ) : (
                <div />
              )}

              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-1.5" />
                {saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* API Key Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-base">Authentification & Clé API Tenant</CardTitle>
          </div>
          <CardDescription>
            Toutes les requêtes envoyées au backend requièrent l'en-tête{' '}
            <code className="text-indigo-400">x-api-key</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-hover)] flex items-center justify-between">
            <div>
              <span className="text-xs text-[var(--text-muted)] block">Clé API Serveur (Démo) :</span>
              <span className="text-sm font-mono font-semibold text-[var(--text-primary)]">
                {settings?.apiKey || 'cle-api-test-123'}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy} className="h-8">
              {copiedKey ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copier
                </>
              )}
            </Button>
          </div>

          <form onSubmit={handleUpdateApiKey} className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              Changer la Clé API active dans le frontend
            </label>
            <div className="flex gap-2">
              <Input
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="Collez une clé API tenant..."
                className="font-mono text-xs"
              />
              <Button type="submit" variant="secondary" size="sm">
                Appliquer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
