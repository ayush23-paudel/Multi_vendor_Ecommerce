const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main(){
  try{
    console.log('Updating orders with paymentMethod=ESEWA to KHALTI...')
    const result = await prisma.$executeRawUnsafe("UPDATE \"Order\" SET \"paymentMethod\" = 'KHALTI' WHERE \"paymentMethod\" = 'ESEWA';")
    console.log('Update result:', result)
  }catch(e){
    console.error('Update failed:', e)
    process.exitCode = 1
  } finally{
    await prisma.$disconnect()
  }
}

main()
