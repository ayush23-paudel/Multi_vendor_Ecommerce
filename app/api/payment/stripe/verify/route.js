import prisma from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_123')

export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
        }

        const { sessionId } = await request.json()
        if (!sessionId) {
            return NextResponse.json({ error: 'Missing sessionId payload' }, { status: 400 })
        }

        // Retrieve the checkout session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId)

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        if (session.payment_status !== 'paid') {
            return NextResponse.json({ error: 'Payment not completed', status: session.payment_status }, { status: 400 })
        }

        // Extract order IDs from metadata
        let orderIds = []
        try {
            if (session.metadata?.orderIds) {
                orderIds = JSON.parse(session.metadata.orderIds)
            }
        } catch (e) {
            console.error('Failed to parse orderIds from Stripe metadata', e)
        }

        if (Array.isArray(orderIds) && orderIds.length > 0) {
            // Mark orders as paid
            await prisma.order.updateMany({
                where: { id: { in: orderIds } },
                data: { isPaid: true }
            })
        } else {
            console.warn('No orderIds found in Stripe session metadata')
        }

        return NextResponse.json({ success: true, session_status: session.status })
    } catch (err) {
        console.error('Stripe verify error:', err)
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
    }
}
