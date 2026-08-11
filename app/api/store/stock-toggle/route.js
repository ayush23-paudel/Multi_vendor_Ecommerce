// toggle stock of a product 

import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request){
    try {
        const {userId}= getAuth(request)
        const {productId} = await request.json()
        if(!productId){
            NextResponse.json ({error: "missing details : productId"},{status: 400});
        }
        const storeId = await authSeller(userId)
        if(!storeId){
            return NextResponse.json ({error: "not authorized"},{status: 401})
        }

        // check if product exists 
        const product = await prisma.product.findFirst({
            where: {id: productId, storeId}
        })
        if (!product){
             return NextResponse.json ({error: "no product found "},{status: 404})
        }

        // If toggling from out-of-stock (inStock: false) to in-stock (inStock: true)
        // verify that the product actually has positive stock.
        if (!product.inStock && product.stock <= 0) {
            return NextResponse.json({ error: "Cannot mark product as In Stock because the stock quantity is 0. Please update the stock quantity instead." }, { status: 400 })
        }

        await prisma.product.update({
            where: {id: productId},
            data: {inStock: !product.inStock}
        })
        return NextResponse.json({message: "product stock updated successfully "})
        }
     catch (error) {
        console.error(error);
        return NextResponse.json({error: error.code || error.message}, {status:400})

        
    }
}