import { defineCollection, reference, z } from "astro:content";
import { glob } from "astro/loaders";

const geographyEnum = z.enum([
  "india", "africa", "europe", "usa", "asia", "middle-east", "airtime",
  "bangalore", "ayodhya", 
  "uttar pradesh", "delhi", "kerala", "tamil nadu", "maharashtra", "west bengal", "gujarat", "rajasthan", "madhya pradesh", "chhattisgarh", "odisha", "jharkhand", "bihar", "sikkim", "tripura", "meghalaya", "mizoram", "nagaland", "arunachal pradesh", "assam", "manipur"
]);
const themeEnum = z.enum([
  "weddings", "travel", "society", "justice", "technology", "motorcycling", "patriarchy", "reporting",
  "humour", "interview", "lore", "night", "racism", "india", "portraits", "religion", "politics", "nationalism", "history",
  "book", "photobook", "prize", "mfa", "thesis", "digital", "photography", "essay"
]);
const containerEnum = z.enum([
  "matrimania", "the-african-portraits", "last-days-of-manmohan", "magazine-work",
  "indiacomestogether", "caerdydd-diary", "bruxelles-diary", "conakry-diary", "facebook",
  "ayodhya"
]);

const baseSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  author: z.string(),
  status: z.enum(["private", "draft", "published"]),
  heroImage: z.string().optional(),
  metaDescription: z.string().max(160).optional(),
  geography: z.array(geographyEnum).max(3).optional().default([]),
  theme: z.array(themeEnum).max(6).optional().default([]),
  container: containerEnum.optional(),
  date: z.date().optional(),
  lightbox: z.object({
    gallery: z.boolean().optional().default(true),
  }).optional().default({ gallery: true }),
  toc: z.boolean().optional().default(false),
  backgroundColor: z.string().optional(),
  showhero: z.boolean().optional().default(true)
});

const postSchema = baseSchema.extend({
  category: z.string().optional(),
});

const essaySchema = baseSchema.extend({
  readingTime: z.number().optional(),
  series: z.string().optional(),
  category: z.string().optional(),
});

const longformSchema = baseSchema.extend({
  parts: z.array(z.object({
    title: z.string(),
    slug: z.string(),
  })).optional(),
  currentPart: z.number().optional(),
  totalParts: z.number().optional(),
  category: z.string().optional(),
});

const codeSchema = z.object({
  status: z.enum(["private", "draft", "published"]).default("draft"),
  title: z.string(),
  description: z.string().optional(),
  repoOwner: z.string(),
  repoName: z.string(),
  repoEmail: z.string().optional(),
  author: z.string(),
  createdDate: z.date().optional(),
  lastUpdated: z.date().optional(),
  repoUrl: z.string().url().or(z.literal("")).optional().transform(v => v || undefined),
  readmeUrl: z.string().url().or(z.literal("")).optional().transform(v => v || undefined),
  branch: z.string().optional().default("main"),
  appUrl: z.string().url().or(z.literal("")).optional().transform(v => v || undefined),
  heroImage: z.string().optional(),
  tags: z.array(z.string()).default([]),
  license: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Datastory schema — a discriminated union on `format`.
// ---------------------------------------------------------------------------
//
// Two variants share the same base fields (title, subtitle, author, status,
// heroImage, geography, theme, date, toc, lightbox, etc.) and add their own
// format-specific fields at the TOP LEVEL (no `notebook:` or `scrolly:`
// wrapper — the discriminator is the format field itself).
//
// The format NEVER appears in the public URL, title, listing, or any
// public-facing artifact. It is a build-time choice only. The slug in
// the .md file is the URL slug, regardless of format.
//
// Notebook variant:
//
//   format: notebook
//   engine: jupyter | marimo
//   entry: <live url to .ipynb file>
//   excludeCodeCells: true|false   (optional, default false)
//
// Scrolly variant:
//
//   format: scrolly
//   source: <path to the scrolly project directory>
//   baseUrl: <URL prefix under which the scrolly is served>
//
// ---------------------------------------------------------------------------

const datastoryBaseSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  metaDescription: z.string().max(160).optional(),
  author: z.string(),
  status: z.enum(["private", "draft", "published"]),
  heroImage: z.string().optional(),
  geography: z.array(geographyEnum).max(2).optional().default([]),
  theme: z.array(z.string()).max(5).optional().default([]),
  date: z.date().optional(),
  toc: z.boolean().optional().default(false),
  lightbox: z.object({
    gallery: z.boolean().optional().default(true),
  }).optional().default({ gallery: true }),
  backgroundColor: z.string().optional(),
  showhero: z.boolean().optional().default(true),
});

