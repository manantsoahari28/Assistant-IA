import { useState } from 'react';
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Search,
  Check,
  LayoutDashboard,
  Cpu,
} from 'lucide-react';
import { ChatWidget } from '@/components/widget/ChatWidget';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  specs: string[];
  image: string;
  badge?: string;
  description: string;
}

const PRODUCTS: Product[] = [
  {
    id: 'mbp-16-m4',
    name: 'MacBook Pro 16″ M4 Pro',
    category: 'Ordinateurs',
    price: 2999,
    specs: ['Puce M4 Pro 14 cœurs', '36 Go mémoire unifiée', '512 Go SSD PCIe 4.0', 'Écran Liquid Retina XDR 120Hz'],
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
    badge: 'Expédié sous 24h',
    description: 'Châssis aluminium recyclé, autonomie record jusqu’à 24 heures et puissance de calcul pour les flux créatifs lourds.',
  },
  {
    id: 'sony-wh1000xm5',
    name: 'Sony WH-1000XM5 Noir',
    category: 'Audio',
    price: 349,
    specs: ['Double processeur V1 & QN1', 'Autonomie 30h avec ANC', 'Codec LDAC haute résolution', 'Charge rapide 3 min = 3h'],
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    badge: 'Bestseller',
    description: 'Réduction de bruit active de référence avec 8 microphones de précision et diaphragmes en fibre de carbone.',
  },
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro 256 Go',
    category: 'Smartphones',
    price: 1229,
    specs: ['Puce A18 Pro 3nm', 'Châssis Titane Grade 5', 'Triple capteur 48 Mpx Fusion', 'Bouton Commande de l’appareil'],
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=900&q=80',
    badge: 'Nouveau',
    description: 'Conçu pour Apple Intelligence avec écran Super Retina XDR toujours activé et bordures ultra-fines de 1,2 mm.',
  },
  {
    id: 'studio-display-27',
    name: 'Studio Display 27″ 5K',
    category: 'Écrans',
    price: 1749,
    specs: ['Dalle IPS 5120 × 2880 (218 ppp)', 'Luminosité 600 nits P3', 'Caméra 12 Mpx Cadre centré', 'Système audio 6 haut-parleurs'],
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80',
    description: 'Finition verre standard avec pied réglable en inclinaison, micro studio à trois capsules et hub Thunderbolt 3.',
  },
];

