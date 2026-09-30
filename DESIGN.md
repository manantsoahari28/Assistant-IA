---
name: Assistant-IA
description: High-density enterprise RAG customer support workspace and embeddable customer widget
colors:
  primary: "#4F46E5"
  primary-hover: "#4338CA"
  primary-active: "#3730A3"
  primary-muted: "rgba(79, 70, 229, 0.12)"
  neutral-bg: "#0B0F19"
  neutral-surface: "#111827"
  neutral-surface-hover: "#1F2937"
  neutral-surface-elevated: "#1E293B"
  neutral-border: "#1F2937"
  neutral-border-subtle: "#161F2E"
  neutral-border-hover: "#374151"
  neutral-text: "#F9FAFB"
  neutral-text-secondary: "#94A3B8"
  neutral-text-muted: "#64748B"
  state-bot: "#6366F1"
  state-bot-bg: "rgba(99, 102, 241, 0.12)"
  state-pending: "#F59E0B"
  state-pending-bg: "rgba(245, 158, 11, 0.12)"
  state-human: "#10B981"
  state-human-bg: "rgba(16, 185, 129, 0.12)"
  state-closed: "#64748B"
  state-closed-bg: "rgba(100, 116, 139, 0.12)"
  category-bug: "#EF4444"
  category-bug-bg: "rgba(239, 68, 68, 0.12)"
  category-question: "#3B82F6"
  category-question-bg: "rgba(59, 130, 246, 0.12)"
  category-reclamation: "#F97316"
  category-reclamation-bg: "rgba(249, 115, 22, 0.12)"
  rag-chunk-bg: "#0D1525"
  rag-chunk-border: "#1E2C4A"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "0.02em"
rounded:
  none: "0px"
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  2xs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  button-takeover:
    backgroundColor: "{colors.state-human}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.neutral-surface-hover}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  chip-status:
    backgroundColor: "{colors.state-pending-bg}"
    textColor: "{colors.state-pending}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  input-search:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  card-conversation:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.md}"
    padding: "12px"
---

# Design System: Assistant-IA

## Overview

**Creative North Star: "The Mission Control Dispatcher"**

Assistant-IA's visual system embodies the calm, unyielding precision of an air traffic control console or financial trading terminal. In an enterprise customer support environment, counselors operate under high cognitive throughput: reviewing customer grievances, inspecting AI-retrieved source chunks, claiming escalated threads, and composing decisive replies. The interface must never compete for attention through decorative flourishes, flashy animations, or trendy "AI glow" gradients. It is a precision instrument where typography, semantic color, and structural density prioritize split-second comprehension.

The system serves two distinct operational surfaces linked by a single architectural truth:
1. **The Counselor Workspace**: An intensive, multi-column desktop console built for high-density triage, document curation, and real-time handoff management. It leverages deep charcoal/slate foundations (`#0B0F19`, `#111827`), razor-sharp 1px dividers, and compact typography with tabular figures to display maximum signal with minimal fatigue.
2. **The Embeddable Widget**: A lightweight, focused customer-facing drawer. It adopts the same semantic foundation while softening touch targets and pacing for consumer readability (380px fixed width, 600px height on desktop, full-screen adaptive on mobile viewports ≤ 640px).

**Key Characteristics:**
- **Zero-Tolerance Anti-Slop**: No purple neon gradients, no decorative sparkles, no fake progress rings, no eyebrow kickers, and no nested cards.
- **Strict Semantic Lifecycle Chromatics**: Colors are reserved exclusively for actionable states (`BOT` indigo, `PENDING_HUMAN` amber, `HUMAN_ACTIVE` emerald, `CLOSED` slate) and category identification (`BUG` red, `QUESTION` blue, `RECLAMATION` orange).
- **Tabular & Monospace Rigor**: Timestamps, chunk indices, token meters, and API hashes render with monospace or tabular numerals (`font-feature-settings: 'tnum'`) ensuring columns never jitter during live updates.
- **Tonal Layering over Heavy Drops**: Depth is established through subtle background contrast and 1px structural strokes, reserving box shadows solely for transient floating overlays.

## Colors

The palette is engineered for prolonged operational focus, utilizing a deep obsidian/slate foundation illuminated only by functional state indicators.

