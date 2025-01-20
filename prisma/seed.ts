import { PrismaClient } from '@prisma/client'
import { preloadedBoxes, storeInfo } from '../app/api/chat/data'
import { ObjectId } from 'bson'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando carga de datos...')

  // Cargar boxes
  console.log('📦 Cargando boxes...')
  for (const box of preloadedBoxes) {
    await prisma.box.upsert({
      where: { name: box.name },
      update: box,
      create: box,
    })
  }

  // Generar un ObjectId válido para la tienda
  const storeId = new ObjectId().toString()

  // Cargar información de la tienda
  console.log('🏪 Cargando información de la tienda...')
  await prisma.store.upsert({
    where: { id: storeId },
    update: {
      address: storeInfo.address,
      phone: storeInfo.phone,
      hours: storeInfo.hours,
      isOpen: storeInfo.isOpen,
    },
    create: {
      id: storeId,
      address: storeInfo.address,
      phone: storeInfo.phone,
      hours: storeInfo.hours,
      isOpen: storeInfo.isOpen,
    },
  })

  console.log('✅ Datos cargados exitosamente')
}

main()
  .catch((e) => {
    console.error('❌ Error durante la carga de datos:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 