import { cpSync, mkdirSync, writeFileSync } from "node:fs";
// Keep prior hashed assets: cards printed before an update must stay usable.
cpSync("dist/index.html", "index.html");
cpSync("dist/legacy.html", "legacy.html");
mkdirSync("app-assets", { recursive: true });
cpSync("dist/app-assets", "app-assets", { recursive: true });
cpSync("dist/images", "images", { recursive: true });
writeFileSync(".nojekyll", "");

cpSync('dist/favicon.svg','favicon.svg');
