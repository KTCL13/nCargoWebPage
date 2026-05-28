import { NextRequest, NextResponse } from 'next/server'
import { jobService } from '../services/job.service'
import { CreateJobDto } from '../dtos/create-job.dto'
import { UpdateJobDto } from '../dtos/update-job.dto'
import { requireAdmin } from '@/lib/auth-guard'

function authErrorResponse(error: unknown) {
    const status =
        error instanceof Error && error.message.startsWith('Forbidden')
            ? 403
            : error instanceof Error && error.message.includes('Token')
                ? 401
                : 400
    return NextResponse.json(
        { message: error instanceof Error ? error.message : 'No autorizado' },
        { status },
    )
}

class JobController {
    async findAll(req: NextRequest) {
        try {
            await requireAdmin(req)
        } catch (error) {
            return authErrorResponse(error)
        }
        const url = new URL(req.url)
        const page = Number(url.searchParams.get('page')) || 1
        const limit = Number(url.searchParams.get('limit')) || 10
        const search = url.searchParams.get('search') ?? undefined

        try {
            const result = await jobService.findAll(page, limit, search)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 }
            )
        }
    }

    async findOne(req: NextRequest) {
        try {
            await requireAdmin(req)
        } catch (error) {
            return authErrorResponse(error)
        }
        const url = new URL(req.url)
        const id = Number(url.searchParams.get('id'))

        try {
            const result = await jobService.findOne(id)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 }
            )
        }
    }

    async create(req: NextRequest) {
        try {
            await requireAdmin(req)
        } catch (error) {
            return authErrorResponse(error)
        }
        const body: CreateJobDto = await req.json()

        try {
            const result = await jobService.create(body)
            return NextResponse.json(result, { status: 201 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 }
            )
        }
    }

    async update(req: NextRequest) {
        try {
            await requireAdmin(req)
        } catch (error) {
            return authErrorResponse(error)
        }
        const url = new URL(req.url)
        const id = Number(url.searchParams.get('id'))
        const body: UpdateJobDto = await req.json()

        try {
            const result = await jobService.update(id, body)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 }
            )
        }
    }

    async remove(req: NextRequest) {
        try {
            await requireAdmin(req)
        } catch (error) {
            return authErrorResponse(error)
        }
        const url = new URL(req.url)
        const id = Number(url.searchParams.get('id'))

        try {
            await jobService.remove(id)
            return new NextResponse(null, { status: 204 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 }
            )
        }
    }
}

export const jobController = new JobController()
