import { NextResponse } from "next/server"
import openai from "@/lib/openai"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const INFORMACION_TIENDA = {
  direccion: "123 Sushi Street, Sushi City, SC 12345",
  telefono: "+1234567890",
  horario: "Lunes a Domingo: 11:00 AM - 10:00 PM",
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    // Revisar preguntas sobre la tienda
    if (message.toLowerCase().includes("dirección") || message.toLowerCase().includes("ubicación")) {
      return NextResponse.json({
        response: `Nuestra tienda está ubicada en: ${INFORMACION_TIENDA.direccion}

        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.215707164939!2d-73.98823495118787!3d40.74881737922642!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0:0x0!2zMzTCsDQ0JzU1LjciTiA3M8KwNTknMTcuNiJX!5e0!3m2!1ses!2s!4v1633059402833!5m2!1ses!2s" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`,
      })
    }

    if (message.toLowerCase().includes("teléfono")) {
      return NextResponse.json({ response: `Puedes contactarnos al teléfono: ${INFORMACION_TIENDA.telefono}` })
    }

    if (message.toLowerCase().includes("horario")) {
      return NextResponse.json({ response: `Nuestro horario es: ${INFORMACION_TIENDA.horario}` })
    }

    // OpenAI integration
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente útil para un restaurante de sushi. Puedes ayudar con consultas sobre productos, verificar disponibilidad, realizar pedidos y cambiar o cancelar pedidos.",
        },
        { role: "user", content: message },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "query_boxes",
            description: "Consultar cajas de sushi pre-armadas disponibles",
            parameters: {
              type: "object",
              properties: {},
            },
          },
        },
        {
          type: "function",
          function: {
            name: "check_availability",
            description: "Verificar disponibilidad de una caja de sushi específica",
            parameters: {
              type: "object",
              properties: {
                box_name: { type: "string" },
              },
              required: ["box_name"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "place_order",
            description: "Realizar un pedido de una caja de sushi",
            parameters: {
              type: "object",
              properties: {
                box_name: { type: "string" },
                quantity: { type: "integer" },
              },
              required: ["box_name", "quantity"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "change_order",
            description: "Cambiar un pedido existente",
            parameters: {
              type: "object",
              properties: {
                order_id: { type: "string" },
                new_quantity: { type: "integer" },
              },
              required: ["order_id", "new_quantity"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "cancel_order",
            description: "Cancelar un pedido existente",
            parameters: {
              type: "object",
              properties: {
                order_id: { type: "string" },
              },
              required: ["order_id"],
            },
          },
        },
      ],
    })

    const assistantMessage = chatCompletion.choices[0].message

    if (assistantMessage.tool_calls) {
      const functionCall = assistantMessage.tool_calls[0]
      const functionName = functionCall.function.name
      const functionArgs = JSON.parse(functionCall.function.arguments || "{}")

      switch (functionName) {
        case "query_boxes":
          return NextResponse.json({ response: await handleQueryBoxes() })
        case "check_availability":
          return NextResponse.json({ response: await handleCheckAvailability(functionArgs.box_name) })
        case "place_order":
          return NextResponse.json({ response: await handlePlaceOrder(functionArgs.box_name, functionArgs.quantity) })
        case "change_order":
          return NextResponse.json({
            response: await handleChangeOrder(functionArgs.order_id, functionArgs.new_quantity),
          })
        case "cancel_order":
          return NextResponse.json({ response: await handleCancelOrder(functionArgs.order_id) })
        default:
          return NextResponse.json({ response: "Lo siento, no pude procesar esa solicitud." })
      }
    } else {
      return NextResponse.json({ response: assistantMessage.content })
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Ocurrió un error al procesar la solicitud." }, { status: 500 })
  }
}

async function handleQueryBoxes() {
  const boxes = await prisma.box.findMany()
  return boxes.map((box) => `${box.name}: $${box.price.toFixed(2)} - ${box.description}`).join("\n\n")
}

async function handleCheckAvailability(boxName: string) {
  const box = await prisma.box.findFirst({
    where: { name: { contains: boxName, mode: "insensitive" } },
    include: { products: true },
  })

  if (box) {
    const availableProducts = box.products.filter((product) => product.quantity > 0)
    if (availableProducts.length === box.products.length) {
      return `La caja ${box.name} está disponible.`
    } else {
      return `Lo siento, la caja ${box.name} no está disponible en este momento debido a que algunos productos están agotados.`
    }
  } else {
    return `Lo siento, no pudimos encontrar una caja llamada "${boxName}".`
  }
}

async function handlePlaceOrder(boxName: string, quantity: number) {
  const box = await prisma.box.findFirst({
    where: { name: { contains: boxName, mode: "insensitive" } },
    include: { products: true },
  })

  if (box) {
    const availableProducts = box.products.filter((product) => product.quantity >= quantity)
    if (availableProducts.length === box.products.length) {
      const order = await prisma.order.create({
        data: {
          product: { connect: { id: box.products[0].id } },
          quantity: quantity,
        },
      })
      await Promise.all(
        box.products.map((product) =>
          prisma.product.update({
            where: { id: product.id },
            data: { quantity: { decrement: quantity } },
          }),
        ),
      )
      return `Tu pedido de ${quantity} ${box.name}(s) ha sido realizado con éxito. Tu número de pedido es ${order.id}.`
    } else {
      return `Lo siento, no tenemos suficiente stock para cumplir tu pedido de ${quantity} ${box.name}(s).`
    }
  } else {
    return `Lo siento, no pudimos encontrar una caja llamada "${boxName}".`
  }
}

async function handleChangeOrder(orderId: string, newQuantity: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      product: {
        include: {
          box: {
            include: {
              products: true,
            },
          },
        },
      },
    },
  })

  if (!order) {
    return "No se encontró el pedido."
  }

  const box = order.product.box

  const availableProducts = await prisma.product.findMany({
    where: { boxId: box.id, quantity: { gte: newQuantity - order.quantity } },
  })

  if (availableProducts.length === box.products.length) {
    await prisma.order.update({
      where: { id: orderId },
      data: { quantity: newQuantity },
    })

    await Promise.all(
      box.products.map((product) =>
        prisma.product.update({
          where: { id: product.id },
          data: { quantity: { decrement: newQuantity - order.quantity } },
        }),
      ),
    )

    return `Tu pedido ha sido actualizado a ${newQuantity} ${box.name}(s).`
  } else {
    return `Lo siento, no hay suficientes productos disponibles para cambiar tu pedido a ${newQuantity} ${box.name}(s).`
  }
}

async function handleCancelOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      product: {
        include: {
          box: {
            include: {
              products: true,
            },
          },
        },
      },
    },
  })

  if (!order) {
    return "No se encontró el pedido."
  }

  if (order.status === "cancelled") {
    return `El pedido con ID ${orderId} ya ha sido cancelado.`
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "cancelled" },
  })

  await Promise.all(
    order.product.box.products.map((product) =>
      prisma.product.update({
        where: { id: product.id },
        data: { quantity: { increment: order.quantity } },
      }),
    ),
  )

  return `Tu pedido de ${order.quantity} ${order.product.box.name}(s) ha sido cancelado.`
}


