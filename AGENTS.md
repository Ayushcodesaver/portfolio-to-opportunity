# Architecture Decisions

- Keep premium visual effects lazy, reduced-motion-aware, and connected to live product data; this preserves performance and prevents demo-only UI.
- Keep the homepage 3D robot illustration isolated from page copy and load it only where shown, so the marketing page stays readable and the visual stays lightweight.
- Keep the spider cursor in a lazy-loaded, site-wide fixed canvas with fine-pointer and reduced-motion guards, mounted once outside route content so it persists across navigation without intercepting interaction.
