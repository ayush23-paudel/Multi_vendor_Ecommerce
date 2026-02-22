import prisma from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Add a new rating/review
export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        }

        const { rating, review, productId, orderId } = await request.json()

        if (!rating || !productId || !orderId) {
            return NextResponse.json({ error: 'missing required fields' }, { status: 400 })
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 })
        }

        if (review && review.length < 5) {
            return NextResponse.json({ error: 'review must be at least 5 characters' }, { status: 400 })
        }

        // Check if rating already exists for this user, product, and order
        const existingRating = await prisma.rating.findUnique({
            where: {
                userId_productId_orderId: {
                    userId,
                    productId,
                    orderId
                }
            }
        })

        if (existingRating) {
            return NextResponse.json({ error: 'you have already rated this product' }, { status: 400 })
        }

        // Create the rating
        await prisma.rating.create({
            data: {
                rating,
                review: review || '',
                userId,
                productId,
                orderId
            }
        })

        return NextResponse.json({ message: 'Rating submitted successfully' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

// Get ratings for a product
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')

        if (!productId) {
            return NextResponse.json({ error: 'missing productId' }, { status: 400 })
        }

        const ratings = await prisma.rating.findMany({
            where: { productId },
            include: {
                user: {
                    select: { name: true, image: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ ratings })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
