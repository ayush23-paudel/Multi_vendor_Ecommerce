import { convertUSDToNPR } from "@/lib/currency"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Khalti initiation endpoint
export async function POST(request) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 })
    }

    const { orderIds, totalAmountUSD } = await request.json()
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "missing order data" }, { status: 400 })
    }

    // Convert USD to NPR and then to paisa (Khalti expects amount in paisa)
    const totalAmountNPR = convertUSDToNPR(totalAmountUSD)
    const roundedNPR = Math.round(totalAmountNPR * 100) / 100
    const amountPaisa = Math.round(roundedNPR * 100)

    const khaltiSecretKey = process.env.KHALTI_SECRET_KEY || "test_secret_key"
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "http://localhost:3000")

    const payload = {
      return_url: `${appUrl}/payment/khalti/verify`,
      website_url: appUrl,
      amount: amountPaisa,
      purchase_order_id: orderIds.join(','),
      purchase_order_name: "HamroCart Order",
      customer_info: {
        name: "Customer",
        email: "customer@example.com",
        phone: "9800000000"
      }
    }

    const response = await fetch("https://a.khalti.com/api/v2/epayment/initiate/", {
      method: "POST",
      headers: {
        "Authorization": `Key ${khaltiSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })

    const paymentData = await response.json()

    if (!response.ok) {
      console.error("Khalti initiate failed: ", paymentData)
      return NextResponse.json({ error: paymentData.detail || 'Khalti initiate failed' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      payment_url: paymentData.payment_url,
      pidx: paymentData.pidx
    })
  } catch (error) {
    console.error("Khalti initiate error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
