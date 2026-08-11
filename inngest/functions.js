
import { inngest } from './client';
import prisma from '@/lib/prisma'

// ingest funtion to save data in the database
export const syncUserCreation = inngest.createFunction(
    {id: 'sync-user-create'},
    {event: 'clerk/user.created'},
    async ({event})=>{
        const {data} = event
        await prisma.user.create({
            data:{
                id:data.id,
                email: data.email_addresses[0].email_address,
                name:`${data.first_name} ${data.last_name}`,
                image:data.image_url,
            }
        })
    }
)

// ingest function to update user data in database

    export const syncUserUpdation= inngest.createFunction(
        {id: 'sync-user-update'},
        {event: 'clerk/user.updated'},
        async({event})=> {
            const {data}= event
            await prisma.user.update({
                where: {id:data.id},
                data:{
                    email: data.email_addresses[0].email_address,
                    name:`${data.first_name} ${data.last_name}`,
                    image:data.image_url,
                }
            })
        }
    )

    // inngest function to delete user from our database

    export const syncUserDeletion = inngest.createFunction(
         {id: 'sync-user-delete'},
        {event: 'clerk/user.deleted'},
        async({event})=> {
            const {data}= event
            await prisma.user.delete({
                where: {id:data.id,},
              
            })
        }

    )

    // inngest function to delete coupon on expiry

    export const deleteCouponExpiry = inngest.createFunction(
        {id:'delete-coupon-on-expiry'},
        {event:'app/coupon.expired'},
        async({event , step})=>{
            const {data} = event
            const expiryDate = new Date(data.expires_at)
            await step.sleepUntil('wait-for-expiry',expiryDate)
            await step.run('delete-coupon-from-database',async()=>{
                await prisma.coupon.delete({
                    where: {code:data.code}
                })
            })
        }
    )

    export const handleOrderTimeout = inngest.createFunction(
        { id: 'handle-order-timeout' },
        { event: 'order/payment.timeout' },
        async ({ event, step }) => {
            const { orderIds } = event.data
            
            // Wait 35 minutes to ensure Stripe/Khalti session expires
            await step.sleep('wait-for-payment', '35m')
            
            await step.run('check-and-restore-stock', async () => {
                const unpaidOrders = await prisma.order.findMany({
                    where: {
                        id: { in: orderIds },
                        isPaid: false
                    },
                    include: {
                        orderItems: true
                    }
                })
                
                if (unpaidOrders.length > 0) {
                    for (const order of unpaidOrders) {
                        for (const item of order.orderItems) {
                            const product = await prisma.product.findUnique({
                                where: { id: item.productId }
                            })
                            if (product) {
                                const newStock = product.stock + item.quantity
                                await prisma.product.update({
                                    where: { id: product.id },
                                    data: {
                                        stock: newStock,
                                        inStock: true
                                    }
                                })
                            }
                        }
                        
                        // Delete unpaid order
                        await prisma.order.delete({
                            where: { id: order.id }
                        })
                    }
                }
            })
        }
    )