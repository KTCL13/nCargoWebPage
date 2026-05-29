import client from 'prom-client'

// One registry per process — safe in Next.js serverless (each instance is isolated)
const register = new client.Registry()

register.setDefaultLabels({ app: 'ncargo' })

// Collect default Node.js metrics: CPU, memory, GC, event loop lag, active handles
client.collectDefaultMetrics({ register })

// Custom histogram: tracks HTTP response times for /api routes instrumented manually
export const httpDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
})

export { register }
