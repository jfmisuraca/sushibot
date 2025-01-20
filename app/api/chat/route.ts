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
            description: "Query available sushi boxes",
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
            description: "Get information about store hours, address, phone, and current open/closed status",
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

function handleQueryBoxes() {
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

function handleGetStoreInfo() {
  const { address, phone, hours, isOpen } = storeInfo
  const hoursInfo = hours.map((h) => `${h.day}: ${h.open} - ${h.close}`).join("\n")
  const openStatus = isOpen ? "Abierto" : "Cerrado"

  return NextResponse.json({
    response: `Información de la tienda:
Dirección: ${address}
Teléfono: ${phone}
Horarios:
${hoursInfo}
Estado actual: ${openStatus}`,
  })
}


