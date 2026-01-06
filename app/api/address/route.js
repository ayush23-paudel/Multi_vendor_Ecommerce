
// add new address

import prisma from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(request){
      try {
        const {userId} = getAuth(request)
        
       
         const body = await request.json()  
    const newAddress = await prisma.address.create({
         data: {
    ...body.address,   
    userId
  }})
     
        return NextResponse.json({newAddress, message:"address added successfully "})
    } catch (error) {
        console.error(error)
        return NextResponse.json({error: error.code || error.message},{status:400})
    }
}

// get all addresses for the user 
export async function GET(request){
    try {
        const {userId} = getAuth(request)
        
    const addresses = await prisma.address.findMany({
        where: {userId}
    })
     
        return NextResponse.json({addresses, message:"address added successfully "})
    } catch (error) {
        console.error(error)
        return NextResponse.json({error: error.code || error.message},{status:400})
    }
}
