module.exports = {
  tabWidth: 2,
  useTabs: false,
  singleQuote: true,
  arrowParens: 'always',
  trailingComma: 'es5',
  jsxSingleQuote: true,
  semi: false,
  bracketSpacing: true,
  quoteProps: 'consistent',
  importOrder: ['^~(.*)$', ...generateRelativePathRegexes(10), '^./'],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
}

/**
 * Generate an array of regexes for `importOrder` like this:
 *
 *  [ '^\\.\\./{3}', '^\\.\\./{2}', '^\\.\\./{1}' ]
 *
 * `depth` is the number of regex patterns to generate
 *
 */
function generateRelativePathRegexes(depth) {
  const paths = []
  for (let i = 1; i < depth + 1; i++) {
    paths.unshift(`^\\.\\./{${i}}`)
  }
  return paths
}
