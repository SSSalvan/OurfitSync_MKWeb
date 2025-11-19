module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
    browser: true,
  },
  // Add this new section:
  parserOptions: {
    ecmaVersion: 2021, // Or whatever version you are using (e.g., 2022, "latest")
    sourceType: "module", 
  },
  // End of new section
  rules: {
    "quotes": "off",
    "indent": "off",
    "no-irregular-whitespace": "off",
    "object-curly-spacing": "off",
    "linebreak-style": "off",
    "no-undef": "off"
  },
  ignorePatterns: ["public/**"],
};