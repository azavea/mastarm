import React, {Component} from 'react'
import uuid from 'uuid'

import png from '../../../mastarm.png'

const css = require('./index.css')

/**
 * A Mock Component to test to ensure that building of React jsx components works
 */
export default class MockTestComponentUniqueName extends Component {
  static defaultProps = {
    test: 'hi'
  }

  /**
   * Render the component.
   */
  render () {
    return <div />
  }
}

console.log(uuid.v4())
console.log(png.length)
console.log(css)
