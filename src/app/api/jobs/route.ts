import { NextRequest } from 'next/server'
import { jobController } from '@/modules/jobs/controllers/job.controller'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
        return jobController.findOne(req)
    }

    return jobController.findAll()
}

export async function POST(req: NextRequest) {
    return jobController.create(req)
}

export async function PUT(req: NextRequest) {
    return jobController.update(req)
}

export async function DELETE(req: NextRequest) {
    return jobController.remove(req)
}
