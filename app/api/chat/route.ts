import { NextResponse } from "next/server"
import openai from "../../../lib/openai"
import { handleQueryBoxes, handleGetStoreInfo, handleGetLocation, handleGetPhone, handleCreateOrder } from "./handlers"

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

interface OrderItem {
  boxName: string;
  quantity: number;
}

interface OrderRequest {
  items?: OrderItem[];
  boxName?: string;
  quantity?: number;
  confirm?: boolean | string;
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
          content: `Sos un asistente de ayuda para un restaurante de sushi. Solo podés ofrecer estos boxes específicos:
- Box Chica ($32.24): 4 piezas variadas
- Box Mediana ($99.16): 8 piezas variadas
- Box Grande ($169.89): 12 piezas variadas
- Box Vegana (Mediana) ($103.62): 8 piezas veganas

NO INVENTES otros boxes ni precios. Para pedidos, cuando el usuario confirma con 'sí', 'si' o similar, debés usar create_order con confirm=true. Tus clientes son argentinos, tenés que hablarles con voseo. Sólo podés usar información de la base de datos.`,
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
        {
          type: "function",
          function: {
            name: "create_order",
            description: "Crear un nuevo pedido de box de sushi o confirmar uno existente. Si el usuario dice 'sí' o similar a un pedido pendiente, usar confirm=true.",
            parameters: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      boxName: { 
                        type: "string",
                        description: "Nombre del box a pedir"
                      },
                      quantity: { 
                        type: "number",
                        description: "Cantidad de boxes"
                      }
                    },
                    required: ["boxName", "quantity"]
                  }
                },
                confirm: {
                  type: "boolean",
                  description: "true cuando el usuario confirma el pedido con 'sí', 'si' o similar"
                }
              },
              required: ["items"]
            }
          }
        }
      ],
    })

    const assistantMessage = chatCompletion.choices[0].message

    if (assistantMessage.tool_calls) {
      const functionName = assistantMessage.tool_calls[0].function.name
      const args = JSON.parse(assistantMessage.tool_calls[0].function.arguments)

      switch (functionName) {
        case "query_boxes":
          return handleQueryBoxes()
        case "get_store_info":
          return handleGetStoreInfo()
        case "get_location":
          return handleGetLocation()
        case "get_phone":
          return handleGetPhone()
        case "create_order":
          return handleCreateOrder({
            items: args.items,
            confirm: args.confirm
          })
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


