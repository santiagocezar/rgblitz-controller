export default class EventEmitter<E extends { [k: string]: (...args: any[]) => any }> {
    #handlers: {
        [K in keyof E]?: Set<E[K]>
    }

    constructor() {
        this.#handlers = {}
    }

    on<K extends keyof E>(event: K, handler: E[K]) {
        (this.#handlers[event] ??= new Set()).add(handler)
    }

    off<K extends keyof E>(event: K, handler: E[K]) {
        this.#handlers?.[event]?.delete(handler)
    }

    protected removeAllHandlers<K extends keyof E>() {
        this.#handlers = {}
    }

    protected emit<K extends keyof E>(event: K, ...args: Parameters<E[K]>) {
        this.#handlers?.[event]?.forEach((fn) => fn(...args))
    }
}