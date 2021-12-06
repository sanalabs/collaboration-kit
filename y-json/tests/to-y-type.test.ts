import { objectToYMap } from '../src'

describe('to-ymap', () => {
  it('objectToYMap', () => {
    const obj = { key1: 1, key2: [{ key21: 'val', key22: [2, 'foo'] }] }
    const yMap = objectToYMap(obj)
    expect(yMap.toJSON()).toEqual(obj)
  })
})
