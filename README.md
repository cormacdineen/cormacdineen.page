# Cormac Dineen's Academic Portfolio

Personal website and portfolio built with [Astro](https://astro.build) and deployed on [Vercel](https://vercel.com).

## Project Structure

```text
├── public/               # Static assets (images, fonts, favicon)
│   ├── assets/img/       # Images for blog posts, photography, recommendations
│   └── fonts/            # Web fonts (Inter)
├── src/
│   ├── components/       # Reusable UI components
│   ├── content/blog/     # Blog posts in Markdown (organized by year)
│   ├── data/             # JSON data files (recommendations.json)
│   ├── layouts/          # Page layouts and templates
│   ├── pages/            # Routes and pages
│   ├── styles/           # Global styles and CSS
│   └── utils/            # Utility functions
├── astro.config.mjs      # Astro configuration
├── vercel.json           # Vercel deployment and security headers
└── package.json          # Dependencies and scripts
```

## Pages

| Route               | Description                              |
| :------------------- | :--------------------------------------- |
| `/`                  | Home — landing page with section links   |
| `/blog`              | Blog — research updates and writing      |
| `/photography`       | Photography — image gallery              |
| `/recommendations`   | Recommendations — books, podcasts, films |
| `/about`             | About — biography and contact            |

## Commands

| Command              | Action                                      |
| :------------------- | :------------------------------------------ |
| `npm install`        | Install dependencies                        |
| `npm run dev`        | Start local dev server at `localhost:4321`   |
| `npm run build`      | Build the production site to `./dist/`       |
| `npm run preview`    | Preview the build locally before deploying   |

## Content Workflow

### Blog Posts

1. Create a `.md` file in `src/content/blog/YEAR/post-slug.md`
2. Add required frontmatter:
   ```yaml
   ---
   title: "Your Post Title"
   pubDatetime: 2026-02-12T00:00:00.000Z
   description: "Brief description for SEO and previews."
   tags:
     - research
     - topic
   ---
   ```
3. Optional frontmatter: `heroImage`, `featured: true`, `draft: true`
4. Run `npm run dev` to preview locally
5. Push to `main` — Vercel auto-deploys

### Photography

1. Resize images for web: max 2000px wide, JPEG quality 80-85 or WebP
2. Place in `public/assets/img/photography/`
3. Update the photo array in `src/pages/photography.astro`

### Recommendations

1. Edit `src/data/recommendations.json`
2. Add cover images to `public/assets/img/recommendations/`
3. Each entry: `{ "type": "book|podcast|movie", "title", "creator", "cover", "note" }`

## Deployment

Connected to Vercel for automatic builds on push to `main`. Custom domain: `cormacdineen.page`.

## License

- **Content**: [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/)
- **Code**: [MIT License](LICENSE)

## Credits

Based on the [AstroPaper theme](https://astro-paper.pages.dev/) by [Sat Naing](https://github.com/satnaing).
