import prisma from "@/lib/prisma"
import authSeller from "@/middlewares/authSeller"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Add answer to a question
export async function PUT(request, { params }) {
    try {
        const { userId } = getAuth(request)
        
        const storeId = await authSeller(userId)
        if (!storeId) {
            return NextResponse.json({ error: 'not authorized - seller only' }, { status: 401 })
        }

        const { questionId } = await params
        const { answer } = await request.json()

        if (!questionId || !answer) {
            return NextResponse.json({ error: 'missing required fields' }, { status: 400 })
        }

        if (answer.length < 5) {
            return NextResponse.json({ error: 'answer must be at least 5 characters' }, { status: 400 })
        }

        // Verify question belongs to seller's product
        const question = await prisma.question.findUnique({
            where: { id: questionId },
            include: { product: true }
        })

        if (!question) {
            return NextResponse.json({ error: 'question not found' }, { status: 404 })
        }

        if (question.product.storeId !== storeId) {
            return NextResponse.json({ error: 'not authorized for this question' }, { status: 401 })
        }

        // Update question with answer
        await prisma.question.update({
            where: { id: questionId },
            data: { answer }
        })

        return NextResponse.json({ message: 'Answer posted successfully' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
