import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request){
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');

        const query = {
            inStock: true,
            stock: {
                gt: 0
            }
        };
        if (storeId) {
            query.storeId = storeId;
        }

        let products = await prisma.product.findMany({
            where: query,
            include: {
                rating:{
                    select:{
                        createdAt: true , rating: true, review: true,
                        user: {select: {name: true, image: true}}

                    }
                },
                store:true
            },
            orderBy: {createdAt: 'desc'}
        })
        // remove products with store isActive false
        products = products.filter(product => product.store.isActive)
        return NextResponse.json({products})
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "An internal server error occured."},{status: 500})
    }
}