module.exports = {
  plugins: ["babel"],
  extends: [
    "airbnb",
  ],
  env: {
    node: true,
    browser: true,
  },
  ignorePatterns: [
    "node_modules",
    "dist",
  ],
  parser: 'babel-eslint'
}