import { NextRequest, NextResponse } from 'next/server'
import os from 'os'
import { register, httpDuration } from '@/lib/metrics'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const start = process.hrtime.bigint()

    // DB connectivity probe
    let dbStatus: 'ok' | 'error' = 'ok'
    let dbLatencyMs: number | null = null
    try {
        const dbStart = process.hrtime.bigint()
        await prisma.$queryRaw`SELECT 1`
        dbLatencyMs = Number(process.hrtime.bigint() - dbStart) / 1e6
    } catch {
        dbStatus = 'error'
    }

    const mem = process.memoryUsage()
    const cpus = os.cpus()

    // Calculate aggregate CPU usage percentage across all cores
    const cpuPercent = cpus.map(cpu => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0)
        const idle = cpu.times.idle
        return parseFloat(((1 - idle / total) * 100).toFixed(1))
    })

    const responseTimeMs = Number(process.hrtime.bigint() - start) / 1e6

    // Record this health check in the histogram
    httpDuration.observe({ method: 'GET', route: '/api/health', status: '200' }, responseTimeMs / 1000)

    // Prometheus metrics as a separate field for scraping tooling
    const prometheusMetrics = await register.metrics()

    const status = dbStatus === 'ok' ? 'ok' : 'degraded'

    return NextResponse.json(
        {
            status,
            timestamp: new Date().toISOString(),
            uptime: {
                seconds: Math.floor(process.uptime()),
                human: formatUptime(process.uptime()),
            },
            responseTime: {
                ms: parseFloat(responseTimeMs.toFixed(3)),
            },
            memory: {
                rss:          formatBytes(mem.rss),
                heapTotal:    formatBytes(mem.heapTotal),
                heapUsed:     formatBytes(mem.heapUsed),
                external:     formatBytes(mem.external),
                heapUsedPct:  parseFloat(((mem.heapUsed / mem.heapTotal) * 100).toFixed(1)),
            },
            cpu: {
                cores:       cpus.length,
                model:       cpus[0]?.model ?? 'unknown',
                loadAvg:     os.loadavg().map(v => parseFloat(v.toFixed(2))),
                usagePerCore: cpuPercent,
            },
            database: {
                status:    dbStatus,
                latencyMs: dbLatencyMs !== null ? parseFloat(dbLatencyMs.toFixed(3)) : null,
            },
            node: {
                version:  process.version,
                platform: process.platform,
                arch:     process.arch,
            },
            prometheusMetrics,
        },
        { status: status === 'ok' ? 200 : 503 },
    )
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

function formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(' ')
}
