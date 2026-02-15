import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const markdownContent = `# Cormac Dineen

PhD researcher. Photography, reading, and occasional writing.

## Navigation

- [About](/about.md)
- [Blog](/blog)
- [Photography](/photography)
- [Cultural stew](/recommendations)
- [RSS Feed](/rss.xml)

---

*Visit [cormacdineen.page](https://cormacdineen.page) for the full experience.*`;

  return new Response(markdownContent, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
