# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing backend: NestJS 10, TypeScript, Prisma ORM, PostgreSQL with `pgvector`, Google Gemini API (`gemini-3.1-flash-lite` and `text-embedding-004`), Swagger / OpenAPI.
Frontend target: Vite + React 19 Single-Page Application (SPA) with TypeScript and Tailwind CSS, structured for dual-surface delivery (Counselor Workspace & Embeddable Customer Widget).

## Users

### 1. Support Counselor (Primary Internal User)
- **Role & Profile**: Human support professional operating within client enterprise support teams.
- **Situation**: Handling high-volume customer inquiries, monitoring live triage queues, taking over complex or emotionally sensitive conversations escalated from the AI bot.
- **Job to be Done**: Quickly review conversation context, inspect vector-retrieved RAG source chunks, resolve customer issues with empathetic and factual communication, and seamlessly conclude conversations or return them to autonomous bot operation.

### 2. External Customer (Primary External End-User)
- **Role & Profile**: End-user or prospective buyer seeking timely support or information on the tenant client's website.
- **Situation**: Confronting an issue, question, or dispute, interacting via a floating embeddable chat widget.
- **Job to be Done**: Receive instantaneous, strictly factual answers to questions grounded in corporate documentation, or smoothly transition to a human counselor without losing message history when the bot cannot resolve the inquiry.

### 3. Tenant Administrator (Secondary Internal User)
- **Role & Profile**: Operations manager or customer experience lead configuring tenant parameters.
- **Situation**: Onboarding enterprise policies, managing knowledge base documents, inspecting AI bot behavior.
- **Job to be Done**: Maintain verified knowledge base documents, monitor document vectorization status, calibrate the bot's system prompt, and audit API key configurations under strict tenant isolation.

### 4. Academic Evaluator (Jury / Examiner for Sujet 4)
- **Role & Profile**: Technical jury member assessing "Sujet 4: Backend pour assistant de support client basé sur une IA".
- **Situation**: Evaluating architectural rigor, multi-tenant isolation, vector RAG retrieval precision, autonomous-to-human handoff reliability, and enterprise frontend polish.
- **Job to be Done**: Verify that the system fulfills every academic requirement: multi-tenancy, vector database embeddings, conversation state transitions, RAG citation transparency, and counselor handover mechanics.

## Product Purpose

Assistant-IA is a multi-tenant enterprise customer support platform that blends retrieval-augmented artificial intelligence with human counselor collaboration.

The platform eliminates the two major hazards of customer support automation:
1. **AI Hallucination & Fabrication**: Unbounded LLMs inventing policies, refund terms, or false specifications. Assistant-IA grounds every automated utterance strictly in vectorized tenant knowledge documents using cosine similarity over `pgvector`.
2. **Dead-End Bot Isolation**: Automated chat systems that trap frustrated customers in unhelpful loops. Assistant-IA enforces deterministic lifecycle transitions (`BOT` → `PENDING_HUMAN` → `HUMAN_ACTIVE` → `CLOSED`), allowing customer-initiated or bot-initiated escalations with zero conversational amnesia.

Success means:
- Customers receive instant, verified answers with transparent knowledge citations.
- Unresolved or high-stakes inquiries transition instantly to counselors with full conversational and retrieval context.
- Counselors manage multiple concurrent conversations with zero latency and high visual ergonomics.
- Enterprise clients maintain impenetrable data isolation across tenants.

## Positioning

Unlike generic chatbot wrappers or isolated ticketing desks, Assistant-IA is an integrated, dual-surface RAG-and-human support bridge built on strict database isolation:
- **Grounded Verification over Synthetic Fluency**: If retrieved similarity chunks cannot answer a customer's query, the AI is constrained by system directives to decline fabrication and trigger immediate human escalation (`[ESCALATE_TO_HUMAN]`).
- **Co-Piloted Triage instead of Opaque Takeover**: When a counselor claims a conversation, the bot is instantly silenced while the counselor is equipped with the exact chunks and confidence signals that guided prior responses.
- **Single Backend, Dual Surface**: One unified NestJS API powering both the ultra-lightweight client widget and the high-density counselor workspace.

