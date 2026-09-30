# 0004. Head and Tail Context Budgeting for Chat Memory

We chose a Head + Tail Context Budgeting pattern for conversation history injection into the LLM, systematically preserving the initial customer inquiry (Message 1) alongside the most recent messages up to a 6,000-token ceiling.

A rigid 10-message sliding window creates "Anchor Amnesia", dropping the customer's initial order identifier or problem statement after 5 back-and-forth turns. Given Gemini's expansive context window, anchoring the originating message while sliding the recent tail prevents customer frustration without incurring the latency or cost of continuous recursive summarization.
