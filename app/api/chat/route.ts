import { NextResponse } from "next/server"
import openai from "../../../lib/openai"
import { handleQueryBoxes, handleGetStoreInfo, handleGetLocation, handleGetPhone, handleCreateOrder } from "./handlers"

export async function GET() {
  return new Response(JSON.stringify({ status: "OK" }))
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

NO INVENTES otros boxes ni precios. Tus clientes son argentinos, tenés que hablarles con voseo. Sólo podés usar información de la base de datos.`,
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
          return handleCreateOrder(args)
        default:
          return new Response(JSON.stringify({
            response: "Lo siento, no pude procesar esa solicitud."
          }))
      }
    }

    if (!assistantMessage.tool_calls) {
      return new Response(JSON.stringify({
        response: assistantMessage.content || "Lo siento, no pude procesar esa solicitud."
      }))
    }

    return new Response(JSON.stringify({
      response: assistantMessage.content || "Lo siento, no pude procesar esa solicitud.",
    }), { status: 500 })
  } catch (error) {
    console.error("Error detallado:", error)
    return new Response(JSON.stringify({
      response: "Lo siento, hubo un error al procesar tu solicitud.",
      error: error instanceof Error ? error.message : "Error desconocido"
    }), { status: 500 })
  }
}


