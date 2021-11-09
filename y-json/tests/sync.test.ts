import * as fc from 'fast-check'
import _ from 'lodash'
import { JsonObject } from '../../json/src'
import { sync } from '../src'
import { patchYType } from '../src/patch-y-type'
import * as utils from './utils'

describe('sync tests', () => {
  it('disconnecting more than once causes an error', () => {
    const yMap = utils.makeYMap()
    const { disconnect } = sync({ yType: yMap })
    disconnect()
    expect(disconnect).toThrowError()
  })

  it('updating local data after disconnect causes an error', () => {
    const yMap = utils.makeYMap()
    const { disconnect, updateLocalData } = sync({ yType: yMap })
    disconnect()
    expect(() => updateLocalData({})).toThrow()
  })

  it('data validation fails if updateLocalData is called with the wrong type', () => {
    const yMap = utils.makeYMap<Record<string, string>>({})
    const { disconnect, updateLocalData } = sync({
      yType: yMap,
      validate: data => {
        if (typeof data !== 'object') throw Error('Expected an object')
        if (data === null) throw Error('Did not expect null')
        if ('a' in data) throw Error('Illegal key')
      },
    })
    expect(() => updateLocalData({ b: 'b' })).not.toThrow()
    expect(() => updateLocalData({ a: 'a' })).toThrow()
    disconnect()
  })

  it('data validation fails if remote data is updated with the wrong type', () => {
    const yMap = utils.makeYMap<Record<string, string>>({})
    let localData = {}
    const { disconnect } = sync({
      yType: yMap,
      onRemoteDataChanged: data => {
        localData = data
      },
      validate: data => {
        if (typeof data !== 'object') throw Error('Expected an object')
        if (data === null) throw Error('Did not expect null')
        if ('a' in data) throw Error('Illegal key')
      },
    })

    expect(() => patchYType(yMap, { a: 'a' })).toThrow()
    expect(localData).toEqual({})

    expect(() => patchYType(yMap, { b: 'b' })).not.toThrow()
    expect(localData).toEqual({ b: 'b' })

    disconnect()
  })

  it('onRemoteDataChanged is not called after disconnecting', () => {
    const yMap = utils.makeYMap()
    let remoteDataChangeCount = 0
    const { disconnect, updateLocalData } = sync({
      yType: yMap,
      onRemoteDataChanged: () => {
        remoteDataChangeCount++
      },
    })

    patchYType(yMap, { a: 0 })
    expect(remoteDataChangeCount).toEqual(1)

    disconnect()

    patchYType(yMap, { a: 1 })
    expect(remoteDataChangeCount).toEqual(1)

    expect(() => updateLocalData({})).toThrow()
  })

  it('Updating the local data updates the synced yType', () => {
    fc.assert(
      fc.property(utils.arbitraryJSONObject(), utils.arbitraryJSONObject(), (change1, change2) => {
        const yMap = utils.makeYMap<JsonObject>()
        const { updateLocalData, disconnect } = sync({ yType: yMap })

        updateLocalData(change1)
        expect(yMap.toJSON()).toEqual(change1)
        updateLocalData(change2)
        expect(yMap.toJSON()).toEqual(change2)

        disconnect()
      }),
    )
  })

  it('Updating the local data does not cause onRemoteDataChanged to be called', () => {
    fc.assert(
      fc.property(utils.arbitraryJSONObject(), change => {
        const yMap = utils.makeYMap<JsonObject>()
        const { updateLocalData, disconnect } = sync({
          yType: yMap,
          onRemoteDataChanged: () => {
            throw new Error('Did not expect remote data to change')
          },
        })

        updateLocalData(change)
        expect(yMap.toJSON()).toEqual(change)

        disconnect()
      }),
    )
  })

  it('Syncing updates from remote data does not cause updates to be sent out', () => {
    fc.assert(
      fc.property(utils.arbitraryJSONObject(), change => {
        const yMap = utils.makeYMap()
        const initialData = {}
        let localData = initialData
        let remoteDataChangeCount = 0
        const { updateLocalData, disconnect } = sync({
          yType: yMap,
          onRemoteDataChanged: newData => {
            remoteDataChangeCount++
            localData = newData
            updateLocalData(localData)
          },
        })
        expect(remoteDataChangeCount).toEqual(0)

        patchYType(yMap, change, { origin: 'remote' })

        expect(localData).toEqual(change)
        if (_.isEqual(initialData, change)) {
          expect(remoteDataChangeCount).toEqual(0)
        } else {
          expect(remoteDataChangeCount).toEqual(1)
        }

        disconnect()
      }),
    )
  })
})
