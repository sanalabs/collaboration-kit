import * as Y from 'yjs'
import { replaceYType } from '../src/patch-y-type'
import * as utils from './utils'

describe('replaceYType', () => {
  it('deletes entries not present in src YMap', () => {
    const dst = utils.makeYMap()
    dst.set('a', 'hello')
    const src = utils.makeYMap()

    replaceYType(dst, src)

    expect(dst.toJSON()).toEqual({})
  })

  it('inserts entries not present in dst YMap', () => {
    const dst = utils.makeYMap()
    const src = utils.makeYMap()
    src.set('a', 'hello')

    replaceYType(dst, src)

    expect(dst.toJSON()).toEqual({ a: 'hello' })
  })

  it('replaces entries that are present in both src and dst YMaps', () => {
    const dst = utils.makeYMap()
    dst.set('a', 'hello')
    const src = utils.makeYMap()
    src.set('a', 'hi')

    replaceYType(dst, src)

    expect(dst.toJSON()).toEqual({ a: 'hi' })
  })

  it('handles src YMap with nested YText', () => {
    const dst = utils.makeYMap()
    dst.set('a', 'hi')
    const src = utils.makeYMap()
    const yText = new Y.Text()
    yText.insert(0, 'hello')
    yText.format(1, 3, { italic: true })
    src.set('a', yText)

    replaceYType(dst, src)

    expect(dst.toJSON()).toEqual({ a: 'hello' })
    const value = dst.get('a')
    expect(value instanceof Y.Text).toBeTruthy()
    expect((value as Y.Text).toDelta()).toEqual(yText.toDelta())
  })

  it('handles dst YMap with nested YText', () => {
    const dst = utils.makeYMap()
    dst.set('a', new Y.Text())
    const src = utils.makeYMap()
    src.set('a', 'hi')

    replaceYType(dst, src)

    expect(dst.toJSON()).toEqual({ a: 'hi' })
  })

  it('handles src YMap with nested YXmlText', () => {
    const dst = utils.makeYMap()
    dst.set('a', 'hi')
    const src = utils.makeYMap()
    const yXmlText = new Y.XmlText()
    yXmlText.insert(0, 'hello')
    yXmlText.format(1, 3, { italic: true })
    src.set('a', yXmlText)

    replaceYType(dst, src)

    expect(dst.toJSON()).toEqual({ a: 'h<italic>ell</italic>o' })
    const value = dst.get('a')
    expect(value instanceof Y.XmlText).toBeTruthy()
    expect((value as Y.XmlText).toDelta()).toEqual(yXmlText.toDelta())
  })

  it('deletes entries not present in src YArray', () => {
    const dst = utils.makeYArray()
    dst.insert(0, ['hello'])
    const src = utils.makeYArray()

    replaceYType(dst, src)

    expect(dst.toJSON()).toEqual([])
  })

  it('inserts entries not present in dst YArray', () => {
    const dst = utils.makeYArray()
    const src = utils.makeYArray()
    src.insert(0, ['hello'])

    replaceYType(dst, src)

    expect(dst.toJSON()).toEqual(['hello'])
  })

  it('replaces entries that are present in both src and dst YArrays', () => {
    const dst = utils.makeYArray()
    dst.insert(0, ['hello'])
    const src = utils.makeYArray()
    src.insert(0, ['hi'])

    replaceYType(dst, src)

    expect(dst.toJSON()).toEqual(['hi'])
  })

  it('handles src YArray with nested YText', () => {
    const dst = utils.makeYArray()
    dst.insert(0, ['hi'])
    const src = utils.makeYArray()
    const yText = new Y.Text()
    yText.insert(0, 'hello')
    yText.format(1, 3, { italic: true })
    src.insert(0, [yText])

    replaceYType(dst, src)

    expect(dst.toJSON()).toEqual(['hello'])
    const value = dst.get(0)
    expect(value instanceof Y.Text).toBeTruthy()
    expect((value as Y.Text).toDelta()).toEqual(yText.toDelta())
  })

  it('handles dst YArray with nested YText', () => {
    const dst = utils.makeYArray()
    dst.insert(0, [new Y.Text()])
    const src = utils.makeYArray()
    src.insert(0, ['hi'])

    replaceYType(dst, src)

    expect(dst.toJSON()).toEqual(['hi'])
  })

  it('handles src YArray with nested YXmlText', () => {
    const dst = utils.makeYArray()
    dst.insert(0, ['hi'])
    const src = utils.makeYArray()
    const yXmlText = new Y.XmlText()
    yXmlText.insert(0, 'hello')
    yXmlText.format(1, 3, { bold: true })
    src.insert(0, [yXmlText])

    replaceYType(dst, src)

    expect(dst.toJSON()).toEqual(['h<bold>ell</bold>o'])
    const value = dst.get(0)
    expect(value instanceof Y.XmlText).toBeTruthy()
    expect((value as Y.XmlText).toDelta()).toEqual(yXmlText.toDelta())
  })
})
