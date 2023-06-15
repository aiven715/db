import { getAllChanges, getChangeRootValue } from '../store/automerge'

// TODO: introduce id + updatedAt as a checkpoint
//       updatedAt will be controlled by the server, so we can use it to
//       determine which document is the most recent one for pull
//       pull response will return the recent master documents

/**
 * First item in the array is the document id
 * Second item in the array is the length of document changes
 */
export type Checkpoint = [string, number]

/**
 * First item in the array is the document id
 * Second item in the array is the document changes
 */
export type DocumentDiff = [string, Uint8Array[]]

export type PullEvent = {
  checkpoints: Checkpoint[]
}

export type PullResponse = {
  documentDiffs: DocumentDiff[]
}

export const createPullEvent = (
  items: Uint8Array[],
  primaryKey: string
): PullEvent => {
  const checkpoints: Checkpoint[] = []
  for (const item of items) {
    const changes = getAllChanges(item)
    const id = getChangeRootValue(changes[0], primaryKey) as string
    checkpoints.push([id, changes.length])
  }
  return { checkpoints }
}
