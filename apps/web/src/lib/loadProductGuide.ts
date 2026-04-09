import path from 'node:path'
import { readFile } from 'node:fs/promises'

/**
 * Loads product guide markdown. Tries monorepo `docs/` first (local dev / full repo deploy),
 * then `src/content/product-guide.md` (always present in the web app for production builds).
 */
export async function loadProductGuideMarkdown(): Promise<string> {
  const candidates = [
    path.join(process.cwd(), '..', '..', 'docs', 'PRODUCT_GUIDE.md'),
    path.join(process.cwd(), 'src', 'content', 'product-guide.md'),
  ]
  for (const p of candidates) {
    try {
      return await readFile(p, 'utf-8')
    } catch {
      /* try next */
    }
  }
  throw new Error('Product guide could not be loaded.')
}
