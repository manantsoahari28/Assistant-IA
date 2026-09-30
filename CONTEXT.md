# Assistant-IA

A multi-tenant customer support platform combining retrieval-augmented AI generation with human agent collaboration.

## Core Concepts

**Tenant**:
An enterprise client organization with dedicated data boundaries, API credentials, and autonomous bot prompt settings.
_Avoid_: Account, company, workspace, organization

**Conversation**:
A single persistent support interaction thread between an end-user customer and the platform.
_Avoid_: Ticket, chat session, thread, issue

**Message**:
An individual chronological utterance within a conversation, authored by an end-user, autonomous bot, support counselor, or the system.
_Avoid_: Chat bubble, comment, entry, post

## Lifecycle States

**BOT**:
The conversation state where incoming customer messages are answered autonomously by the AI using vector-grounded documents.
_Avoid_: Autonomous mode, AI mode, auto-reply

**PENDING_HUMAN**:
The triage queue state where an automated conversation has been escalated and awaits claim by a human support counselor.
_Avoid_: Queued, waiting, escalated, on-hold

**HUMAN_ACTIVE**:
The state where a human counselor has claimed a conversation, disabling autonomous bot responses to interact directly with the customer.
_Avoid_: Taken over, manual mode, live chat

**RESOLVED**:
The intermediate cooldown state where a conversation has been addressed by a counselor or bot, awaiting customer confirmation or a 24-hour expiration before becoming permanently CLOSED.
_Avoid_: Finished, done, fixed, solved

**CLOSED**:
The immutable terminal state of a conversation after resolution and cooldown. Subsequent inquiries initiate a new conversation.
_Avoid_: Archived, ended, locked

## Surfaces & Roles

**Customer**:
The external end-user submitting inquiries through the embeddable chat widget.
_Avoid_: Client, visitor, requester, user

**Counselor**:
A human support professional who monitors the triage queue, claims escalated conversations, and resolves customer inquiries.
_Avoid_: Support agent, operator, representative, human

**Embeddable Widget**:
The lightweight floating chat interface embedded into client websites for direct customer interactions.
_Avoid_: Chatbot popup, iframe, messenger, webchat

**Workspace**:
The internal operations console used by counselors and administrators to triage conversations, inspect RAG retrieval, and configure tenant settings.
_Avoid_: Admin dashboard, agent desk, backoffice, control panel

## Knowledge & RAG

**Knowledge Document**:
A verified reference text or policy uploaded by a tenant to ground AI responses in factual context.
_Avoid_: Article, source file, knowledge base item, FAQ

**Document Chunk**:
A segmented excerpt of a knowledge document vectorized with embeddings for cosine similarity retrieval.
_Avoid_: Vector fragment, snippet, paragraph, text slice

## Triage & Escalation

**Anchor Inquiry**:
The customer's initial problem statement and identifiers preserved across conversation turns to eliminate context loss.
_Avoid_: First message, root prompt, initial ticket text

**Counselor Summary**:
A concise AI-generated diagnostic brief stored in message metadata to accelerate counselor comprehension upon escalation.
_Avoid_: Handoff note, agent summary, internal memo

**Escalation Reason**:
A standardized classification tag identifying why autonomous bot triage required counselor intervention.
_Avoid_: Handoff cause, trigger flag, escalation type

## Security & Tenancy

**API Key Hash**:
The irreversible SHA-256 cryptographic digest of an authentication secret stored in the database to prevent credential compromise.
_Avoid_: Password, auth token, api secret

**Tenant Boundary**:
The strict logical partition enforced across relational tables and vector indexes ensuring complete isolation between enterprise clients.
_Avoid_: Workspace partition, organization wall, customer perimeter
