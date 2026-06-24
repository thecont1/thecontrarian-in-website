/**
 * FEATURED CONTENT - Manual control for homepage "The Projects" section
 */

export type FeaturedItemType = "post" | "essay" | "longform" | "photogallery" | "code" | "datastory";

export interface FeaturedItem {
  /** The content collection type */
  type: FeaturedItemType;

  /** The slug (filename without extension) of the content */
  slug: string;

  /** Optional: Override the display title */
  displayTitle?: string;

  /** Optional: Override the subtitle/description */
  displaySubtitle?: string;

  /** Optional: Override the hero image */
  displayImage?: string;

  /** Optional: Custom label (e.g., "Featured", "New", "Updated") */
  label?: string;
}

/**
 * Section groupings for the homepage (optional)
 * Use this if you want to group featured items by category
 */
export interface FeaturedSection {
  title: string;
  items: FeaturedItem[];
}

/**
 * Featured items for "The Projects" section on the homepage.
 * Order matters - items appear in the order listed here.
 */
export const FEATURED_ITEMS: FeaturedItem[] = [
  { type: "essay", slug: "fictional"},
  { type: "datastory", slug: "nammametro", displayTitle: "The NammaMetro Ridership Inspector"},
];

export const FEATURED_SECTIONS: FeaturedSection[] = [
  {
    title: "Photography",
    items: [
      { type: "photogallery", slug: "ayodhya", label: "Album" },
      { type: "photogallery", slug: "kashmir", label: "Album" },
    ]
  },

  {
    title: "A Life Worth Living Twice",
    items: [
      { type: "essay", slug: "ayodhya", label: "Politics" },
      { type: "post", slug: "writefathername", label: "Patriarchy" },
    ]
  },

  {
    title: "MATRIMANIA",
    items: [
      { type: "essay", slug: "matrimania-bond-and-bondage", displayTitle: "Bond & Bondage: Essay", label: "Essay"},
      { type: "photogallery", slug: "matrimania-series", label: "Series" },
      { type: "photogallery", slug: "matrimania-photobook", label: "Book" },
    ]
  },

  {
    title: "The African Portraits",
    items: [
      { type: "photogallery", slug: "the-african-portraits", label: "Series" },
      { type: "longform", slug: "the-burden-of-being-seen-and-heard", displayTitle: "The _____ Burden of Being Seen and Heard", label: "Long Read"},
    ]
  },

  {
    title: "Data Science",
    items: [
      { type: "datastory", slug: "bangalore-metro-conspiracy-theory"},
      { type: "datastory", slug: "bangalore-metro-phenomena-inspector"},
      { type: "datastory", slug: "traffic-monitor-lizard"},
      { type: "datastory", slug: "rolling-relative-route-scoring-system"},
      { type: "datastory", slug: "aditya-L1-solar-explorer"},
    ]
  },

  {
    title: "Digital Products",
    items: [
      { type: "code", slug: "flatwrite"},
      { type: "code", slug: "traffic-oracle"},
      { type: "code", slug: "india-votes-data"},
      { type: "code", slug: "c2pa-viewer"},
      { type: "code", slug: "ngl-storyteller"},
    ]
  },
];
