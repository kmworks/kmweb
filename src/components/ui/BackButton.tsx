import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import { cn } from '@/lib/utils/cn'
import { IconButton } from '@/components/ui/IconButton'

/** navigate(-1) only works with in-app history; direct loads fall back to `to`. */
export function BackButton({ to, className }: { to: string; className?: string }) {
  const navigate = useNavigate()
  return (
    <IconButton
      label="Back"
      // above DetailHero's blurred backdrop, which bleeds upward over this spot
      className={cn('relative z-10', className)}
      onClick={() => {
        if ((window.history.state?.idx ?? 0) > 0) navigate(-1)
        else navigate(to)
      }}
    >
      <ArrowLeft className="size-5" />
    </IconButton>
  )
}
