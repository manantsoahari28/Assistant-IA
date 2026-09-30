# 0003. Two-Tier Escalation with Native Tool Calling

We chose a two-tier escalation architecture: a fast deterministic regex filter for explicit customer handoff demands executed before the LLM, coupled with native Gemini Tool Calling (`escalate_to_counselor`) for autonomous bot escalation when knowledge documents are insufficient.

Pure regex parsing on LLM output (`[ESCALATE_TO_HUMAN]` or `/pas d'information/`) suffers from false positives on helpful partial answers and risks leaking prompt tags to the widget. Pre-filtering explicit customer requests avoids unnecessary LLM latency and cost, while native tool calling provides structured, typed arguments (reason, counselor summary, user message) with zero risk of prompt leakage.
