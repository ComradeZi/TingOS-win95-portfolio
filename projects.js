/* =============================================================================
 *  GRID//LOOP — PROJECT DATA
 *  -----------------------------------------------------------------------------
 *  This is the ONLY file you need to touch to change your portfolio.
 *  Add, remove, reorder or edit entries below and the corridor rebuilds itself
 *  automatically.  The HTML / CSS / 3D code never needs to change.
 *
 *  Keep the top-level variable name exactly `window.PROJECTS`.
 *
 *  ASPECT RATIOS ARE AUTOMATIC.
 *  Wall frames scale to each cover's real ratio, and the popup gallery shows
 *  every image at its natural ratio (portrait / square / wide), so mixed
 *  dimensions like 4:6, 16:9, 9:16 and 1:1 all display without stretching.
 *
 *  FIELD GUIDE
 *  -----------------------------------------------------------------------------
 *  id           string   unique short slug (used as a key; avoid spaces)
 *  title        string   project name shown in the popup
 *  category     string   e.g. "Brand", "Motion", "3D", "Editorial"
 *  year         string   e.g. "2025"
 *  type         "image"  -> the "cover" kind; affects the wall-frame fallback
 *               "video"  -> same, for video-led projects
 *  thumb        string   image shown on the corridor wall frame (the cover).
 *                        Any aspect ratio works — the frame fits it.
 *  media        string   single cover image/video URL (fallback when no gallery)
 *  gallery      array    (optional) a 3-column grid of up to 12 items shown in
 *                        the popup. Items can be a URL string (video auto-
 *                        detected by extension) or { type, src, thumb }.
 *  description  string   short paragraph shown under the media.
 *  role         string   your role on the project (e.g. "Designer / Developer")
 *  client       string   who the project was for
 *  tools        string[] tools / software used
 *  duration     string   how long it took (e.g. "3 weeks", "Q1 2025")
 *  caseStudy    string[] longer multi-paragraph write-up shown in the popup sidebar
 *  tags         string[] short keywords shown as chips.
 *  link         string   (optional) external URL; shown as a button when set.
 * ========================================================================== */

// Shared demo video used across the sample galleries — delete this and write
// your own URLs directly if you prefer.
const DEMO_VIDEO = {
  type: "video",
  src: "assets/07_IGF.mp4",
  thumb: "assets/thumb-5-motion.png"
};

// Selectable avatar characters (swap via the admin editor, Ctrl+Shift+E).
// Each GLB ships with Idle / Walk / Run clips on a Mixamo-named skeleton, so any
// entry here animates the same way. Add more by dropping a GLB in assets/characters.
window.CHARACTERS = [
  { id: "duck",        label: "Duck",             url: "assets/characters/duck.glb" },
  { id: "schoolkid",   label: "Schoolkid",        url: "assets/characters/schoolkid.glb" },
  { id: "courier",     label: "Delivery Courier", url: "assets/characters/courier.glb" },
  { id: "firefighter", label: "Firefighter",      url: "assets/characters/firefighter.glb" }
];

// About / contact panel (opened by the ABOUT button in the top-right, or #about).
// Edit name, role, bio, status and links here — no HTML editing needed.
window.ABOUT = {
  name: "BARTON",
  role: "Designer / Developer",
  status: "AVAILABLE FOR WORK",
  bio: [
    "Placeholder bio — replace this with a short line about who you are and what you make.",
    "A second line for anything else you'd like to say."
  ],
  links: [
    { label: "EMAIL",     value: "you@example.com", url: "mailto:you@example.com" },
    { label: "GITHUB",    value: "github.com/you",  url: "https://github.com/" },
    { label: "INSTAGRAM", value: "@you",            url: "https://instagram.com/" },
    { label: "LINKEDIN",  value: "in/you",          url: "https://linkedin.com/" }
  ]
};

