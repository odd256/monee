import fs from "node:fs/promises";
import sharp from "sharp";

const ROUNDED = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="116" fill="#0f766e"/>
  <path d="M140 360V150h60l56 90 56-90h60v210h-52V240l-64 96h-4l-64-96v120z" fill="#ffffff"/>
</svg>`;

const SQUARE = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0f766e"/>
  <g transform="translate(51.2 51.2) scale(0.8)">
    <path d="M140 360V150h60l56 90 56-90h60v210h-52V240l-64 96h-4l-64-96v120z" fill="#ffffff"/>
  </g>
</svg>`;

await fs.mkdir("public/icons", { recursive: true });

await sharp(Buffer.from(ROUNDED)).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(Buffer.from(ROUNDED)).resize(512, 512).png().toFile("public/icons/icon-512.png");
await sharp(Buffer.from(SQUARE)).resize(512, 512).png().toFile("public/icons/maskable-512.png");
await sharp(Buffer.from(SQUARE)).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png");
await sharp(Buffer.from(ROUNDED)).resize(512, 512).png().toFile("app/icon.png");

console.log("Generated PWA icons");
