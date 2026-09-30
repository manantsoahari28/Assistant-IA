# 0005. Triple-Responsibility Escalation Tool Schema

We chose a single structured Gemini function calling definition `escalate_to_counselor({ reason, counselorSummary, publicCustomerMessage })` instead of a minimal flag or multi-step prompting.

When an autonomous bot determines it cannot resolve a customer inquiry, generating both a reassuring public message for the customer and an internal diagnostic summary for human counselors in the same inference pass eliminates extra LLM round-trips. Storing `counselorSummary` in message metadata allows the Workspace triage queue to display immediate incident summaries, reducing counselor ramp-up time and mean time to resolution (MTTR).