window.PROJECTS = [
  {
    id: "sector",
    title: "SECTOR // 01",
    category: "Visual Identity",
    year: "2025",
    type: "image",
    thumb: "assets/ratio-4x6.png",   // 4:6 portrait cover -> tall wall frame
    media: "assets/ratio-4x6.png",
    gallery: [
      "assets/ratio-4x6.png",
      "assets/thumb-2-horizon.png",
      "assets/ratio-9x16.png",
      "assets/ratio-1x1.png",
      DEMO_VIDEO,
      "assets/thumb-1-sector.png",
      "assets/ratio-9x16.png",
      "assets/thumb-4-prism.png",
      "assets/ratio-4x6.png",
      "assets/thumb-5-motion.png",
      "assets/ratio-1x1.png",
      "assets/thumb-3-circuit.png"
    ],
    description:
      "A radial radar composition exploring depth, repetition and the grid as a self-contained visual system.",
    role: "Art Director",
    client: "Studio NEO",
    tools: ["VectorCraft", "Three.js", "Figma"],
    duration: "3 weeks",
    caseStudy: [
      "SECTOR began as a study in depth — whether a few concentric rings and cross-hairs could read as a full spatial system.",
      "The final identity leans on repetition and restraint: one accent color, monospace type, and the grid doing most of the heavy lifting."
    ],
    tags: ["Art Direction", "Generative", "Neon"],
    link: "https://github.com/storytold/vectorcraft"
  },
  {
    id: "horizon",
    title: "HORIZON // 02",
    category: "Key Art",
    year: "2024",
    type: "image",
    thumb: "assets/thumb-2-horizon.png",   // 16:9 wide cover
    media: "assets/thumb-2-horizon.png",
    gallery: [
      "assets/thumb-2-horizon.png",
      "assets/ratio-1x1.png",
      "assets/ratio-4x6.png",
      "assets/thumb-1-sector.png",
      "assets/ratio-9x16.png",
      DEMO_VIDEO,
      "assets/thumb-3-circuit.png",
      "assets/thumb-5-motion.png",
      "assets/ratio-1x1.png",
      "assets/thumb-4-prism.png",
      "assets/ratio-4x6.png",
      "assets/thumb-2-horizon.png"
    ],
    description:
      "A synthetic sunrise over a wireframe plane — a study in how a single filled form can read as a sun against a field of neon horizon lines.",
    role: "Illustrator",
    client: "Horizon Records",
    tools: ["VectorCraft", "Photoshop"],
    duration: "1 week",
    caseStudy: [
      "HORIZON is a synthetic sunrise — a single filled disc floating above a field of neon horizon lines.",
      "It was built to test how far a minimalist palette could go before a poster started to feel empty. The answer: further than expected."
    ],
    tags: ["Illustration", "Color", "Poster"],
    link: "https://example.com/horizon"
  },
  {
    id: "circuit",
    title: "CIRCUIT // 03",
    category: "Motion Graphics",
    year: "2024",
    type: "image",
    thumb: "assets/ratio-9x16.png",   // 9:16 tall cover -> tall wall frame
    media: "assets/ratio-9x16.png",
    gallery: [
      "assets/ratio-9x16.png",
      "assets/thumb-4-prism.png",
      DEMO_VIDEO,
      "assets/ratio-1x1.png",
      "assets/thumb-2-horizon.png",
      "assets/ratio-4x6.png",
      "assets/thumb-3-circuit.png",
      "assets/thumb-5-motion.png",
      "assets/ratio-9x16.png",
      "assets/thumb-1-sector.png",
      "assets/ratio-1x1.png",
      "assets/thumb-3-circuit.png"
    ],
    description:
      "A schematic trace of routed signal paths and nodes. Developed as a style frame for a title sequence about connected infrastructure.",
    role: "Motion Designer",
    client: "Gridline Co.",
    tools: ["FilmCraft", "After Effects", "Illustrator"],
    duration: "2 weeks",
    caseStudy: [
      "CIRCUIT was a style frame for a title sequence about connected infrastructure.",
      "Signal paths were routed like a schematic, with nodes marking where one idea hands off to the next — so the sequence could be read as a map."
    ],
    tags: ["Style Frame", "Title Design", "Diagram"],
    link: "https://example.com/circuit"
  },
  {
    id: "prism",
    title: "PRISM // 04",
    category: "Generative Art",
    year: "2023",
    type: "image",
    thumb: "assets/ratio-1x1.png",   // 1:1 square cover
    media: "assets/ratio-1x1.png",
    gallery: [
      "assets/ratio-1x1.png",
      "assets/thumb-5-motion.png",
      "assets/ratio-4x6.png",
      "assets/thumb-3-circuit.png",
      "assets/thumb-2-horizon.png",
      "assets/ratio-9x16.png",
      DEMO_VIDEO,
      "assets/thumb-1-sector.png",
      "assets/ratio-4x6.png",
      "assets/thumb-5-motion.png",
      "assets/ratio-1x1.png",
      "assets/thumb-4-prism.png"
    ],
    description:
      "Nested triangular prisms with radiating spokes — a refraction study translated into pure vector line-work and a single accent color.",
    role: "Generative Artist",
    client: "Self-initiated",
    tools: ["VectorCraft", "Processing"],
    duration: "4 days",
    caseStudy: [
      "PRISM is a refraction study translated into pure vector line-work.",
      "Nested triangles and radiating spokes explore how a single accent color can hold an entire composition together."
    ],
    tags: ["Generative", "Geometry", "Print"],
    link: "https://example.com/prism"
  },
  {
    id: "motion-reel",
    title: "MOTION REEL // 05",
    category: "Showreel",
    year: "2025",
    type: "video",
    thumb: "assets/thumb-5-motion.png",   // 16:9 poster
    media: "assets/07_IGF.mp4",
    gallery: [
      DEMO_VIDEO,
      "assets/thumb-5-motion.png",
      "assets/ratio-9x16.png",
      "assets/ratio-1x1.png",
      "assets/thumb-1-sector.png",
      "assets/ratio-4x6.png",
      "assets/thumb-3-circuit.png",
      "assets/thumb-2-horizon.png",
      "assets/ratio-9x16.png",
      "assets/thumb-4-prism.png",
      "assets/ratio-1x1.png",
      "assets/thumb-5-motion.png"
    ],
    description:
      "A short motion reel. Video cells get a native play bar; image cells click through to full-screen. Replace the sample URLs with your own work.",
    role: "Editor / Compositor",
    client: "Various",
    tools: ["FilmCraft", "Premiere Pro", "After Effects"],
    duration: "Ongoing",
    caseStudy: [
      "The showreel compiles motion work from the last two years.",
      "Every clip is timed to the same beat, so the cut feels continuous rather than like a list of disconnected shots."
    ],
    tags: ["Reel", "Video", "Edit"],
    link: "https://example.com/reel"
  }
];
