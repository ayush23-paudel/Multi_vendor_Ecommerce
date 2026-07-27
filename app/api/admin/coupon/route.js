// add new coupon

import { inngest } from "@/inngest/client";
import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request){
    try {
        const{userId} = getAuth(request)
        const isAdmin = await authAdmin(userId)
        if(!isAdmin){
            return NextResponse.json({error:"not authorised"},{status:401})
        }

        const {coupon} = await request.json()
        if (!coupon || !coupon.code || !coupon.discount || !coupon.expiresAt) {
            return NextResponse.json({error: "Missing required coupon details"}, {status: 400})
        }

        coupon.code = coupon.code.toUpperCase()
        
        // Parse and validate date
        const expiresAt = new Date(coupon.expiresAt)
        if (isNaN(expiresAt.getTime())) {
            return NextResponse.json({error: "Invalid expiration date"}, {status: 400})
        }

        if (expiresAt <= new Date()) {
            return NextResponse.json({error: "Expiration date must be in the future"}, {status: 400})
        }

        coupon.expiresAt = expiresAt
        coupon.discount = Number(coupon.discount)

        // Create coupon in database
        const createdCoupon = await prisma.coupon.create({ data: coupon })

        // Safely send event to Inngest to delete coupon on expire
        try {
            await inngest.send({
                name: "app/coupon.expired",
                data:{
                    code: createdCoupon.code,
                    expires_at: createdCoupon.expiresAt,
                }
            })
        } catch (inngestError) {
            console.error("Inngest send event failed:", inngestError)
            // Do not fail the request; the database record is already successfully created.
        }

        return NextResponse.json({message:"coupon added successfully"})
    } catch (error) {
        console.error(error)
        if (error.code === 'P2002') {
            return NextResponse.json({error: "A coupon with this code already exists"}, {status: 400})
        }
        return NextResponse.json({error: error.code || error.message},{status:400})
    }
}

// delete coupon /api/coupon?id=couponId

export async function DELETE(request) {
    try { 
        const {userId} = getAuth(request)
        const isAdmin = await authAdmin(userId)
        if(!isAdmin){
            return NextResponse.json({error:"not authorised"},{status:401})
        }

const {searchParams} = request.nextUrl;
const code = searchParams.get('code')
        await prisma.coupon.delete({where:{code}})
        return NextResponse.json({message:"coupon deleted successfully"})
    } catch (error) {
         console.error(error)
        return NextResponse.json({error: error.code || error.message},{status:400})
    
    }
    
}


// get all coupons

export async function GET(request) {
    try {
         const{userId} = getAuth(request)
        const isAdmin = await authAdmin(userId)
        if(!isAdmin){
            return NextResponse.json({error:"not authorised"},{status:401})
        }
        const coupons = await prisma.coupon.findMany({})
        return NextResponse.json({coupons})
    } catch (error) {
         console.error(error)
        return NextResponse.json({error: error.code || error.message},{status:400})
    }
}