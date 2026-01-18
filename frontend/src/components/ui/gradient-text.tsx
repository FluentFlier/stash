import { cn } from "@/lib/utils"

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  className?: string
  animate?: boolean
}

export function GradientText({ children, className, animate = true, ...props }: GradientTextProps) {
  return (
    <span
      className={cn(
        "bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-pink-500",
        animate && "animate-gradient-x bg-[length:200%_auto]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
