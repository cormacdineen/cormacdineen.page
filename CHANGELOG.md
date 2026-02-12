# Changelog

## [2026-02-12] — Site Transformation

### Changed
- Transformed site from steipete.me (Peter Steinberger's blog) to cormacdineen.page (Cormac Dineen's academic portfolio)
- Replaced all branding, metadata, and identity references across the codebase
- Updated domain configuration from steipete.me to cormacdineen.page
- Changed font from Atkinson to Inter
- Changed color scheme from blue/orange to teal (#0d7377 / #38b2ac)

### Added
- New home page with section navigation cards
- `/blog` page for research updates
- `/photography` page with three gallery layout options (grid+lightbox, masonry, minimal)
- `/recommendations` page with filterable cards (books, podcasts, films)
- Updated navigation with 5 sections (Home, Blog, Photography, Recommendations, About)
- Security headers: HSTS, Permissions-Policy
- Content workflow documentation in README

### Removed
- All original blog posts (107 posts from 2012-2025)
- Newsletter subscription form (Buttondown integration)
- Legacy domain redirects (steipete.com, steipete.md)
- Peter Steinberger's avatar and office photos
