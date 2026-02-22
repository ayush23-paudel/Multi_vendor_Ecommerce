import prisma from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Add a new question
export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        }

        const { question, productId } = await request.json()

        if (!question || !productId) {
            return NextResponse.json({ error: 'missing required fields' }, { status: 400 })
        }

        if (question.length < 5) {
            return NextResponse.json({ error: 'question must be at least 5 characters' }, { status: 400 })
        }

        // Create the question
        await prisma.question.create({
            data: {
                question,
                userId,
                productId
            }
        })

        return NextResponse.json({ message: 'Question posted successfully' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

// Get all questions for a product
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')

        if (!productId) {
            return NextResponse.json({ error: 'missing productId' }, { status: 400 })
        }

        const questions = await prisma.question.findMany({
            where: { productId },
            include: {
                user: {
                    select: { name: true, image: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ questions })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