### Primary
- **Indigo Sapphire** (`#4F46E5`): Primary interactive intent, key call-to-actions, active navigation highlights.
- **Indigo Hover** (`#4338CA`): Pointer interaction state for primary controls.
- **Indigo Active / Pressed** (`#3730A3`): Mouse-down or active state.
- **Indigo Wash** (`rgba(79, 70, 229, 0.12)`): Selected row tint and subtle interactive backdrops.

### Neutral Foundation (Dark Mode Default)
- **Deep Void Background** (`#0B0F19`): Main application canvas, table underlays, and viewport background.
- **Charcoal Surface** (`#111827`): Cards, queue list items, message bubbles, panels, sidebars.
- **Elevated Surface** (`#1E293B`): Modals, floating dropdowns, popovers, customer message bubbles.
- **Surface Hover** (`#1F2937`): Row hover state, interactive card hover.
- **Structural Border** (`#1F2937`): Crisp 1px perimeter dividers between panels, headers, and list items.
- **Subtle Divider** (`#161F2E`): Secondary inner boundaries within cards.
- **Primary Text** (`#F9FAFB`): High-contrast pure white for headings, customer messages, and primary labels (contrast ratio > 12:1).
- **Secondary Text** (`#94A3B8`): Muted slate for metadata, conversation previews, timestamps (contrast ratio > 5:1).
- **Tertiary Text** (`#64748B`): De-emphasized cues, empty state hints, disabled text.

### Neutral Foundation (Light Mode Alternate)
- **Light Void Background** (`#F8FAFC`): Application viewport canvas.
- **Light Surface** (`#FFFFFF`): Main panels and active content cards.
- **Light Elevated Surface** (`#F1F5F9`): Inset zones, code boxes, chat input container.
- **Light Border** (`#E2E8F0`): Clean 1px boundary lines.
- **Light Primary Text** (`#0F172A`): Deep slate text.
- **Light Secondary Text** (`#475569`): Muted readable text.

### State & Lifecycle Tokens
- **BOT Autonomous** (`#6366F1`, wash `rgba(99, 102, 241, 0.12)`): Signifies AI automated answering mode. Calm, non-alarmist tech indigo.
- **PENDING_HUMAN Escalated** (`#F59E0B`, wash `rgba(245, 158, 11, 0.12)`): Urgent triage queue signal. Alerts counselor that a customer or AI triggered human handoff.
- **HUMAN_ACTIVE Live Takeover** (`#10B981`, wash `rgba(16, 185, 129, 0.12)`): Active claimed conversation. Bot is silenced; live counselor in control.
- **CLOSED Resolved** (`#64748B`, wash `rgba(100, 116, 139, 0.12)`): Inactive archived thread.

### Category Tokens
- **Category BUG** (`#EF4444`, wash `rgba(239, 68, 68, 0.12)`): Technical malfunction report.
- **Category QUESTION** (`#3B82F6`, wash `rgba(59, 130, 246, 0.12)`): Standard informational inquiry.
- **Category RECLAMATION** (`#F97316`, wash `rgba(249, 115, 22, 0.12)`): Customer complaint, billing issue, or dispute.

### RAG Inspection Tokens
- **RAG Chunk Background** (`#0D1525`): Dedicated background for retrieved knowledge chunk cards.
- **RAG Chunk Border** (`#1E2C4A`): Highlighting grounded vector source boundaries.
- **RAG Similarity Score** (`#38BDF8`): Cyan accent for cosine similarity badges (e.g. `cos θ: 0.884`).

### Named Rules
**The Restrained Accent Rule.** Primary accent (`#4F46E5`) must cover less than 8% of any rendered viewport. When every button screams, no button guides.
**The State Tint Rule.** Lifecycle states must pair their primary text color with a 12% opacity wash of the exact same hue. Never place state text on neutral gray tags.
**The No-Cosmetic-Gradients Rule.** Gradients are prohibited across buttons, text fills, and card borders. Gradients indicate marketing fluff; solid flat fills indicate enterprise durability.

## Typography

Typography prioritizes legibility, tight vertical rhythms, and clean tabular alignment for numbers and timestamps.

