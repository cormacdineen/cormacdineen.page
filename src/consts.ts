// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

interface SocialLink {
  href: string;
  label: string;
}

interface Site {
  website: string;
  author: string;
  profile: string;
  desc: string;
  title: string;
  ogImage: string;
  lightAndDarkMode: boolean;
  postPerIndex: number;
  postPerPage: number;
  scheduledPostMargin: number;
  showArchives: boolean;
  showBackButton: boolean;
  editPost: {
    enabled: boolean;
    text: string;
    url: string;
  };
  dynamicOgImage: boolean;
  lang: string;
  timezone: string;
}

// Site configuration
export const SITE: Site = {
  website: "https://cormacdineen.page/",
  author: "Cormac Dineen",
  profile: "https://cormacdineen.page/about",
  desc: "PhD student. Blog, photos and recommendations.",
  title: "Cormac Dineen",
  ogImage: "og.png",
  lightAndDarkMode: true,
  postPerIndex: 10,
  postPerPage: 10,
  scheduledPostMargin: 15 * 60 * 1000,
  showArchives: false,
  showBackButton: false,
  editPost: {
    enabled: false,
    text: "Edit on GitHub",
    url: "",
  },
  dynamicOgImage: true,
  lang: "en",
  timezone: "Europe/London",
};

export const SITE_TITLE = SITE.title;
export const SITE_DESCRIPTION = SITE.desc;

// Navigation links
export const NAV_LINKS: SocialLink[] = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/photography", label: "Photography" },
  { href: "/recommendations", label: "Cultural stew" },
  { href: "/about", label: "About" },
];

// Social media links
export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: "https://github.com/cormacdineen",
    label: "GitHub",
  },
  {
    href: "https://orcid.org/0009-0006-5969-2226",
    label: "ORCID",
  },
  {
    href: "https://www.linkedin.com/in/cormac-dineen-262918149/",
    label: "LinkedIn",
  },
  {
    href: "https://open.spotify.com/user/ncwlzlrq8rzt1ifp08ina5u77",
    label: "Spotify",
  },
  {
    href: "/rss.xml",
    label: "RSS",
  },
];

// Icon map for social media
export const ICON_MAP: Record<string, string> = {
  GitHub: "github",
  ORCID: "orcid",
  LinkedIn: "linkedin",
  RSS: "rss",
  Spotify: "spotify",
  Email: "mail",
};
