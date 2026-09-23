# Xebure premium monochrome redesign

## Outcome
Transform the complete existing product into a cohesive obsidian-and-silver Xebure interface while preserving every route, real data flow, authentication rule, upload, payment, and API.

## Build plan
1. Replace the global Netflix/red visual system with the supplied monochrome tokens, typography, cinematic background, surfaces, shadows, focus states, and reduced-motion rules.
2. Install and adapt the supplied VengeanceUI components, keeping only dependencies that are safe for this React/Vite application.
3. Create reusable Xebure primitives for premium cards, metallic branding, animated primary actions, text reveals, numbers, loading, search, people, folders, FAQ, and content showcases.
4. Integrate those primitives into real product locations: startup, landing, dashboard, existing search/filter screens, HR documents/resumes, FAQ/support, profiles, and existing project/showcase content.
5. Refactor all existing pages away from legacy color/glow classes to neutral semantic styling without changing their business logic.
6. Verify public, authentication, intern, HR, and admin experiences across desktop and mobile; fix overflow, accessibility, reduced-motion, runtime, and build issues.
7. Run a final branding/color audit to remove Netflix, DevForge, red, purple, pink, green, orange, and legacy theme terminology from product-facing code.

## Technical details
- Preserve current route-level lazy loading and dynamically load the heaviest visual effects.
- Use semantic theme tokens throughout; no page-level hardcoded colors.
- Keep the startup sequence short and remove it from the document after completion.
- Connect visual replacements to existing state and database queries rather than mock data.
- Avoid permanent particle layers, component-demo sections, duplicate search systems, or blocking overlays.
