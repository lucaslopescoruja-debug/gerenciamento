import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const envFile = fs.readFileSync('.env.staging', 'utf-8')
const env: Record<string, string> = {}
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value.length > 0) {
    env[key.trim()] = value.join('=').trim()
  }
})

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  const { data: companies, error } = await supabase.from('companies').select('*')
  console.log('Companies:', companies)
  if (error) console.error('Error:', error)
}

run().catch(console.error)
