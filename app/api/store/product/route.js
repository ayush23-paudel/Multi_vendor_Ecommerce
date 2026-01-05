import imagekit from "@/configs/imageKit"
import prisma from "@/lib/prisma"
import authSeller from "@/middlewares/authSeller"
import {getAuth} from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
// add a new product

export async function POST(request){
    try {
        const{userId} = getAuth(request)
        // to get the store id we need a middleware that will take the user id and return store id 
        const storeId = await authSeller(userId)
        if(!storeId){
            return NextResponse.json({error:'not authorized'},{status:401})
        }
        //get the data from the form

        const formData = await request.formData()
        const name= formData.get("name")
        const description= formData.get("description")
        const mrp= Number(formData.get("mrp"))
        const price= Number(formData.get("price"))
        const category= formData.get("category")
        const images= formData.getAll("images")
        if (!name || !description || !mrp || !price || !category || images.length<1){
 return NextResponse.json({error:'missing product details'},{status:401})
        }

        // uploading images to imagekit
        const imagesUrl= await Promise.all(images.map(async (image)=>{
            const buffer = Buffer.from(await image.arrayBuffer());
            const response = await imagekit.upload({
                file: buffer,
                fileName: image.name,
                folder: "products",
                
            })
const url = imagekit.url({
    path: response.filePath,
    transformation: [
        {quality:'auto'},
        {format: 'webp'},
        {width: '1024'}
    ]
})
return url
        }))
        await prisma.product.create({
            data:{
                name,
                description,
                mrp,
                price,
                category,
                images: imagesUrl,
                storeId
            }
        })
        return NextResponse.json({message:"Product added successfully"})
    } catch (error) {
        console.error(error);
         return NextResponse.json({error: error.code || error.message}, {status:400})
    }
}

// get all products for a seller

export async function GET(request){
    try {
        const{userId} = getAuth(request)
       
        const storeId = await authSeller(userId)
        if(!storeId){
            return NextResponse.json({error:'not authorized'},{status:401})
        }
        const products = await prisma.product.findMany({where: {storeId}})
        return NextResponse.json({products})
    } catch (error) {
        console.error(error);
         return NextResponse.json({error: error.code || error.message}, {status:400})
    }
}
