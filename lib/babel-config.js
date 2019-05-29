const addExports = require('babel-plugin-add-module-exports')
const babelEnv = require('@babel/preset-env')
const flow = require('@babel/preset-flow')
const react = require('@babel/preset-react')
const reactRequire = require('babel-plugin-react-require').default
const lodash = require('babel-plugin-lodash')
const reactDisplayName = require('@babel/plugin-transform-react-display-name')
const classProperties = require('@babel/plugin-proposal-class-properties')
const exportFrom = require('@babel/plugin-proposal-export-namespace-from')
const istanbul = require('babel-plugin-istanbul')

const browsers = require('./constants').BROWSER_SUPPORT

module.exports = function (env, instrument) {
  const plugins = [
    addExports,
    classProperties,
    exportFrom,
    lodash,
    reactDisplayName,
    reactRequire
  ]

  if (instrument) { plugins.push(istanbul) }

  return {
    plugins,
    presets: [
      [
        babelEnv,
        {
          corejs: '2',
          loose: false, // Loose mode breaks spread operator on `Set`s
          targets: { browsers },
          useBuiltIns: 'usage'
        }
      ],
      flow,
      react
    ]
  }
}
