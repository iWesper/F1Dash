// Lightweight flags.
//
// react-world-flags bundles every flag in the world (~3.7 MB) into the JS
// bundle. We only ever show a few dozen, so instead we render on-demand SVGs
// from flagcdn.com keyed by ISO 3166-1 alpha-2 code. This keeps the bundle
// tiny; flags lazy-load as images and simply don't render when offline.

// Driver / constructor nationalities → alpha-2.
export const nationalityToCode = {
  British: "gb",
  German: "de",
  Dutch: "nl",
  Thai: "th",
  Monegasque: "mc",
  Finnish: "fi",
  French: "fr",
  Spanish: "es",
  Canadian: "ca",
  Australian: "au",
  Mexican: "mx",
  Russian: "ru",
  Danish: "dk",
  Swedish: "se",
  Italian: "it",
  Belgian: "be",
  Polish: "pl",
  Japanese: "jp",
  Brazilian: "br",
  American: "us",
  Indonesian: "id",
  Chinese: "cn",
  Portuguese: "pt",
  Venezuelan: "ve",
  Argentine: "ar",
  Argentinian: "ar",
  Colombian: "co",
  NewZealander: "nz",
  Indian: "in",
  Irish: "ie",
  Austrian: "at",
  Uruguayan: "uy",
  Rhodesian: "zw",
  Liechtensteiner: "li",
  Swiss: "ch",
  SouthAfrican: "za",
  Hungarian: "hu",
  EastGerman: "de",
};

// Circuit-location country names (as returned by Ergast/Jolpica) → alpha-2.
export const countryToCode = {
  Australia: "au",
  Austria: "at",
  Azerbaijan: "az",
  Bahrain: "bh",
  Belgium: "be",
  Brazil: "br",
  Canada: "ca",
  China: "cn",
  France: "fr",
  Germany: "de",
  Hungary: "hu",
  India: "in",
  Italy: "it",
  Japan: "jp",
  Korea: "kr",
  Malaysia: "my",
  Mexico: "mx",
  Monaco: "mc",
  Morocco: "ma",
  Netherlands: "nl",
  Portugal: "pt",
  Qatar: "qa",
  Russia: "ru",
  "Saudi Arabia": "sa",
  Singapore: "sg",
  "South Korea": "kr",
  Spain: "es",
  Switzerland: "ch",
  Turkey: "tr",
  UAE: "ae",
  UK: "gb",
  "United Arab Emirates": "ae",
  "United Kingdom": "gb",
  "United States": "us",
  USA: "us",
  Vietnam: "vn",
};

export function Flag({ code, name = "", className = "flag" }) {
  if (!code) return null;
  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      className={className}
      alt={name ? `${name} flag` : ""}
      width="22"
      loading="lazy"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
