import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-8 first:mt-0 mb-3">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3 pt-2 border-t border-gray-100 first:border-0 first:pt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">{children}</h3>
  ),
  p: ({ children }) => <p className="text-sm text-gray-600 leading-relaxed mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1.5 text-sm text-gray-600">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-sm text-gray-600">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
  hr: () => <hr className="my-8 border-gray-200" />,
  strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => {
    const h = href ?? '#'
    if (h.startsWith('http') || h.startsWith('mailto:')) {
      return (
        <a
          href={h}
          className="text-green-600 hover:underline font-medium"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      )
    }
    if (h.startsWith('/')) {
      return (
        <Link href={h} className="text-green-600 hover:underline font-medium">
          {children}
        </Link>
      )
    }
    return (
      <a href={h} className="text-green-600 hover:underline font-medium">
        {children}
      </a>
    )
  },
  pre: ({ children }) => (
    <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto my-3">{children}</pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 -mx-1 rounded-lg border border-gray-200">
      <table className="min-w-full text-sm text-left">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-50 text-gray-700">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-gray-100 bg-white">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-gray-600 border-b border-gray-200">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-3 py-2.5 text-gray-600 align-top">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-green-200 pl-4 my-4 text-sm text-gray-600 italic">{children}</blockquote>
  ),
  code: ({ className, children }) => (
    <code className={cn('font-mono text-xs', className ?? 'bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded')}>
      {children}
    </code>
  ),
}

export function ProductGuideMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
