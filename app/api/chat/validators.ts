import { preloadedBoxes } from "./data"
import { OrderRequest } from "./types"

export function validateOrder(order: OrderRequest) {
  if (!order.items?.length) {
    throw new Error('El pedido debe contener al menos un ítem')
  }

  for (const item of order.items) {
    if (item.quantity <= 0) {
      throw new Error('La cantidad debe ser mayor a 0')
    }
    
    const box = preloadedBoxes.find(b => b.name === item.boxName)
    if (!box) {
      throw new Error(`Box no encontrado: ${item.boxName}`)
    }
    if (box.availability !== 'disponible') {
      throw new Error(`Box no disponible: ${item.boxName}`)
    }
  }
}

export function validatePrice(price: number): boolean {
  return price > 0 && Number.isFinite(price)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+54\s?[0-9]{2,3}\s?[0-9]{4}-?[0-9]{4}$/
  return phoneRegex.test(phone)
}

export function validateTime(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

export function validateBox(boxName: string): boolean {
  return preloadedBoxes.some(box => 
    box.name === boxName && box.availability === "disponible"
  )
} 