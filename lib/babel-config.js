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

module.exports = function (env, instrument) {
  const plugins = [
    addExports,
    classProperties,
    exportFrom,
    lodash,
    reactDisplayName,
    reactRequire,
    ['@babel/plugin-transform-runtime', {
      corejs: 3,
      regenerator: true
    }]
  ]

  if (instrument) { plugins.push(istanbul) }

  return {
    plugins,
    presets: [
      [
        babelEnv,
        {
          corejs: '3.1',
          loose: false, // Loose mode breaks spread operator on `Set`s
          targets: '> 0.25%, not dead',
          useBuiltIns: 'entry'
        }
      ],
      flow,
      react
    ]
  }
}
