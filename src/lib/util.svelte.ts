export class SvelteWebSocket {
    ws: WebSocket | undefined

    readyState: number = $state(WebSocket.CONNECTING)

    constructor(url: string | URL, protocols?: string | string[]) {
        $effect(() => {
            const ws = this.ws = new WebSocket(url, protocols)
            
            const updateState = () => {
                this.readyState = ws.readyState
            }

            ws.addEventListener("open", updateState)
            ws.addEventListener("close", updateState)
        })
    }

    get connection() {
        if (this.readyState === WebSocket.OPEN) {
            return this.ws
        }
    }
}