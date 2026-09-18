export type Brand = {
  slug: string;
  name: string;
  /** Optional SVG in /src/assets/logos/{slug}.svg */
  logo?: string;
};

export const brands: Brand[] = [
  { slug: "atome", name: "Atome" },
  { slug: "adidas", name: "adidas" },
  { slug: "augustman", name: "August Man" },
  { slug: "fenty", name: "Fenty" },
  { slug: "gshock", name: "G-SHOCK" },
  { slug: "levis", name: "Levi's" },
  { slug: "mensfolio", name: "Men's Folio" },
  { slug: "prada", name: "Prada" },
  { slug: "chanel", name: "Chanel" },
  { slug: "elle", name: "ELLE" },
  { slug: "vogue", name: "VOGUE" },
  { slug: "pin-prestige", name: "PIN Prestige" },
];
