const fs = require("fs");
const path = require("path");
const { createHash } = require("crypto");

const root = path.resolve(__dirname, "..");
const production = process.argv.includes("--production");
const site = production ? "https://alevit-stroy.ru/" : "https://dmitrii-vo.github.io/SaitAlevit/";
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const write = (file, value) => fs.writeFileSync(path.join(root, file), value);
const data = key => JSON.parse(read(`data/${key}.json`));
const published = key => data(key)[key].filter(item =>
  ["published", "опубликован"].includes(String(item.status).toLowerCase()),
);
const escape = value => String(value ?? "").replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
);

function catalogCards(section, items) {
  return items.map(item => {
    const details = [item.floors || item.material, item.area && `${item.area} м²`];
    if (item.price) details.push(`${item.price.toLocaleString("ru-RU")} ₽`);
    return `<article class="${section}__card">
      <div class="${section}__card-image"><img class="${section}__card-img" src="${escape(item.mainImage)}" alt="${escape(item.title)}" loading="lazy"></div>
      <div class="${section}__card-content">
        <h3 class="${section}__card-title">${escape(item.title)}</h3>
        <p>${escape(details.filter(Boolean).join(" · "))}</p>
        <p>${escape(item.description)}</p>
      </div>
    </article>`;
  }).join("\n");
}

const works = published("works");
const contacts = data("contacts");
const prices = data("prices").prices;
const businessId = site + "#company";
const region = ["Белгород", "Белгородский район"];
const schema = [
  {
    "@type": "GeneralContractor", "@id": businessId, name: "Алевит Строй",
    legalName: "ООО «АЛЕВИТ СТРОЙ»", url: site, telephone: contacts.phone,
    address: { "@type": "PostalAddress", addressCountry: "RU", addressRegion: "Белгородская область",
      addressLocality: "Пушкарное-78", streetAddress: "ул. Кузнечная, д. 9" },
    logo: site + "images/logo.png", image: site + "images/house-preview.jpg",
    areaServed: region, priceRange: `от ${prices.shell.toLocaleString("ru-RU")} ₽/м²`,
  },
  {
    "@type": "Service", name: "Строительство домов под ключ", provider: { "@id": businessId },
    areaServed: region, offers: { "@type": "Offer", priceSpecification: {
      "@type": "UnitPriceSpecification", price: prices.turnkey, priceCurrency: "RUB", unitCode: "MTK",
    } },
  },
  { "@type": "WebSite", url: site, name: "Алевит Строй", inLanguage: "ru", publisher: { "@id": businessId } },
];

const markers = works.filter(work => Number.isFinite(work.coordinates?.lat) && Number.isFinite(work.coordinates?.lng));
const substitutions = {
  ROBOTS: production ? "index, follow" : "noindex, follow",
  SITE_URL: site,
  SCHEMA: JSON.stringify({ "@context": "https://schema.org", "@graph": schema }, null, 2).replace(/</g, "\\u003c"),
  PROJECTS: catalogCards("projects", published("projects")),
  WORKS: catalogCards("works", works),
  MAP_LINKS: markers.map(({title, coordinates}) => {
    const point = `${coordinates.lng},${coordinates.lat}`;
    return `<a href="https://yandex.ru/maps/?ll=${point}&amp;pt=${point}&amp;z=16" target="_blank" rel="noopener">${escape(title)} на Яндекс Картах</a>`;
  }).join("\n"),
};

for (const page of ["index", "privacy"]) {
  const content = read(`src/html/${page}.template.html`)
    .replace(/<!-- @include (.+?) -->/g, (_, partial) => read("src/html/" + partial).trim())
    .replace(/(src|href)="(styles\.css|js\/main\.js)"/g, (_, attr, file) => {
      const version = createHash("sha256").update(read(file)).digest("hex").slice(0, 12);
      return `${attr}="${file}?v=${version}"`;
    })
    .replace(/{{([A-Z_]+)}}/g, (_, key) => {
      if (!(key in substitutions)) throw new Error(`Неизвестная переменная ${key}`);
      return substitutions[key];
    });
  write(`${page}.html`, content);
}
write("robots.txt", "User-agent: *\nAllow: /\n" + (production ? `\nSitemap: ${site}sitemap.xml\n` : ""));
// Only the main landing page is intended for indexing at launch.
const urls = "\n  <url><loc>https://alevit-stroy.ru/</loc></url>\n";
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`);
console.log(`HTML and SEO files built for ${site}`);
