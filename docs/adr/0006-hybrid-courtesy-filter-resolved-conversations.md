# 0006. Hybrid Courtesy Filter for Resolved Conversations

We chose a two-stage hybrid courtesy classification strategy on conversations in the `RESOLVED` state: a zero-latency regex check for short common gratitude phrases (< 40 characters) followed by a lightweight zero-shot LLM classification for longer ambiguous messages.

Pure regex heuristics fail on complex expressions of gratitude followed by secondary issues, while running an LLM on every "Thank you!" creates needless latency and inference cost on 90% of closing exchanges. The hybrid approach resolves trivial pleasantries in under 5ms without disturbing counselors, while accurately reopening conversations when genuine secondary inquiries arise.
