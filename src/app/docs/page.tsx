'use client'

import { useEffect, useRef } from 'react'
import 'swagger-ui-dist/swagger-ui.css'

export default function DocsPage() {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        let ui: { unmount?: () => void } | undefined

        async function init() {
            const SwaggerUIBundle = (await import('swagger-ui-dist')).SwaggerUIBundle
            if (!containerRef.current) return

            ui = SwaggerUIBundle({
                url: '/api/docs',
                domNode: containerRef.current,
                presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
                layout: 'BaseLayout',
                docExpansion: 'list',
                deepLinking: true,
            })
        }

        init()

        return () => {
            ui?.unmount?.()
        }
    }, [])

    return <div ref={containerRef} style={{ minHeight: '100vh' }} />
}
