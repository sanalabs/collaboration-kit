import { hash } from './hash'

interface DpState {
  aIdx: number
  bIdx: number
}

interface DpValue {
  value: number
  predecessor: DpState | undefined
}

export function longestCommonSubsequence(
  a: unknown[],
  b: unknown[],
  objectHashes: Map<object | number | string | boolean, number>,
): unknown[] {
  const toMapInd = (aIdx: number, bIdx: number): number => {
    return aIdx * (b.length + 1) + bIdx
  }
  const dp: Map<number, DpValue> = new Map()
  dp.set(toMapInd(0, 0), { value: 0, predecessor: undefined })

  let current: DpState[] = [{ aIdx: 0, bIdx: 0 }]
  let next: DpState[] = []
  let currentTarget = Math.min(a.length, b.length)

  const getHash = (x: unknown): number => {
    const h = hash(x, objectHashes)
    return h
  }

  const updateDp = (previousState: DpState, state: DpState, value: number): void => {
    const aIdx = state.aIdx
    const bIdx = state.bIdx
    const mapInd = toMapInd(aIdx, bIdx)
    const oldValue = dp.get(mapInd)?.value
    if (oldValue === undefined || value > oldValue) {
      dp.set(mapInd, { value: value, predecessor: previousState })
      const bestPossible = value + Math.min(a.length - aIdx, b.length - bIdx)
      if (bestPossible >= currentTarget) {
        current.push(state)
      } else {
        next.push(state)
      }
    }
  }

  while (!dp.has(toMapInd(a.length, b.length))) {
    for (const currentPos of current) {
      const aIdx = currentPos.aIdx
      const bIdx = currentPos.bIdx
      const currentDpValue = dp.get(toMapInd(aIdx, bIdx))?.value
      if (currentDpValue === undefined) {
        throw new Error('Dp value is undefined')
      }
      if (aIdx < a.length && bIdx < b.length && getHash(a[aIdx]) === getHash(b[bIdx])) {
        updateDp(currentPos, { aIdx: aIdx + 1, bIdx: bIdx + 1 }, currentDpValue + 1)
      }
      if (aIdx < a.length) {
        updateDp(currentPos, { aIdx: aIdx + 1, bIdx }, currentDpValue)
      }
      if (bIdx < b.length) {
        updateDp(currentPos, { aIdx, bIdx: bIdx + 1 }, currentDpValue)
      }
    }
    current = next
    next = []
    currentTarget -= 1
  }

  const lcs: unknown[] = []
  let state = dp.get(toMapInd(a.length, b.length))?.predecessor
  while (state !== undefined) {
    const previousState = dp.get(toMapInd(state.aIdx, state.bIdx))?.predecessor
    if (previousState === undefined) {
      break
    }
    if (previousState.aIdx !== state.aIdx && previousState.bIdx !== state.bIdx) {
      lcs.push(a[previousState.aIdx])
    }
    state = previousState
  }
  lcs.reverse()

  return lcs
}
