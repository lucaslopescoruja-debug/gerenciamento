import fs from 'fs'
import path from 'path'

function replaceInDir(dir) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      replaceInDir(fullPath)
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8')
      if (content.includes("import { toast } from 'sonner'")) {
        content = content.replace(/import \{ toast \} from 'sonner'/g, "import { toast } from '@/components/ui/toaster'")
        fs.writeFileSync(fullPath, content, 'utf8')
        console.log(`Replaced in ${fullPath}`)
      }
    }
  }
}

replaceInDir('./src/pages')
