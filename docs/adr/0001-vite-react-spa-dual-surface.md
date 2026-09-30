# 0001. Vite React SPA with Dual-Surface Architecture

We chose a Vite + React 19 Single-Page Application (SPA) in `frontend/` delivering both the embeddable customer chat widget and the enterprise operations workspace, rather than Next.js or separate repositories.

Because the backend is already a dedicated NestJS REST service, introducing Next.js would add redundant server runtime complexity without SEO benefits. A Vite SPA cleanly outputs both the operational workspace app and a lightweight standalone `widget.js` bundle sharing the same design system tokens.
