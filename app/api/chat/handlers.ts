import { NextResponse } from "next/server"
import { preloadedBoxes, storeInfo } from "./data"
import type { OrderRequest } from "./types"

export function handleQueryBoxes() {
  const boxList = preloadedBoxes
    .map(
      (box) =>
        `- ${box.name}: $${box.price} (${box.availability})
  Descripción: ${box.description}
  Contiene: ${box.contents.join(", ")}`,
    )
    .join("\n\n")

  return NextResponse.json({
    response: `Estos son nuestros boxes disponibles:\n\n${boxList}`,
  })
}

export function handleGetStoreInfo() {
  const { hours } = storeInfo
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const todayHours = currentDay >= 1 && currentDay <= 5 ? hours.weekdays : hours.weekends

  if (!todayHours) {
    return NextResponse.json({
      response: "Lo siento, no hay información de horarios disponible para hoy."
    })
  }

  const [openHour, openMinute] = todayHours.open.split(":").map(Number)
  const [closeHour, closeMinute] = todayHours.close.split(":").map(Number)
  const openTime = openHour * 60 + openMinute
  const closeTime = closeHour * 60 + closeMinute

  const isOpen = currentTime >= openTime && currentTime < closeTime
  const hoursInfo = `${hours.weekdays.day}: ${hours.weekdays.open} a ${hours.weekdays.close}hs\n${hours.weekends.day}: ${hours.weekends.open} a ${hours.weekends.close}hs`

  return NextResponse.json({
    response: `🕒 Nuestros horarios:\n\n${hoursInfo}\n\n${isOpen ? "✅ Estamos abiertos ahora" : "❌ Estamos cerrados ahora"}`
  })
}

export function handleGetLocation() {
  const { address } = storeInfo

  return NextResponse.json({
    response: `📍 Nos encontramos en:\n${address}`
  })
}

export function handleGetPhone() {
  const { phone } = storeInfo

  return NextResponse.json({
    response: `📞 Nuestro teléfono:\n${phone}`
  })
}

export function handleCreateOrder(orderRequest: OrderRequest) {
  if (orderRequest.confirm) {
    return NextResponse.json({
      response: "¡Gracias! Tu pedido ha sido confirmado y será preparado pronto."
    })
  }

  const orderDetails = orderRequest.items
    ?.map(item => `${item.quantity}x ${item.boxName}`)
    .join(", ")

  return NextResponse.json({
    response: `Por favor confirma tu pedido de: ${orderDetails}. ¿Estás de acuerdo?`
  })
} 