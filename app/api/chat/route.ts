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
          const args = JSON.parse(assistantMessage.tool_calls[0].function.arguments);
          return handleCreateOrder({
            items: args.items,
            confirm: args.confirm
          });
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

export function handleCreateOrder(orderRequest: OrderRequest) {
  // Si no hay items ni box específico, mostrar disponibles
  if ((!orderRequest.items || orderRequest.items.length === 0) && (!orderRequest.boxName || orderRequest.boxName.trim() === '')) {
    const boxList = preloadedBoxes
      .filter(box => box.availability === "disponible")
      .map(box => 
        `\n🍱 ${box.name}\nPrecio: $${box.price}\nContenido:\n${box.contents.map(item => `• ${item}`).join('\n')}`
      )
      .join('\n');

    return NextResponse.json({
      response: `¡Claro! Estos son nuestros boxes disponibles:${boxList}\n\n¿Cuál te gustaría pedir?`
    });
  }

  // Normalizar confirmación
  const isConfirmed = typeof orderRequest.confirm === 'string' 
    ? ['si', 'sí', 'yes'].includes(orderRequest.confirm.toLowerCase().trim())
    : orderRequest.confirm;

  // Procesar pedido único o múltiple
  let items: OrderItem[] = [];
  if (orderRequest.items) {
    items = orderRequest.items;
  } else if (orderRequest.boxName && orderRequest.quantity) {
    items = [{ boxName: orderRequest.boxName, quantity: orderRequest.quantity }];
  }

  // Validar y procesar cada item
  let total = 0;
  const validItems: Array<{ box: Box, quantity: number }> = [];
  const errors: string[] = [];

  for (const item of items) {
    const normalizedSearchName = item.boxName.toLowerCase().trim();
    const box = preloadedBoxes.find(b => {
      const boxNameNormalized = b.name.toLowerCase().trim();
      return boxNameNormalized === normalizedSearchName ||
             boxNameNormalized.includes(normalizedSearchName) ||
             normalizedSearchName.includes(boxNameNormalized);
    });

    if (!box) {
      errors.push(`No encontré el box "${item.boxName}"`);
      continue;
    }

    if (box.availability !== "disponible") {
      errors.push(`El ${box.name} no está disponible`);
      continue;
    }

    if (item.quantity <= 0) {
      errors.push(`La cantidad para ${box.name} debe ser mayor a 0`);
      continue;
    }

    validItems.push({ box, quantity: item.quantity });
    total += box.price * item.quantity;
  }

  if (errors.length > 0) {
    return NextResponse.json({
      response: `❌ Hay algunos problemas con tu pedido:\n${errors.join('\n')}\n\n¿Querés intentar nuevamente?`
    });
  }

  // Si no está confirmado, mostrar resumen
  if (!isConfirmed) {
    const itemsList = validItems
      .map(item => `📦 ${item.quantity}x ${item.box.name} ($${(item.quantity * item.box.price).toFixed(2)})\n${item.box.contents.map(c => `  • ${c}`).join('\n')}`)
      .join('\n\n');

    return NextResponse.json({
      response: `📋 Resumen de tu pedido:\n\n${itemsList}\n\n💰 Total: $${total.toFixed(2)}\n\n¿Confirmás el pedido? (Respondé "sí" para confirmar o "no" para cancelar)`
    });
  }

  // Confirmar pedido
  const confirmedList = validItems
    .map(item => `📦 ${item.quantity}x ${item.box.name}`)
    .join('\n');

  return NextResponse.json({
    response: `✅ ¡Pedido confirmado!\n\n${confirmedList}\n\n💰 Total: $${total.toFixed(2)}\n\nTu pedido está siendo preparado. ¿Necesitás algo más?`
  });
}


