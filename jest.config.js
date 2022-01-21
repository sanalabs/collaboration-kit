/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '.*\\.test\\.tsx?$',
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  clearMocks: true,
}
