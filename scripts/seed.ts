import { PrismaClient } from '@prisma/client'
import sushiBoxes from '../assets/sushiBoxes.json'
import sushiProducts from '../assets/sushiProducts.json'

const prisma = new PrismaClient()

async function main() {
  // Limpiar base de datos
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.box.deleteMany()
  
  // Cargar boxes
  for (const box of sushiBoxes.boxes) {
    await prisma.box.create({
      data: {
        name: box.name,
        description: box.description,
        price: box.price,
        products: {
          create: box.products.map(name => ({
            name,
            description: "Producto de sushi",
            price: 0,
            quantity: 100,
            vegan: false
          }))
        }
      }
    })
  }
  
  console.log('Base de datos poblada exitosamente')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 