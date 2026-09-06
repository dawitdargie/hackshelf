import type { BookCardData } from "@/components/ui/BookCard";

// Temporary sample data for visual verification (Phase 12 demo page).
// Replaced by real API data in Phase 13; sample covers live in /public/samples.
export const SAMPLE_BOOKS: BookCardData[] = [
  {
    id: "1",
    title: "The Web Application Hacker's Field Guide",
    slug: "web-app-hacking",
    cover_url: "/samples/cover-1.svg",
    level: { name: "Beginner", slug: "beginner" },
    rating: { average: 4.5, count: 23 },
    authors: ["Alice Hacker"],
  },
  {
    id: "2",
    title: "Network Reconnaissance Deep Dive",
    slug: "network-recon",
    cover_url: "/samples/cover-2.svg",
    level: { name: "Advanced", slug: "advanced" },
    rating: { average: 4.0, count: 11 },
    authors: ["Bob Cryptographer"],
  },
  {
    id: "3",
    title: "OWASP Testing Principles in Practice",
    slug: "owasp-testing",
    cover_url: "/samples/cover-3.svg",
    level: { name: "Beginner", slug: "beginner" },
    rating: { average: 5.0, count: 42 },
    authors: ["OWASP Community"],
  },
  {
    id: "4",
    title: "Cryptography Field Notes: From XOR to Elliptic Curves",
    slug: "crypto-field-notes",
    cover_url: "",
    level: { name: "Advanced", slug: "advanced" },
    rating: { average: 3.5, count: 7 },
    authors: ["Bob Cryptographer", "Eve Analyst"],
  },
];
