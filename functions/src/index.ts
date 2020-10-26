import * as functions from 'firebase-functions'
import algoliasearch from 'algoliasearch'

const env = functions.config()

const client = algoliasearch(env.algolia.app_id, env.algolia.admin_api_key)
const index = client.initIndex('products')

export const onProductCreated = functions.firestore
  .document('products/{productId}')
  .onCreate((snap, ctx) => {
    return index.saveObject({
      objectID: snap.id,
      ...snap.data(),
    })
  })

export const onProductDeleted = functions.firestore
  .document('products/{productId}')
  .onDelete((snap, ctx) => {
    return index.deleteObject(snap.id)
  })