const datastoryNotebookSchema = datastoryBaseSchema.extend({
  format: z.literal("notebook"),
  engine: z.enum(["marimo", "jupyter"]),
  entry: z.string(),
  excludeCodeCells: z.boolean().optional().default(false),
});

const datastoryScrollySchema = datastoryBaseSchema.extend({
  format: z.literal("scrolly"),
  // Path to the scrolly project directory (relative to the Astro project
  // root, or absolute). Must contain its own package.json, vite.config.js,
  // src/, public/data/, etc.
  source: z.string(),
  // URL prefix under which the scrolly is served. Same as the slug's URL
  // path. The build script invokes `vite build --base=<baseUrl>` so the
  // scrolly's own vite.config.js `base` is overridden at production build
  // time.
  baseUrl: z.string(),
});

const datastorySchema = z.discriminatedUnion("format", [
  datastoryNotebookSchema,
  datastoryScrollySchema,
]);

const photogallerySchema = z.object({
  status: z.enum(["private", "draft", "published"]),
  project: z.union([z.string(), z.array(z.string())]).optional(),
  title: z.string(),
  subtitle: z.string(),
  metaDescription: z.string().max(160).optional(),
  author: z.string(),
  category: z.string().optional(),
  heroImage: z.string().optional(),
  date: z.date().optional(),
  layoutType: z.enum(["tile", "one-up", "carousel"]).default("tile"),
  geography: z.array(geographyEnum).max(3).optional().default([]),
  theme: z.array(themeEnum).max(6).optional().default([]),
  images: z.array(z.object({
    src: z.string(),
    caption: z.string().optional(),
    alt: z.string().optional(),
  })).default([]),
  lightbox: z.object({
    gallery: z.boolean().optional().default(true),
  }).optional().default({ gallery: true }),
  backgroundColor: z.string().optional().nullable(),
  showhero: z.boolean().optional().default(true),
});

const projectSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  author: z.string(),
  status: z.enum(["private", "draft", "published"]),
  heroImage: z.string().optional(),
  photogalleries: z.array(reference("photogallery")).optional().default([]),
  essays: z.array(reference("essay")).optional().default([]),
  longforms: z.array(reference("longform")).optional().default([]),
  posts: z.array(reference("post")).optional().default([]),
  datastories: z.array(reference("datastory")).optional().default([]),
  code: z.array(reference("code")).optional().default([]),
  geography: z.array(geographyEnum).max(2).optional().default([]),
  theme: z.array(themeEnum).max(5).optional().default([]),
  date: z.date().optional(),
  backgroundColor: z.string().optional(),
  showhero: z.boolean().optional().default(true),
});

// Content collection glob: only scan top-level .md/.mdx files.
// Scrolly subdirectories (e.g. content/datastory/<slug>/) hold the
// scrolly Vite project's own source — README, package notes, etc. —
// and must NOT be picked up as content entries. Recursion into
// subdirs was a footgun: a stray README.md in a scrolly's source
// would be loaded as a datastory entry and fail schema validation.
const markdownLoader = (collection: string) => glob({
  base: `./content/${collection}`,
  pattern: "*.{md,mdx}",
  generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/i, ""),
});

export const collections = {
  post: defineCollection({ loader: markdownLoader("post"), schema: postSchema }),
  essay: defineCollection({ loader: markdownLoader("essay"), schema: essaySchema }),
  longform: defineCollection({ loader: markdownLoader("longform"), schema: longformSchema }),
  code: defineCollection({ loader: markdownLoader("code"), schema: codeSchema }),
  datastory: defineCollection({ loader: markdownLoader("datastory"), schema: datastorySchema }),
  photogallery: defineCollection({ loader: markdownLoader("photogallery"), schema: photogallerySchema }),
  project: defineCollection({ loader: markdownLoader("project"), schema: projectSchema }),
};
