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

  const todayHours = hours.find(h => {
    if (currentDay >= 1 && currentDay <= 5) return h.day === "Lunes a Viernes"
    return h.day === "Sábados y Domingos"
  })

  if (!todayHours) {
    return NextResponse.json({
      response: "Lo siento, no hay información de horarios disponible para hoy."
    });
  }

  const [openHour, openMinute] = todayHours.open.split(":").map(Number)
  const [closeHour, closeMinute] = todayHours.close.split(":").map(Number)
  const openTime = openHour * 60 + openMinute
  const closeTime = closeHour * 60 + closeMinute

  const isOpen = currentTime >= openTime && currentTime < closeTime
  const hoursInfo = hours.map((h) => `${h.day}: ${h.open} a ${h.close}hs`).join("\n")

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
  // Referencia al código original de handleCreateOrder
  // startLine: 315
  // endLine: 401
} 