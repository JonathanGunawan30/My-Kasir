"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
      <ToastProvider>
        {toasts.map(function ({ id, title, description, action, ...props }) {
          return (
              <Toast key={id}{...props} className="animate-in slide-in-from-right fade-in duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=closed]:fade-out">
          <div className="grid gap-1">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && <ToastDescription>{description}</ToastDescription>}
                </div>
                {action}
                <ToastClose />
              </Toast>
          )
        })}
        <ToastViewport className="fixed !top-4 !right-4 !bottom-auto z-50 flex flex-col gap-2 w-[360px] max-w-full outline-none transition-transform duration-300 ease-out" />

      </ToastProvider>
  )
}