## Operating Context

- **Counselor Workplace**: Desktop browser environments (1920x1080 / 1440x900 viewports), multi-monitor setups, fast keyboard-driven triage, dark/light ambient office lighting, high cognitive load during peak support hours.
- **Customer Surface**: Varied mobile and desktop web environments (320px to 4K displays), overlaying client third-party e-commerce or SaaS applications via a non-intrusive floating launcher.
- **Regulatory & Academic Environment**: Subject 4 university defense criteria requiring reproducible demonstrations: uploading a policy document, asking in-domain and out-of-domain questions, triggering handoff via natural language and API triggers, and performing counselor intervention live.

## Capabilities and Constraints

### Core Capabilities
1. **Multi-Tenant Isolation**:
   - Every database query strictly filtered by `tenantId`.
   - Tenant authentication via `x-api-key` header verified against `apiKeyHash`.
2. **Knowledge Base Ingestion & Vector RAG**:
   - Document upload (`title`, `sourceUrl`, raw text).
   - Text chunking (~500 characters) and vector embedding generation (Google `text-embedding-004`, 768 dimensions).
   - Storage in PostgreSQL using `pgvector` with index-accelerated cosine similarity search (`searchSimilarChunks`).
   - Document lifecycle tracking (`PENDING` → `PROCESSED` | `FAILED`) with chunk cascade deletion.
3. **Conversational Lifecycle Engine**:
   - `BOT`: Autonomous answering grounded in RAG chunks with conversational memory (last 10 messages).
   - `PENDING_HUMAN`: Escalated triage state. Triggered when:
     - Customer explicitly requests a human (via regex patterns or `requestHuman: true`).
     - AI bot identifies absence of grounding knowledge or outputs `[ESCALATE_TO_HUMAN]`.
     - Counselor or administrator manually escalates via `/chat/conversations/:id/escalate`.
   - `HUMAN_ACTIVE`: Counselor claims conversation via `/chat/conversations/:id/take-over`. Bot is deactivated; human messages posted via `/chat/conversations/:id/agent-message`.
   - `CLOSED`: Resolution state. Handled via `/chat/conversations/:id/resolve`, with the option to archive (`CLOSED`) or re-delegate to virtual agent (`returnToBot: true`).
4. **Tenant Configuration**:
   - Retrieve and update tenant settings (`name`, `botSystemPrompt`).

### Domain Vocabulary (Mandatory from CONTEXT.md)
- **Tenant**: Enterprise client organization with dedicated data boundaries. (_Avoid: Account, company, workspace, organization_)
- **Conversation**: Persistent support interaction thread between customer and platform. (_Avoid: Ticket, chat session, thread, issue_)
- **Message**: Chronological utterance within a conversation. (_Avoid: Chat bubble, comment, entry, post_)
- **BOT**: Autonomous AI retrieval state. (_Avoid: Autonomous mode, AI mode, auto-reply_)
- **PENDING_HUMAN**: Triage queue state awaiting human claim. (_Avoid: Queued, waiting, escalated, on-hold_)
- **HUMAN_ACTIVE**: Counselor-claimed state with bot disabled. (_Avoid: Taken over, manual mode, live chat_)
- **CLOSED**: Concluded support interaction state. (_Avoid: Resolved, archived, ended, finished_)
- **Customer**: External end-user querying through the widget. (_Avoid: Client, visitor, requester, user_)
- **Counselor**: Human support professional operating the console. (_Avoid: Support agent, operator, representative, human_)
- **Embeddable Widget**: Lightweight floating chat interface. (_Avoid: Chatbot popup, iframe, messenger, webchat_)
- **Workspace**: Internal operations console for counselors and admins. (_Avoid: Admin dashboard, agent desk, backoffice, control panel_)
- **Knowledge Document**: Verified reference text uploaded by tenant. (_Avoid: Article, source file, knowledge base item, FAQ_)
- **Document Chunk**: Segmented excerpt vectorized for similarity retrieval. (_Avoid: Vector fragment, snippet, paragraph, text slice_)

