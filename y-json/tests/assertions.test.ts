import fc from 'fast-check'
import * as Y from 'yjs'
import { AssertionError } from '../../json/src/error'
import { assertIsYJson } from '../src'
import { patchYJson } from '../src/patch-y-type'
import * as utils from './utils'

describe('asserts', () => {
  it('not to throw', () => {
    fc.assert(
      fc.property(utils.arbitraryJSONObject(), randomObject => {
        const yMap = utils.makeYMap()
        patchYJson(yMap, randomObject)
        expect(() => assertIsYJson(yMap)).not.toThrow()
      }),
      { numRuns: 1000 },
    )
  })

  it('to throw shallow', () => {
    const yMap = utils.makeYMap()
    const yXmlText = new Y.XmlText()
    yXmlText.insert(0, 'hello')
    yXmlText.format(1, 3, { italic: true })
    yMap.set('a', yXmlText)

    expect(() => assertIsYJson(yMap)).toThrowError(
      new AssertionError("assertIsYJson: Expected YXmlText to be YMap or YArray at yType.get('a')"),
    )
  })

  it('to throw deep', () => {
    const yMap = utils.makeYMap()
    const yMapMap = new Y.Map()
    yMap.set('a', yMapMap)
    const yXmlText = new Y.XmlText()
    yMapMap.set('xmlText', yXmlText)
    yXmlText.insert(0, 'hello')
    yXmlText.format(1, 3, { italic: true })

    expect(() => assertIsYJson(yMap)).toThrowError(
      new AssertionError(
        "assertIsYJson: Expected YXmlText to be YMap or YArray at yType.get('a').get('xmlText')",
      ),
    )
  })

  it('to throw deep undefined', () => {
    const yMap = utils.makeYMap()
    const yMapMap = new Y.Map()
    yMap.set('a', yMapMap)
    yMapMap.set('b', undefined) // Yes we want to disallow this. YArray thwos on undefined. Want to avoid this inconsistency.

    expect(() => assertIsYJson(yMap)).toThrowError(
      new AssertionError(
        "assertIsYJson: Expected undefined to be JSON primitive (string | number | boolean | null) at yType.get('a').get('b')",
      ),
    )
  })
})
