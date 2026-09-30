// frontend/src/components/workspace/KnowledgeBaseView.tsx
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
} from 'lucide-react';
import { api, type KnowledgeDocument } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';

export const KnowledgeBaseView: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [_error, setError] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer les documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      await api.addDocument(title.trim(), content.trim(), sourceUrl.trim() || undefined);
      setTitle('');
      setContent('');
      setSourceUrl('');
      setIsAddOpen(false);
      await fetchDocs();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’ingestion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    try {
      const text = await file.text();
      setContent(text);
    } catch {
      alert('Impossible de lire ce fichier. Veuillez coller son contenu directement.');
    }
  };

  const handleDelete = async (id: string, docTitle: string) => {
    if (!confirm(`Supprimer définitivement le document "${docTitle}" et tous ses chunks vectoriels ?`)) {
      return;
    }

    try {
      await api.deleteDocument(id);
      await fetchDocs();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Base de Connaissances Vectorielle
            </h1>
            <Badge variant="bot" className="text-xs">
              RAG • pgvector
            </Badge>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Documents ingérés, découpés en chunks (~500 car.) et vectorisés via Gemini Embeddings
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={fetchDocs} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>

          {/* Add Document Dialog Modal */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">
                <Plus className="h-4 w-4 mr-1.5" />
                Ajouter un Document (CRUD)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Ingérer un Document dans la Base RAG</DialogTitle>
                <DialogDescription>
                  Le texte sera automatiquement segmenté en chunks et indexé dans pgvector.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAdd} className="space-y-4 mt-2">
                {/* File Dropzone / Quick Import */}
                <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-hover)] p-3 text-center transition-colors hover:border-indigo-500/50">
                  <input
                    type="file"
                    id="file-upload-input"
                    accept=".txt,.md,.markdown,.json,.csv,.text"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload-input"
                    className="flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <Upload className="h-5 w-5 text-indigo-400" />
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      Importer un fichier texte (.txt, .md, .json)
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Remplit automatiquement le titre et le contenu du document
                    </span>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Titre du document *
                  </label>
                  <Input
                    required
                    placeholder="Ex: Politique de Retour et Garantie 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    URL Source (optionnelle)
                  </label>
                  <Input
                    placeholder="https://mon-entreprise.com/conditions"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      Contenu textuel complet *
                    </label>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      ~{Math.ceil(content.length / 500)} chunk(s) prévus
                    </span>
                  </div>
                  <textarea
                    required
                    rows={8}
                    placeholder="Collez ici le texte officiel de votre politique, FAQ ou documentation technique..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-[var(--surface-hover)] border border-[var(--border-strong)] rounded-xl p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddOpen(false)}
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={submitting || !title || !content}>
                    {submitting ? 'Vectorisation en cours...' : 'Ingérer & Vectoriser'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Documents Actifs ({documents.length})</CardTitle>
              <CardDescription>
                Ces documents servent de source exclusive de vérité pour les réponses autonomes du bot
              </CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              CRUD Base de Connaissances
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading && documents.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
              Chargement des documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center text-sm text-[var(--text-muted)] space-y-3">
              <FileText className="h-10 w-10 mx-auto text-[var(--text-muted)] opacity-50" />
              <p>Aucun document dans la base de connaissances.</p>
              <p className="text-xs">
                Cliquez sur "Ajouter un Document" pour démarrer l'ingestion vectorielle.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                        {doc.title}
                      </h4>
                      {doc.status === 'PROCESSED' && (
                        <Badge variant="bot" className="text-[10px]">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Indexé
                        </Badge>
                      )}
                      {doc.status === 'PENDING' && (
                        <Badge variant="pending" className="text-[10px]">
                          <Clock className="h-3 w-3 mr-1" />
                          En cours
                        </Badge>
                      )}
                      {doc.status === 'FAILED' && (
                        <Badge variant="bug" className="text-[10px]">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Échec
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-mono">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-indigo-400" />
                        {doc._count?.chunks || 0} chunk(s) vectorisé(s)
                      </span>
                      <span>•</span>
                      <span>UUID : {doc.id.substring(0, 8)}...</span>
                      <span>•</span>
                      <span>
                        Ajouté le {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {doc.sourceUrl && (
                      <a
                        href={doc.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline pt-0.5"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {doc.sourceUrl}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id, doc.title)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2.5"
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
