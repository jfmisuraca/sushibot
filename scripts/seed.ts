import { PrismaClient } from '@prisma/client'
import { preloadedBoxes, storeInfo } from '../app/api/chat/data'

const prisma = new PrismaClient()

async function main() {
  try {
    // Limpiar base de datos
    console.log('Limpiando base de datos...')
    await prisma.order.deleteMany()
    await prisma.product.deleteMany()
    await prisma.box.deleteMany()
    await prisma.store.deleteMany()
    
    // Cargar boxes
    console.log('Cargando boxes...')
    for (const box of preloadedBoxes) {
      await prisma.box.create({
        data: {
          name: box.name,
          description: box.description,
          price: box.price,
          availability: box.availability,
          contents: box.contents
        }
      })
    }

    // Cargar información de la tienda
    console.log('Cargando información de la tienda...')
    await prisma.store.create({
      data: {
        address: storeInfo.address,
        phone: storeInfo.phone,
        hours: storeInfo.hours as any,
        isOpen: storeInfo.isOpen
      }
    })
    
    console.log('✅ Base de datos poblada exitosamente')
  } catch (error) {
    console.error('❌ Error al poblar la base de datos:', error)
    throw error
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 