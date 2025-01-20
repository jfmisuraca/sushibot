import { NextResponse } from "next/server"
import { preloadedBoxes, storeInfo } from "./data"
import type { OrderRequest } from "./types"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const createResponse = (response: string, status = 200) => {
  return NextResponse.json({ response }, { status })
}

export function handleQueryBoxes() {
  const boxList = preloadedBoxes
    .map(box => 
      `- ${box.name}: $${box.price} (${box.availability})
       ${box.description}
       Contiene: ${box.contents.join(", ")}`
    )
    .join("\n\n")

  return createResponse(`Estos son nuestros boxes disponibles:\n\n${boxList}`)
}

export function handleGetStoreInfo() {
  const { hours } = storeInfo
  const now = new Date()
  const isWeekday = now.getDay() >= 1 && now.getDay() <= 5
  const schedule = isWeekday ? hours.weekdays : hours.weekends
  const currentTime = now.getHours() * 60 + now.getMinutes()
  
  const [openHour, openMin] = schedule.open.split(":").map(Number)
  const [closeHour, closeMin] = schedule.close.split(":").map(Number)
  
  const isOpen = currentTime >= (openHour * 60 + openMin) && 
                 currentTime < (closeHour * 60 + closeMin)

  const hoursInfo = `Lunes a Viernes: ${hours.weekdays.open} a ${hours.weekdays.close}hs
Sábados y Domingos: ${hours.weekends.open} a ${hours.weekends.close}hs`

  return createResponse(
    `🕒 Nuestros horarios:\n\n${hoursInfo}\n\n${isOpen ? "✅ Abiertos" : "❌ Cerrados"}`
  )
}

export const handleGetLocation = () => 
  createResponse(`📍 Nos encontramos en:\n${storeInfo.address}`)

export const handleGetPhone = () => 
  createResponse(`📞 Nuestro teléfono:\n${storeInfo.phone}`)

export async function handleCreateOrder(orderRequest: OrderRequest) {
  try {
    if (!orderRequest.items?.length) {
      return createResponse("No se especificaron items para el pedido.", 400)
    }

    // Validar que los items sean un array válido
    if (!Array.isArray(orderRequest.items)) {
      return createResponse("Formato de pedido inválido", 400)
    }

    // Validar cada item del pedido
    for (const item of orderRequest.items) {
      const box = preloadedBoxes.find(b => b.name === item.boxName)
      
      if (!box) {
        return createResponse(`Box no encontrado: ${item.boxName}`, 400)
      }
      
      if (item.quantity <= 0) {
        return createResponse(`Cantidad inválida para ${item.boxName}`, 400)
      }
    }

    const total = orderRequest.items.reduce((sum, item) => {
      const box = preloadedBoxes.find(b => b.name === item.boxName)
      return sum + (box?.price || 0) * item.quantity
    }, 0)

    // Generar número de orden aleatorio de 4 dígitos
    const orderNumber = Math.floor(1000 + Math.random() * 9000)
    
    const order = await prisma.order.create({
      data: {
        items: orderRequest.items as any,
        total,
        status: 'pending'
      }
    })

    const orderDetails = orderRequest.items
      .map(item => `${item.quantity}x ${item.boxName}`)
      .join(", ")

    return createResponse(
      `¡Gracias! Tu pedido #${orderNumber} de ${orderDetails} (Total: $${total.toFixed(2)}) ha sido registrado.`
    )
  } catch (error) {
    console.error('Error en handleCreateOrder:', error)
    return createResponse("Error al procesar el pedido", 500)
  }
} 