import { deepNormalizeJson } from '../src/normalize-json'

class Foo {}

describe('deepNormalizeJson', () => {
  it('works for shallow arrays', () => {
    const arr = [new Foo(), new Error(), 'a', undefined, new Date(), 1, undefined]
    deepNormalizeJson(arr)
    expect(arr).toEqual(['a', 1])
  })

  it('works for deep arrays', () => {
    const arr = [
      [new Foo(), new Error(), 'a', undefined, new Date(), 1, undefined],
      [new Foo(), new Error(), 'a', undefined, new Date(), 1, undefined],
    ]
    deepNormalizeJson(arr)
    expect(arr).toEqual([
      ['a', 1],
      ['a', 1],
    ])
  })

  it('works for shallow objects', () => {
    const obj = {
      '1': new Foo(),
      '2': new Error(),
      '3': 'a',
      '4': undefined,
      '5': new Date(),
      '6': 1,
      '7': undefined,
    }
    deepNormalizeJson(obj)
    expect(obj).toEqual({ '3': 'a', '6': 1 })
  })

  it('works for deep objects', () => {
    const obj = {
      a: {
        '1': new Foo(),
        '2': new Error(),
        '3': 'a',
        '4': undefined,
        '5': new Date(),
        '6': 1,
        '7': undefined,
      },
      b: {
        '1': new Foo(),
        '2': new Error(),
        '3': 'a',
        '4': undefined,
        '5': new Date(),
        '6': 1,
        '7': undefined,
      },
    }
    deepNormalizeJson(obj)
    expect(obj).toEqual({ a: { '3': 'a', '6': 1 }, b: { '3': 'a', '6': 1 } })
  })
})
