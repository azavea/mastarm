// @flow

const build = require('../../lib/build')
const loadConfig = require('../../lib/load-config')
const util = require('../test-utils/util.js')

const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL

describe('build', () => {
  const mockDir = util.mockDir

  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000
  })
  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout
  })

  describe('js', () => {
    let unminifiedJsSize = 0
    let minifiedJsDevSize = 0

    it('should transform', async () => {
      const [result] = await build({
        config: loadConfig(process.cwd(), null, 'development'),
        env: 'development',
        files: [[`${mockDir}/index.js`]]
      })

      const transpiledString = result.toString()
      unminifiedJsSize = transpiledString.length
      expect(transpiledString.indexOf('MockTestComponentUniqueName')).not.toBe(
        -1
      )
    })

    it('should transform and minify', async () => {
      const [result] = await build({
        config: loadConfig(process.cwd(), null, 'development'),
        env: 'development',
        files: [[`${mockDir}/index.js`]],
        minify: true
      })

      const transpiledString = result.toString()
      minifiedJsDevSize = transpiledString.length
      expect(transpiledString.indexOf('MockTestComponentUniqueName')).not.toBe(
        -1
      )
      expect(minifiedJsDevSize).toBeLessThan(unminifiedJsSize)
    })

    it('should transform, minify, and use production settings', async () => {
      const [result] = await build({
        config: loadConfig(process.cwd(), null, 'production'),
        env: 'production',
        files: [[`${mockDir}/index.js`]],
        minify: true
      })

      const transpiledString = result.toString()
      expect(transpiledString.indexOf('MockTestComponentUniqueName')).not.toBe(
        -1
      )
      expect(transpiledString.length).toBeLessThan(minifiedJsDevSize)
    })
  })

  describe('css', () => {
    let unminifiedCssSize = 0
    it('should transform', async () => {
      const [result] = await build({
        config: loadConfig(process.cwd(), null, 'development'),
        env: 'development',
        files: [[`${mockDir}/index.js`], [`${mockDir}/index.css`]]
      })

      const css = result.toString()
      expect(css.indexOf('criticalClass')).toBeGreaterThan(-1)
      unminifiedCssSize = css.length
    })

    it('should transform and minify', async () => {
      const [result] = await build({
        config: loadConfig(process.cwd(), null, 'development'),
        env: 'production',
        files: [[`${mockDir}/index.js`], [`${mockDir}/index.css`]],
        minify: true
      })

      const css = result.toString()
      expect(css.indexOf('criticalClass')).toBeGreaterThan(-1)
      expect(css.length).toBeLessThan(unminifiedCssSize)
    })
  })
})