export function TechGearDemo() {
  const [cartCount, setCartCount] = useState(1);
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Tous');

  const handleAddToCart = (productId: string) => {
    setCartCount((prev) => prev + 1);
    setAddedItem(productId);
    setTimeout(() => setAddedItem(null), 1800);
  };

  const filteredProducts = activeCategory === 'Tous'
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F9FAFB] font-sans antialiased selection:bg-indigo-500/25 selection:text-indigo-200">
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP STORE BANNER */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <aside className="border-b border-[#1E293B] bg-[#0E1524] px-4 py-2 text-xs text-[#94A3B8]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span>Livraison express offerte dès 120 € • Retours gratuits sous 30 jours • Garantie 24 mois</span>
          </div>

          <button
            onClick={() => { window.location.hash = ''; }}
            className="inline-flex items-center gap-1.5 text-[11px] text-[#94A3B8] hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <LayoutDashboard className="h-3 w-3" />
            <span className="hidden sm:inline">Espace Collaborateurs</span>
            <span>→</span>
          </button>
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 2. MAIN STORE NAVIGATION */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[#1F2937] bg-[#0B0F19]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <a href="#demo" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-indigo-600 text-white shadow-xs">
                <Cpu className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[#F9FAFB]">TechGear</span>
            </a>

            <nav className="hidden items-center gap-6 text-sm text-[#94A3B8] md:flex">
              {['Tous', 'Ordinateurs', 'Audio', 'Smartphones', 'Écrans'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`transition-colors cursor-pointer ${
                    activeCategory === cat
                      ? 'font-semibold text-white'
                      : 'hover:text-[#F9FAFB]'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <a href="#faq" className="hover:text-[#F9FAFB] transition-colors">
                Centre d'aide
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden w-64 items-center sm:flex">
              <Search className="absolute left-3 h-3.5 w-3.5 text-[#64748B]" />
              <input
                type="text"
                placeholder="Rechercher un produit, référence…"
                className="w-full rounded-sm border border-[#1F2937] bg-[#111827] py-1.5 pl-9 pr-3 text-xs text-[#F9FAFB] placeholder:text-[#64748B] focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              aria-label="Panier d'achats"
              className="relative flex h-9 items-center gap-2 rounded-sm border border-[#1F2937] bg-[#111827] px-3.5 text-xs font-medium text-[#F9FAFB] transition-colors hover:bg-[#1F2937] cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4 text-[#94A3B8]" />
              <span className="hidden sm:inline">Panier</span>
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white font-mono">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 3. HERO SHOWCASE */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section className="border-b border-[#1F2937] bg-[#0E1524]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F9FAFB] leading-[1.15]">
              Matériel d’ingénierie et postes de travail professionnels.
            </h1>

            <p className="max-w-2xl text-base text-[#94A3B8] leading-relaxed">
              Sélection rigoureuse d’ordinateurs, systèmes audio et affichages haute fidélité. Chaque référence est testée en laboratoire, couverte par une garantie constructeur de 2 ans et expédiée avec suivi direct.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#catalog"
                className="inline-flex items-center gap-2 rounded-sm bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 cursor-pointer"
              >
                <span>Explorer le catalogue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>

              <a
                href="#faq"
                className="inline-flex items-center gap-2 rounded-sm border border-[#1F2937] bg-[#111827] px-4 py-2.5 text-xs font-medium text-[#F9FAFB] transition-colors hover:bg-[#1F2937] cursor-pointer"
              >
                <span>Garanties &amp; Retours</span>
              </a>
            </div>

            {/* Store Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#1E293B] text-xs">
              <div>
                <div className="font-mono text-lg font-bold text-[#F9FAFB]">24h</div>
                <div className="text-[#64748B] mt-0.5">Expédition Chronopost</div>
              </div>
              <div>
                <div className="font-mono text-lg font-bold text-[#F9FAFB]">30 j.</div>
                <div className="text-[#64748B] mt-0.5">Droit de rétractation</div>
              </div>
              <div>
                <div className="font-mono text-lg font-bold text-emerald-400">4.9 / 5</div>
                <div className="text-[#64748B] mt-0.5">Avis clients certifiés</div>
              </div>
            </div>
          </div>

          {/* Featured Hero Product Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-md border border-[#1E293B] bg-[#111827] p-6 shadow-sm">
              <div className="aspect-16/10 w-full overflow-hidden rounded-sm bg-[#161F2E] mb-5 border border-[#1F2937]">
                <img
                  src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"
                  alt="MacBook Pro M4 Pro"
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="eager"
                />
              </div>

              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400">
                    Configuration de référence
                  </span>
                  <h2 className="text-lg font-bold text-[#F9FAFB]">MacBook Pro 16″ M4 Pro</h2>
                </div>
                <div className="text-right">
                  <div className="font-mono text-lg font-bold text-[#F9FAFB]">2 999,00 €</div>
                  <span className="text-[10px] text-emerald-400 font-medium">TTC • En stock</span>
                </div>
              </div>

              <p className="text-xs text-[#94A3B8] mb-4">
                Puce Apple M4 Pro (CPU 14 cœurs / GPU 20 cœurs), 36 Go de mémoire unifiée et 512 Go de stockage SSD ultra-rapide.
              </p>

              <button
                onClick={() => handleAddToCart('mbp-16-m4')}
                className={`w-full rounded-sm py-2.5 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  addedItem === 'mbp-16-m4'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {addedItem === 'mbp-16-m4' ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Ajouté au panier</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span>Ajouter au panier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 4. PRODUCT CATALOG GRID */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section id="catalog" className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-[#1F2937]">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#F9FAFB]">
              Équipements certifiés en stock
            </h2>
            <p className="text-sm text-[#94A3B8] mt-1">
              Tous nos articles bénéficient de la garantie constructeur européenne de 24 mois.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#64748B]">{filteredProducts.length} référence(s)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const isAdded = addedItem === p.id;
            return (
              <div
                key={p.id}
                className="group flex flex-col rounded-md border border-[#1F2937] bg-[#111827] overflow-hidden transition-colors hover:border-[#374151]"
              >
                <div className="relative aspect-4/3 w-full overflow-hidden bg-[#161F2E] border-b border-[#1F2937]">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {p.badge && (
                    <span className="absolute top-2.5 left-2.5 rounded-sm bg-[#0B0F19]/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-[#F9FAFB] border border-[#1F2937]">
                      {p.badge}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-1">
                    <span>{p.category}</span>
                    <span className="font-mono text-[#94A3B8]">TG-{p.id.substring(0, 4).toUpperCase()}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#F9FAFB] line-clamp-1 mb-1">
                    {p.name}
                  </h3>

                  <div className="font-mono text-base font-bold text-[#F9FAFB] mb-3">
                    {p.price.toLocaleString('fr-FR')} €
                  </div>

                  <p className="text-xs text-[#94A3B8] line-clamp-2 mb-4 leading-relaxed">
                    {p.description}
                  </p>

                  <ul className="space-y-1 mb-5 text-[11px] text-[#64748B] border-t border-[#1E293B] pt-3">
                    {p.specs.slice(0, 2).map((spec, i) => (
                      <li key={i} className="flex items-center gap-1.5 truncate">
                        <span className="h-1 w-1 rounded-full bg-indigo-500 shrink-0" />
                        <span className="truncate">{spec}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleAddToCart(p.id)}
                    className={`mt-auto w-full rounded-sm py-2 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#1F2937] text-[#F9FAFB] hover:bg-indigo-600 hover:text-white'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Ajouté</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Ajouter au panier</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 5. AUTHENTIC CUSTOMER SUPPORT & FAQ SECTION */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section id="faq" className="border-y border-[#1F2937] bg-[#0E1524] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-[#F9FAFB]">
              Centre d’aide &amp; Questions fréquentes
            </h2>
            <p className="text-sm text-[#94A3B8] mt-1.5 leading-relaxed">
              Consultez les réponses directes à nos engagements de service, nos garanties et nos démarches de retour.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-md border border-[#1E293B] bg-[#111827] p-6 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                <RotateCcw className="h-4 w-4" />
                <span>Retours sous 30 jours</span>
              </div>
              <h3 className="text-sm font-semibold text-[#F9FAFB]">
                Comment s’applique le droit de rétractation de 30 jours ?
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Vous disposez de 30 jours calendaires à compter de la réception de votre colis pour nous retourner tout article dans son emballage d’origine. Les frais de retour sont intégralement pris en charge avec une étiquette prépayée.
              </p>
            </div>

            <div className="rounded-md border border-[#1E293B] bg-[#111827] p-6 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <Truck className="h-4 w-4" />
                <span>Incident de transport</span>
              </div>
              <h3 className="text-sm font-semibold text-[#F9FAFB]">
                Que faire si mon matériel arrive endommagé ?
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Si votre colis ou un écran présente une dégradation visible à la livraison, signalez-le immédiatement via notre assistance en ligne avec une photo du dommage pour déclencher un remplacement prioritaire sous 24h.
              </p>
            </div>

            <div className="rounded-md border border-[#1E293B] bg-[#111827] p-6 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>Garantie 2 ans</span>
              </div>
              <h3 className="text-sm font-semibold text-[#F9FAFB]">
                Quelles sont les modalités de la garantie européenne ?
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                L’ensemble de nos produits neufs bénéficient de la garantie légale de conformité de 24 mois. Les réparations sont réalisées exclusivement en centre agréé constructeur avec pièces d’origine.
              </p>
            </div>

            <div className="rounded-md border border-[#1E293B] bg-[#111827] p-6 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                <Headphones className="h-4 w-4" />
                <span>Assistance en direct</span>
              </div>
              <h3 className="text-sm font-semibold text-[#F9FAFB]">
                Comment joindre notre service client ?
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Notre assistance en ligne est accessible en permanence via la bulle de discussion en bas à droite. Vous obtenez une réponse immédiate à vos questions techniques ou un transfert direct vers nos conseillers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 6. LOGISTICS CARDS */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-4 p-4 rounded-md border border-[#1F2937] bg-[#111827]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#1E293B] text-indigo-400">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#F9FAFB]">Livraison suivie 24h</h3>
              <p className="text-[11px] text-[#94A3B8] mt-1">Expédition Chronopost Express pour toute commande avant 15h.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-md border border-[#1F2937] bg-[#111827]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#1E293B] text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#F9FAFB]">Garantie constructeur 2 ans</h3>
              <p className="text-[11px] text-[#94A3B8] mt-1">Échange standard ou réparation en centre agréé sans surcoût.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-md border border-[#1F2937] bg-[#111827]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#1E293B] text-amber-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#F9FAFB]">Retours gratuits 30 jours</h3>
              <p className="text-[11px] text-[#94A3B8] mt-1">Bordereau prépayé généré automatiquement sur simple demande.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-md border border-[#1F2937] bg-[#111827]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#1E293B] text-indigo-400">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#F9FAFB]">Support client 7j/7</h3>
              <p className="text-[11px] text-[#94A3B8] mt-1">Assistance en direct pour le suivi et le conseil avant-vente.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 7. AUTHENTIC FOOTER */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1F2937] bg-[#0B0F19] px-6 py-12 text-xs text-[#64748B]">
        <div className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-indigo-600 text-white">
                <Cpu className="h-3 w-3" />
              </div>
              <span className="text-sm font-bold text-[#F9FAFB]">TechGear</span>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Distributeur certifié d’équipements informatiques, audio et affichages professionnels en France métropolitaine.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#F9FAFB] mb-3">Produits</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#catalog" className="hover:text-white transition-colors">MacBook Pro</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Casques Sony ANC</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">iPhone 16 Pro</a></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Studio Display 5K</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#F9FAFB] mb-3">Services</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#faq" className="hover:text-white transition-colors">Expédition Chronopost</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Garantie 24 mois</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Politique de retour</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Suivi de commande</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#F9FAFB] mb-3">Assistance</h4>
            <p className="text-xs text-[#94A3B8] mb-3">
              Une question avant de commander ? Utilisez le chat en direct en bas d'écran.
            </p>
            <button
              onClick={() => { window.location.hash = ''; }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
            >
              Accéder à la console support →
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl pt-6 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>© 2026 TechGear SAS. Tous droits réservés.</div>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#94A3B8] cursor-pointer">Conditions Générales de Vente</span>
            <span className="hover:text-[#94A3B8] cursor-pointer">Politique de confidentialité</span>
            <span className="hover:text-[#94A3B8] cursor-pointer">Mentions légales</span>
          </div>
        </div>
      </footer>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 8. EMBEDDED CUSTOMER CHAT WIDGET */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <ChatWidget userExternalId="client-techgear-demo" />
    </div>
  );
}

export default TechGearDemo;


