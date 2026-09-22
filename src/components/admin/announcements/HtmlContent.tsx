import { cn } from '@/lib/utils/cn'

const prose = [
  'text-sm leading-relaxed text-ink-2',
  '[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-ink',
  '[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink',
  '[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-ink',
  '[&_p]:my-2.5 [&_p]:first:mt-0 [&_p]:last:mb-0',
  '[&_a]:text-accent-strong [&_a]:underline [&_a]:underline-offset-2',
  '[&_ul]:my-2.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1',
  '[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg',
  '[&_code]:rounded [&_code]:bg-raised [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]',
  '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-raised [&_pre]:p-3',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-line-strong [&_blockquote]:pl-3 [&_blockquote]:text-ink-3',
  '[&_hr]:my-4 [&_hr]:border-line',
  '[&_strong]:text-ink [&_strong]:font-semibold',
].join(' ')

/** Trusted server-proxied feed HTML; there is no markdown/HTML renderer dependency. */
export function HtmlContent({ html, className }: { html: string; className?: string }) {
  return <div className={cn(prose, className)} dangerouslySetInnerHTML={{ __html: html }} />
}
