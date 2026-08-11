import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import { inngest } from "@/inngest/client";

import { NextResponse } from "next/server";


export async function POST(request) {
    try {
        const { userId, has } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        }
        const { addressId, items, couponCode, paymentMethod } = await request.json()
        // check if all required fields are present
        if (!addressId || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "missing order details" }, { status: 401 });
        }
        let coupon = null;
        if (couponCode) {
            coupon = await prisma.coupon.findUnique({
                where: { code: couponCode }
            })
            if (!coupon) {
                return NextRequest.json({
                    error: "coupon not found"
                }, { status: 404 })
            }
        }

        // check if coupon is applicable for new user



        if (couponCode && coupon.forNewUser) {
            const userorders = await prisma.order.findMany({
                where: { userId }
            })
            if (userorders.length > 0) {
                return NextResponse.json({ error: "coupon valid for new users" }, { status: 404 })
            }
        }
        const isPlusMember = has({ plan: 'plus' })
        // check if coupon is applicable for users
        if (couponCode && coupon.forMember) {

            if (!isPlusMember) {
                return NextResponse.json({ error: "coupon valid for members only " }, { status: 404 })
            }
        }
        // Group orders by storeId using a Map
        const ordersByStore = new Map()

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.id }
            })
            if (!product) {
                return NextResponse.json({ error: `Product not found.` }, { status: 404 })
            }
            if (!product.inStock || product.stock < item.quantity) {
                return NextResponse.json({ error: `Product "${product.name}" is out of stock or does not have enough stock available.` }, { status: 400 })
            }
            const storeId = product.storeId
            if (!ordersByStore.has(storeId)) {
                ordersByStore.set(storeId, [])

            }
            ordersByStore.get(storeId).push({ ...item, price: product.price })

        }
        let orderIds = [];
        let fullAmount = 0;
        let isShippingFeeAdded = false

        // create orders for each seller

        for (const [storeId, sellerItems] of ordersByStore.entries()) {
            let total = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
            if (couponCode) {
                total -= (total * coupon.discount) / 100;
            }
            if (!isPlusMember && !isShippingFeeAdded) {
                total += 5;
                isShippingFeeAdded = true
            }
            fullAmount += parseFloat(total.toFixed(2))
            const order = await prisma.order.create({
                data: {
                    userId,
                    storeId,
                    addressId,
                    total: parseFloat(total.toFixed(2)),
                    paymentMethod,
                    isCouponUsed: coupon ? true : false,
                    coupon: coupon ? coupon : {},
                    orderItems: {
                        create: sellerItems.map(item => ({
                            productId: item.id,
                            quantity: item.quantity,
                            price: item.price

                        }))
                    }
                }
            })
            orderIds.push(order.id)
        }

        // decrement stock immediately for all orders (COD and Online payment reservations)
        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.id }
            })
            if (product) {
                const newStock = Math.max(0, product.stock - item.quantity);
                await prisma.product.update({
                    where: { id: product.id },
                    data: {
                        stock: newStock,
                        inStock: newStock > 0
                    }
                })
            }
        }

        // Send payment timeout event for online payment methods (Stripe, Khalti)
        if (paymentMethod !== 'COD') {
            try {
                await inngest.send({
                    name: 'order/payment.timeout',
                    data: { orderIds }
                })
            } catch (inngestError) {
                console.error("Inngest order timeout event failed:", inngestError)
            }
        }

        // clear the cart 
        await prisma.user.update({
            where: { id: userId },
            data: { cart: {} }
        })

        if (paymentMethod === 'STRIPE') {
            const Stripe = require('stripe');
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_123'); // ensure fallback doesn't crash dev without keys

            // total amount must be in cents for USD
            const amountInCents = Math.round(fullAmount * 100);

            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            try {
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // expire in 30 mins (minimum supported by Stripe)
                    line_items: [
                        {
                            price_data: {
                                currency: 'usd',
                                product_data: {
                                    name: 'Hamrocart Order',
                                },
                                unit_amount: amountInCents,
                            },
                            quantity: 1,
                        },
                    ],
                    mode: 'payment',
                    success_url: `${baseUrl}/payment/stripe/verify?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${baseUrl}/cart`,
                    metadata: {
                        orderIds: JSON.stringify(orderIds)
                    }
                });
                return NextResponse.json({ message: 'Orders placed successfully', orderIds, session: { url: session.url } });
            } catch (stripeError) {
                console.error('Stripe session creation error:', stripeError);
                return NextResponse.json({ error: 'Failed to create Stripe payment session' }, { status: 500 });
            }
        }

        return NextResponse.json({ message: 'Orders placed successfully', orderIds })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }

}

// Get all orders for user

export async function GET(request) {
    try {
        const { userId, has } = getAuth(request)
        const orders = await prisma.order.findMany({
            where: {
                userId, OR: [
                    { paymentMethod: PaymentMethod.COD },
                    { AND: [{ paymentMethod: PaymentMethod.STRIPE }, { isPaid: true }] },
                    { AND: [{ paymentMethod: PaymentMethod.ESEWA }, { isPaid: true }] },
                     { AND: [{ paymentMethod: PaymentMethod.KHALTI }, { isPaid: true }] }
                ]
                
            },
            include: {
                orderItems: { include: { product: true } },
                address: true
            },
            orderBy: { createdAt: 'desc' }

        })
        return NextResponse.json({ orders })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}