- **Primary Typeface:** `Inter`, with fallback `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
- **Monospace Typeface:** `JetBrains Mono`, with fallback `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`.
- **Character:** Highly functional, modern grotesque with open aperture and tall x-height. Free of idiosyncratic serifs or decorative geometry.

### Hierarchy
- **Display** (weight 600, size `1.5rem` / `24px`, line-height 1.25, tracking `-0.02em`): Workspace module titles and top-level operational counters.
- **Headline** (weight 600, size `1.25rem` / `20px`, line-height 1.3, tracking `-0.015em`): Drawer headers, modal titles, active customer name in chat view.
- **Title** (weight 600, size `0.9375rem` / `15px`, line-height 1.4, tracking `-0.01em`): Card titles, conversation row headings, panel section headers.
- **Body** (weight 400, size `0.875rem` / `14px`, line-height 1.5, tracking `0em`): Chat message utterances, customer inquiries, counselor composition input. Max line length 75ch.
- **Body Compact** (weight 400, size `0.8125rem` / `13px`, line-height 1.45): Knowledge base document preview snippets, chunk text in RAG inspector.
- **Label** (weight 500, size `0.75rem` / `12px`, line-height 1.33, tracking `0.02em`, uppercase optional for status): Status chips, category badges, table column headers, timestamps.
- **Code / Tabular** (weight 400/500, size `0.75rem` / `12px`, line-height 1.4, monospace): Similarity scores, UUID prefixes, API key previews, token usage counts.

### Named Rules
**The Single-Sans Discipline Rule.** Never combine distinct display and body sans-serif typefaces. The entire operational interface uses Inter. Monospace is strictly reserved for code, hashes, and data metrics.
**The Numeric Tabular Rule.** Every timestamp (`14:32:05`), duration (`2m 14s`), and quantitative metric must render with `font-variant-numeric: tabular-nums;` to prevent layout reflow during updates.
**The No-Eyebrow Rule.** Eyebrow labels or kickers above section titles are banned. Section headings must be concise and descriptive on their own.

## Layout

The architecture employs a dual-surface spatial grammar tailored to user task posture.

### Surface 1: The Counselor Workspace (Operate Mode)
A 3-pane split-view layout optimized for 1440px+ widescreen displays with responsive graceful degradation down to 1024px tablet landscape:
1. **Left Navigation Rail (64px fixed)**: Compact vertical icons for triage queue, knowledge base, tenant configuration, and counselor profile.
2. **Conversation Queue Sidebar (340px fixed)**:
   - Top: Triage filter tabs (`ALL`, `PENDING_HUMAN`, `HUMAN_ACTIVE`, `BOT`, `CLOSED`).
   - Search bar with instant fuzzy query on userExternalId or message excerpt.
   - Vertically scrolling list of conversation cards with virtualized scrolling for high volume.
3. **Primary Center Stage (Flexible 1fr, min-width 560px)**:
   - Sticky Conversation Header: Customer ID, status badge, category badge, takeover button (`POST /chat/conversations/:id/take-over`), resolve button (`POST /chat/conversations/:id/resolve`).
   - Chronological Message Stream: Inverted bottom-docked scroll container.
   - Counselor Composer: Bottom-fixed rich input area with Send button, keyboard shortcut hints (`Ctrl+Enter` to send), and quick macro snippets.
4. **Context & RAG Inspector Panel (320px fixed, collapsible)**:
   - Real-time RAG transparency drawer showing:
     - Retrieved chunks from `pgvector` for the last customer message.
     - Document title and source link.
     - Cosine similarity score meter.
     - Bot prompt parameters currently applied.

### Surface 2: The Embeddable Widget (Customer Mode)
- **Resting Launcher State**: Unobtrusive circular trigger (56x56px) pinned to bottom-right (`bottom: 24px; right: 24px; z-index: 9999`).
- **Expanded Window**: Compact 380px width, 600px max-height (or `calc(100vh - 48px)`), with 12px viewport margins.
- **Mobile Viewport (≤ 640px)**: Instant full-bleed transition (`width: 100%; height: 100%; top: 0; left: 0; border-radius: 0`).
- **Structure**:
  - Compact header (48px) with tenant title, counselor/bot status indicator, and minimize button.
  - Scrollable message stream with transparent citation chips linking to retrieved knowledge sources.
  - Floating "Request human counselor" quick-escalation pill if customer needs human assistance.
  - Customer input bar with character count and send action.

### Density Tiers
- **Tier 1: Compact (Counselor Workspace Queue & Tables)**: Row heights 40-48px, padding 8px 12px, font size 13px. Focuses on information scanning density.
- **Tier 2: Default (Conversation Timeline & Customer Widget)**: Message gap 12px, bubble padding 10px 14px, font size 14px. Balances reading comfort with context density.
- **Tier 3: Comfortable (Settings & Document Upload Drawers)**: Form field gaps 20px, container padding 24px, font size 14-16px.

## Elevation & Depth

Assistant-IA adopts a **Flat-By-Default, Tonal Layering** architecture. Depth is communicated through calibrated luminance shifts and 1px structural borders rather than heavy, blurry drop shadows.

### Elevation Levels
- **Level 0 (Canvas Base)**: `#0B0F19`. Zero shadow, flat underlay.
- **Level 1 (Panels & Queue Items)**: `#111827`, bordered with 1px solid `#1F2937`.
- **Level 2 (Active/Hovered Card, Chat Composer)**: `#1E293B`, bordered with 1px solid `#374151`.
- **Level 3 (Dropdown Menus, Popovers, Floating Widget Window)**:
  - Background: `#111827`
  - Border: 1px solid `#374151`
  - Shadow: `0 8px 30px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.3)`
