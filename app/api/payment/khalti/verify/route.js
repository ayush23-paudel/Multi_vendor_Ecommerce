import prisma from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY || "test_secret_key"

export async function POST(request) {
  try {
    const { userId } = getAuth(request)
    if (!userId) return NextResponse.json({ error: 'not authorized' }, { status: 401 })

    const { pidx, orderIds } = await request.json()
    if (!pidx) return NextResponse.json({ error: 'missing pidx payload' }, { status: 400 })

    // Verify with Khalti v2
    const verifyRes = await fetch('https://a.khalti.com/api/v2/epayment/lookup/', {
      method: 'POST',
      headers: {
        Authorization: `Key ${KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pidx })
    })

    const verifyJson = await verifyRes.json()
    if (!verifyRes.ok) {
      console.error('Khalti verify request failed', verifyJson)
      return NextResponse.json({ error: 'verification request failed', detail: verifyJson }, { status: 400 })
    }

    if (verifyJson.status !== 'Completed') {
      return NextResponse.json({ error: 'Payment not completed', detail: verifyJson }, { status: 400 })
    }

    // mark orders as paid
    if (Array.isArray(orderIds)) {
      await prisma.order.updateMany({ where: { id: { in: orderIds } }, data: { isPaid: true } })
    }

    return NextResponse.json({ success: true, verify: verifyJson })
  } catch (err) {
    console.error('Khalti verify error', err)
    return NextResponse.json({ error: err.message || 'internal error' }, { status: 500 })
  }
}
