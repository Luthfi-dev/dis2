"use client"

import { useToast } from "../../hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"
import { Copy } from "lucide-react"
import { Button } from "./button"
import { cn } from "../../lib/utils"
import { Input } from "./input"

export function Toaster() {
  const { toasts, toast } = useToast()

  const handleCopy = (description: React.ReactNode) => {
    if (typeof description === 'string') {
      navigator.clipboard.writeText(description);
      toast({
        title: "Tersalin!",
        description: "Detail error berhasil disalin.",
      })
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isError = variant === 'destructive' && !!description;

        return (
          <Toast key={id} variant={variant} {...props} className={cn(isError && "w-[480px]")}>
            <div className="grid gap-1 flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                isError ? (
                  <div className="relative">
                    <Input
                      readOnly
                      value={description as string}
                      className="pr-10 text-xs h-20 text-destructive-foreground bg-transparent border-none select-text whitespace-pre-wrap break-all"
                    />
                     <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 group-[.destructive]:hover:bg-white/20 group-[.destructive]:text-destructive-foreground"
                      onClick={() => handleCopy(description)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                   <ToastDescription>{description}</ToastDescription>
                )
              )}
            </div>
             <div className="flex flex-col items-center gap-2 self-start">
              {action}
               <ToastClose className={cn("static transform-none", isError && "mt-auto mb-2" )} />
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