- **Level 4 (Modal Dialogs & Overlays)**:
  - Background: `#111827`
  - Backdrop: `rgba(3, 7, 18, 0.75)` with `backdrop-filter: blur(4px)`
  - Shadow: `0 20px 50px rgba(0, 0, 0, 0.65)`

### Named Rules
**The Elevation-By-State Rule.** Shadows must never appear on resting static elements. Shadows are reserved exclusively for elements that float above the spatial hierarchy (dialogs, dropdowns, floating widget).
**The Border-Over-Shadow Rule.** Never use a box-shadow to simulate an edge outline. Card separation must always be achieved with an explicit 1px border (`#1F2937`).
**The Zero-Blur Prohibition Rule.** Hard offset cartoon drop shadows (`4px 4px 0px #000`) are strictly banned. They violate enterprise decorum.

## Shapes

Shapes are geometric, controlled, and disciplined.

- **Buttons & Form Fields**: Subtle 4px radius (`rounded-sm`). Crisp, engineered feel without aggressive sharpness or rounded childishness.
- **Cards, Panels & Chat Bubbles**: 6px to 8px radius (`rounded-md` / `rounded-lg`).
- **Status Chips & Badge Tags**: Full pill radius (`rounded-full` / `9999px`), padding `2px 8px`.
- **Widget Floating Launcher**: Circular 56px (`rounded-full`).
- **Dividers & Strokes**: 1px crisp non-feathered lines.

## Components

### 1. Buttons
- **Takeover Button (Human Claim)**:
  - Background: `#10B981` (Emerald), text `#FFFFFF`, font-weight 600, radius 4px.
  - Hover: `#059669`, transition `background-color 150ms ease`.
  - Icon: UserCheck icon (16px SVG) + label "Prendre en main".
- **Primary Action (Send / Submit)**:
  - Background: `#4F46E5` (Indigo), text `#FFFFFF`, radius 4px.
  - Hover: `#4338CA`.
- **Secondary Action (Escalate / Return to Bot)**:
  - Background: `#1F2937`, border 1px solid `#374151`, text `#F9FAFB`, radius 4px.
  - Hover: `#374151`.
- **Danger Action (Delete Document / Terminate)**:
  - Background: `rgba(239, 68, 68, 0.1)`, border 1px solid `rgba(239, 68, 68, 0.3)`, text `#EF4444`.
  - Hover: `#EF4444`, text `#FFFFFF`.

### 2. Status Chips (Triage Badges)
- **BOT**: Pill badge, background `rgba(99, 102, 241, 0.12)`, text `#6366F1`, border 1px solid `rgba(99, 102, 241, 0.25)`, label "🤖 BOT".
- **PENDING_HUMAN**: Pill badge, background `rgba(245, 158, 11, 0.15)`, text `#F59E0B`, border 1px solid `rgba(245, 158, 11, 0.35)`, label "⚠️ EN ATTENTE AGENT", subtle pulse dot indicator.
- **HUMAN_ACTIVE**: Pill badge, background `rgba(16, 185, 129, 0.15)`, text `#10B981`, border 1px solid `rgba(16, 185, 129, 0.35)`, label "🟢 CONSEILLER ACTIF".
- **CLOSED**: Pill badge, background `rgba(100, 116, 139, 0.12)`, text `#94A3B8`, border 1px solid `rgba(100, 116, 139, 0.2)`, label "ARCHIVÉ".

