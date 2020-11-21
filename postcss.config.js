const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const tailwind = require("tailwindcss");

const plugins =
  process.env.NODE_ENV === "production"
    ? [tailwind, autoprefixer, cssnano]
    : [tailwind, autoprefixer];

module.exports = { plugins };
