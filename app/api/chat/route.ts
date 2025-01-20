import { NextResponse } from "next/server"
import openai from "../../../lib/openai"

interface Box {
  name: string
  price: number
  description: string
  contents: string[]
  availability: "disponible" | "no disponible"
}

const preloadedBoxes: Box[] = [
  {
    name: "Box Chica",
    price: 32.24,
    description: "Ideal para una persona, incluye 4 piezas variadas.",
    contents: ["Nigiri de salmón", "Maki de pepino", "Temaki de atún", "Uramaki de aguacate"],
    availability: "disponible",
  },
  {
    name: "Box Mediana",
    price: 99.16,
    description: "Perfecta para compartir, incluye 8 piezas variadas.",
    contents: [
      "Nigiri de salmón",
      "Maki de pepino",
      "Temaki de atún",
      "Uramaki de aguacate",
      "Sashimi de salmón",
      "Nigiri de camarón",
      "Maki de atún",
      "Temaki de vegetales",
    ],
    availability: "disponible",
  },
  {
    name: "Box Grande",
    price: 169.89,
    description: "Un festín para varios, incluye 12 piezas variadas.",
    contents: [
      "Nigiri de salmón",
      "Maki de pepino",
      "Temaki de atún",
      "Uramaki de aguacate",
      "Sashimi de salmón",
      "Nigiri de camarón",
      "Maki de atún",
      "Temaki de vegetales",
      "Nigiri de anguila",
      "Uramaki de salmón",
      "Sashimi de atún",
      "Maki de camarón",
    ],
    availability: "disponible",
  },
  {
    name: "Box Vegana (Mediana)",
    price: 103.62,
    description: "La mejor opción para los amantes de lo vegano, incluye 8 piezas veganas.",
    contents: [
      "Maki de pepino",
      "Uramaki de aguacate",
      "Temaki de vegetales",
      "Nigiri de tofu",
      "Maki de zanahoria",
      "Uramaki de espárragos",
      "Temaki de mango",
      "Nigiri de berenjena",
    ],
    availability: "disponible",
  },
]

interface StoreInfo {
  address: string
  phone: string
  hours: {
    day: string
    open: string
    close: string
  }[]
  isOpen: boolean
}

const storeInfo: StoreInfo = {
  address: "Av. Corrientes 1234, Buenos Aires, Argentina",
  phone: "+54 11 1234-5678",
  hours: [
    { day: "Lunes a Viernes", open: "11:00", close: "22:00" },
    { day: "Sábados y Domingos", open: "12:00", close: "23:00" },
  ],
  isOpen: true,
}

export async function GET() {
  return NextResponse.json({ status: "OK" })
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "Sos un asistente de ayuda para un restaurante de sushi. Podés consultar boxes de sushi (mostrándolos en forma de lista, no uno detrás del otro), verificar su disponibilidad, realizar pedidos, cambiar o cancelar pedidos, y brindar información sobre los horarios, dirección y teléfono del local. Tus clientes son argentinos, tenés que hablarles con voseo. Sólo podés usar información de la base de datos.",
        },
        { role: "user", content: message },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "query_boxes",
            description: "Consultar los boxes de sushi disponibles",
            parameters: {
              type: "object",
              properties: {},
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_store_info",
            description: "Consultar los horarios del local",
            parameters: {
              type: "object",
              properties: {},
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_location",
            description: "Consultar solo la dirección del local",
            parameters: {
              type: "object",
              properties: {},
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_phone",
            description: "Consultar solo el teléfono del local",
            parameters: {
              type: "object",
              properties: {},
            },
          },
        },
      ],
    })

    const assistantMessage = chatCompletion.choices[0].message

    if (assistantMessage.tool_calls) {
      const functionName = assistantMessage.tool_calls[0].function.name

      switch (functionName) {
        case "query_boxes":
          return handleQueryBoxes()
        case "get_store_info":
          return handleGetStoreInfo()
        case "get_location":
          return handleGetLocation()
        case "get_phone":
          return handleGetPhone()
        default:
          return NextResponse.json({
            response: "Lo siento, no pude procesar esa solicitud.",
          })
      }
    }

    return NextResponse.json({
      response: assistantMessage.content || "Lo siento, no pude procesar esa solicitud.",
    })
  } catch (error) {
    console.error("Error detallado:", error)
    return NextResponse.json(
      {
        response: "Lo siento, hubo un error al procesar tu solicitud.",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

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