### 3. Conversation Queue Card
- Container: Background `#111827`, border 1px solid `#1F2937`, radius 6px, padding 12px.
- Hover: Background `#1F2937`, cursor pointer.
- Active/Selected: Background `#1E293B`, border-left 3px solid `#4F46E5`.
- Elements:
  - Top row: User external ID (truncated monospace) + Relative timestamp (`il y a 3 min`).
  - Middle row: Category badge (`BUG`, `QUESTION`, `RECLAMATION`) + Status chip.
  - Bottom row: Latest message snippet (truncated single-line, text `#94A3B8`).

### 4. Message Utterance Stream
- **Customer Message (USER)**:
  - Alignment: Left.
  - Background: `#1F2937`, border 1px solid `#374151`, text `#F9FAFB`.
  - Header: "Client" with relative timestamp in tabular monospace.
  - Bubble radius: `8px 8px 8px 2px`.
- **Bot Message (ASSISTANT - Autonomous)**:
  - Alignment: Right.
  - Background: `#1E1B4B` (Deep indigo tint), border 1px solid `#3730A3`, text `#F9FAFB`.
  - Header: "Assistant IA (RAG)" + icon.
  - Bubble radius: `8px 8px 2px 8px`.
  - Footer: RAG source badge "Basé sur: [Politique de Retour §2]" (clickable opens chunk in inspector).
- **Counselor Message (ASSISTANT - Human)**:
  - Alignment: Right.
  - Background: `#064E3B` (Deep emerald tint), border 1px solid `#059669`, text `#F9FAFB`.
  - Header: `Sarah (Conseiller Support)` with verified human badge.
  - Bubble radius: `8px 8px 2px 8px`.
- **System Event Message (SYSTEM)**:
  - Alignment: Centered.
  - Style: Borderless, text `#94A3B8`, font-size 12px, italicized or flanked by subtle lines.
  - Content: "Sarah a pris en charge la conversation." or "Escalade automatique déclenchée : réponse hors base de connaissances."

### 5. RAG Retrieval Inspector
- Sticky right-side drawer displaying retrieved knowledge context for the current conversation.
- Top: Header "Contexte RAG Extrait" with count of chunks retrieved.
- Chunk Cards:
  - Container: Background `#0D1525`, border 1px solid `#1E2C4A`, radius 4px, padding 10px.
  - Header: Document title + Cosine Similarity score pill (`0.892 cos`).
  - Content: 500-character chunk text with keyword highlights.

### 6. Knowledge Base Document List
- Table/Grid layout in Workspace Knowledge section.
- Column headers: Titre, URL Source, Statut (`PROCESSED` in green, `PENDING` in amber, `FAILED` in red), Chunks Vectorisés (e.g. `3 chunks`), Date d'ajout, Actions.
- Ingestion form: Title input, Source URL input, raw text textarea, submit button with vectorization progress state.

## Do's and Don'ts

### Do:
- **Do** format all timestamps, token counts, and UUIDs with monospace or tabular numbers (`tnum`).
- **Do** display the exact RAG chunk citations that generated an autonomous response.
- **Do** present clear, instantaneous visual feedback when a conversation shifts from `BOT` to `PENDING_HUMAN` or `HUMAN_ACTIVE`.
- **Do** maintain a strict 4.5:1 minimum contrast ratio across all text and icon indicators.
- **Do** support full keyboard navigation (`Tab` index order, `Esc` to close overlays, `Ctrl+Enter` to dispatch messages).
- **Do** provide rich loading skeleton states matching exact card dimensions rather than centered spinning wheels.

### Don't:
- **Don't** use purple-to-pink gradient text, pulsing neon glows, or glowing robot head avatars.
- **Don't** nest cards inside cards. Group content using typographic hierarchy and subtle 1px dividers.
- **Don't** place eyebrow kickers (small uppercase tags) above main headings.
- **Don't** hide conversation history or handoff trigger causes when a counselor claims a thread.
- **Don't** display fake user reviews, simulated satisfaction stars, or unverified statistical claims.
- **Don't** allow the customer widget to pollute host page CSS; enforce scoped styles or Shadow DOM boundary.
- **Don't** use emojis as functional icons. Use authored, consistent SVGs (Heroicons or Lucide).
