const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Fixing products where stock <= 0 but inStock is true...')
    
    // Find matching products first to log them
    const productsToUpdate = await prisma.product.findMany({
      where: {
        stock: {
          lte: 0
        },
        inStock: true
      },
      select: {
        id: true,
        name: true,
        stock: true
      }
    })

    console.log(`Found ${productsToUpdate.length} mismatched products:`)
    productsToUpdate.forEach(p => {
      console.log(`- [${p.id}] ${p.name} (Stock: ${p.stock})`)
    })

    if (productsToUpdate.length > 0) {
      const result = await prisma.product.updateMany({
        where: {
          stock: {
            lte: 0
          },
          inStock: true
        },
        data: {
          inStock: false
        }
      })
      console.log(`Successfully updated ${result.count} products to out-of-stock (inStock: false).`)
    } else {
      console.log('No mismatched products found.')
    }
  } catch (e) {
    console.error('Update failed:', e)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
