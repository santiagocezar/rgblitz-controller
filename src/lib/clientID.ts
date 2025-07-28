let id: Uint8Array
export function clientID() {
    if (id) return id

    const stored = localStorage.getItem("clientID")
    id = new Uint8Array(4)
    if (stored) {
        id.set(JSON.parse(stored))
    } else {
        crypto.getRandomValues(id);
    }
}
