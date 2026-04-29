type Handler = (payload: unknown) => Promise<void>

class EventBus {
    private handlers = new Map<string, Handler[]>()

    subscribe(eventName: string, handler: Handler): void {
        const existing = this.handlers.get(eventName) ?? []
        this.handlers.set(eventName, [...existing, handler])
    }

    async publish(eventName: string, payload: unknown): Promise<void> {
        const eventHandlers = this.handlers.get(eventName) ?? []
        await Promise.all(eventHandlers.map(h => h(payload)))
    }
}

export const eventBus = new EventBus()
