import { NextRequest, NextResponse } from 'next/server'
import { jobService } from '../services/job.service'
import { CreateJobDto } from '../dtos/create-job.dto'
import { UpdateJobDto } from '../dtos/update-job.dto'

class JobController {
    async findAll() {
        try {
            const result = await jobService.findAll()
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 }
            )
        }
    }

    async findOne(req: NextRequest) {
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
