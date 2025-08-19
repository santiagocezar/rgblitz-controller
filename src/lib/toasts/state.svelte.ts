import { SvelteMap } from "svelte/reactivity";
import invariant from "tiny-invariant";

export interface ToastData {
    id: symbol,
    message: string
    type: 'won'
    timeoutRef: number
}

export const toasts = new SvelteMap<Symbol, ToastData>()

export interface ToastOpts {
    message: string
    type: 'won'
    timeout?: number
}

export function makeToast({ message, type = "won", timeout = 5000 }: ToastOpts): symbol {
    const id = Symbol()

    const timeoutRef = window.setTimeout(() => removeToast(id), timeout)
    
    toasts.set(id, {
        id,
        message,
        type,
        timeoutRef
    })

    return id
}

export function changeToast(id: symbol, { message, type, timeout }: Partial<ToastOpts>) {
    const toastOrNull = toasts.get(id)

    invariant(toastOrNull)

    const toast = { ...toastOrNull }

    console.log("changing toast with message: " + message)

    if (message !== undefined) toast.message = message
    if (type !== undefined) toast.type = type
    if (timeout !== undefined) {
        clearInterval(toast.timeoutRef)
        const timeoutRef = window.setTimeout(() => removeToast(id), timeout)
        toast.timeoutRef = timeoutRef
    }

    toasts.set(id, toast)
}

export function removeToast(id: symbol) {
    toasts.delete(id)
}