### Technical & Architectural Constraints
- No external heavy microservices: monolithic NestJS modular backend with PostgreSQL + pgvector.
- Frontend must not duplicate server logic: clean REST API integration via typed service clients.
- Embeddable widget must avoid host page CSS pollution (strict style encapsulation).

## Brand Commitments

- **Product Name**: Assistant-IA
- **Tone & Voice**: Authoritative, calm, dependable, transparent, precise.
- **Aesthetic Philosophy**: High-utility enterprise minimalism. The interface serves critical communications; it must never feel like an amateur tech demo or a toy chatbot.
- **Visual Identity Constraints**:
  - No decorative gradients or purple-blue "AI slop" clichés.
  - Deep slate/navy foundation with restrained electric sapphire/indigo accents.
  - Dedicated semantic signaling for lifecycle states:
    - `BOT`: Tech neutral / calm indigo (`#4F46E5`).
    - `PENDING_HUMAN`: Urgent amber alert (`#F59E0B`).
    - `HUMAN_ACTIVE`: Active emerald live state (`#10B981`).
    - `CLOSED`: Subdued slate gray (`#64748B`).

## Evidence on Hand

- **Existing Backend Services**:
  - `src/chat/chat.service.ts`: Verified state transitions, regex escalation heuristics, Gemini RAG integration, agent takeover, resolution.
  - `src/knowledge/knowledge.service.ts`: Document chunking, vector embeddings with Gemini, pgvector cosine similarity search.
  - `src/tenant/tenant.service.ts`: Tenant configuration management.
  - `prisma/schema.prisma`: Production PostgreSQL schema with pgvector extension and enums (`ConversationStatus`, `Category`, `DocumentStatus`, `MessageRole`).
  - `docs/adr/0001-vite-react-spa-dual-surface.md`: Architectural decision recording Vite React SPA dual-surface strategy.
  - `CRUD.md`: Contextual document specifying tenant settings and knowledge CRUD objectives.
- **Deliberate Absences**: No mock metrics, fake user ratings, or manufactured social proof. All displayed counts, timestamps, and confidence scores must derive from actual database records.

## Product Principles

1. **Grounding Precedes Fluency**: An unverified AI reply is worse than no reply. The system prioritizes strict document grounding, surfaces retrieved chunks transparently, and escalates gracefully when certainty is absent.
2. **Zero-Amnesia Handoff**: When a human counselor takes over, neither customer nor counselor should ever experience disjointed state. Full message history, escalation trigger reasons, and RAG context must be instantly visible.
3. **High-Density Operational Ergonomics**: The Counselor Workspace is a mission-critical tool. It favors information scanability, clear state signifiers, and rapid keyboard-accessible actions over decorative whitespace.
4. **Strict Context Boundaries**: Multi-tenancy is an inviolable security perimeter. Data, vector embeddings, and conversations never leak across tenant keys.
5. **No AI Clichés (Anti-Slop)**: Reject sparkling stars, pulsing neon halos, generic gradient text, and anthropomorphic robot gimmicks. Present the AI as what it is: a precise, retrieval-augmented technical tool.

## Accessibility & Inclusion

- Compliance Target: WCAG 2.1 Level AA across both surfaces.
- Contrast ratio ≥ 4.5:1 for normal body text, ≥ 3.0:1 for large display elements and state indicators.
- Full keyboard operability in both Workspace and Widget (`Tab`, `Shift+Tab`, `Enter`, `Escape` to close drawers/modals, shortcut keys for queue navigation).
- Explicit ARIA live regions (`aria-live="polite"`) for incoming messages and handoff alerts.
- Motion sensitivity: respect `prefers-reduced-motion` with functional non-animated state transitions.
