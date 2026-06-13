import { neon } from '@neondatabase/serverless'

// Lazy-init so the module can be imported during Next.js build
// without DATABASE_URL being set. The error surfaces at request time.
let _sql = null
function getClient() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL)
  return _sql
}

const sql = (...args) => getClient()(...args)
export default sql
