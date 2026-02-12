# Instructions for Claude

This document contains instructions for Claude when working on this project.

## Critical Guidelines

### Blog Posts
- Do not create blog posts without explicit consent
- Only help with editing or fixing existing posts when asked
- Blog posts go in `src/content/blog/YEAR/post-slug.md`
- Required frontmatter: `title`, `pubDatetime` (ISO-8601), `description`, `tags`

### Development
- **Do not run `npm run dev`** in agent mode — it creates an endless loop
- Use `npm run build` to verify changes
- Always use latest stable dependency versions; never downgrade

## Project Structure

- `src/content/blog/` — Blog posts (Markdown, organized by year)
- `src/data/` — JSON data files (recommendations)
- `src/pages/` — Page templates and routing
- `src/components/` — Reusable UI components
- `src/layouts/` — Page layouts
- `src/styles/` — CSS styles (Tailwind v4, Inter font, teal accent)
- `src/consts.ts` — Global site configuration (URL, author, nav links)
- `src/constants.ts` — Social media links

## Tech Stack

- **Astro v5** — Static site generator
- **Tailwind CSS v4** — Styling (via Vite plugin)
- **React 19** — Interactive components
- **MDX** — Enhanced markdown support
- **Pagefind** — Site search
- **Vercel** — Hosting and deployment

## Site Configuration

- Site URL: `https://cormacdineen.page/`
- Font: Inter (WOFF2, local files)
- Colors: Teal accent (`#0d7377` light / `#38b2ac` dark)
- Domain and CSP headers configured in `vercel.json`
