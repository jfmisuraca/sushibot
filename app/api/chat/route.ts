import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractKeywords, findBestMatch } from '@/utils/nlp'
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json()
  const keywords = extractKeywords(messages)

  const systemMessage = {
    role: 'system',
    content: `Eres un aistente de IA para un restaurant de sushi. Tus tareas son:
    1. inferir la intención del usuario de su mensaje, incluso si contiene errores o es expresada de forma inusual.
    2. Responder de manera apropiada en función de la intención inferida.
    3. Si la intención es poco clara, preguntar por clarificación.
    4. Ser amable y ayudar, proporcionando información sobre el sushi, el menú o el restaurante según sea necesario.`
  };


  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: [systemMessage, ...messages],
  });

  return result.toDataStreamResponse();
}
try {
  if (keywords.includes('hola')) {
    return NextResponse.json({ response: "Podés hacerme preguntas sobre productos disponibles, hacer un pedido, cancelarlo o modificarlo. También sobre nuestros horarios y direcciones." })
  }

  if (keywords.includes('disponibles') && keywords.includes('productos')) {
    const products = await prisma.product.findMany()
    const productList = products.map(p => `${p.name}: $${p.price.toFixed(2)} - ${p.description} (${p.vegan ? 'Vegano' : 'No vegano'})`).join('\n')
    return NextResponse.json({ response: `Aquí están nuestros productos disponibles:\n${productList}` })
  }

  if (keywords.includes('hacer') && keywords.includes('pedido') || keywords.includes('encargar')) {
    const productName = findBestMatch(message, (await prisma.product.findMany()).map(p => p.name))
    const quantityMatch = message.match(/quantity (\d+)/)
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1

    if (productName) {
      const product = await prisma.product.findFirst({
        where: { name: { contains: productName, mode: 'insensitive' } }
      })

      if (product) {
        if (quantity > product.quantity) {
          return NextResponse.json({ response: `Actualmente no tenemos ${product.name}.` })
        }

        const order = await prisma.order.create({
          data: {
            productId: product.id,
            quantity
          }
        })
        await prisma.product.update({
          where: { id: product.id },
          data: { quantity: product.quantity - quantity }
        })
        return NextResponse.json({ response: `Tu pedido  de ${quantity} ${product.name} fue realizado con éxito con el número de orden ${order.id} Muchas gracias!` })
      }
    }
    return NextResponse.json({ response: "I'm sorry, I couldn't find that product. Please check our available products and try again." })
  }

  if (keywords.includes('cancelar') && keywords.includes('pedido')) {
    return NextResponse.json({ response: "Para cancelar un pedido, por favor proporciona el ID del pedido. Por ejemplo, 'Cancelar pedido ABC123'." })
  }

  if (keywords.includes('cambiar') && keywords.includes('pedido')) {
    return NextResponse.json({ response: "Para modificar un pedido, por favor proporciona el ID del pedido y la nueva cantidad. Por ejemplo, 'Cambiar pedido ABC123 cantidad 3'." })
  }

  const orderIdMatch = message.match(/order (\w+)/)
  if (orderIdMatch) {
    const orderId = orderIdMatch[1]
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true }
    })

    if (!order) {
      return NextResponse.json({ response: `Lo sentimos, no pude encontrar un pedido con el ID ${orderId}.` })
    }

    if (keywords.includes('cancel')) {
      if (order.status === 'cancelled') {
        return NextResponse.json({ response: `El pedido con el ID ${orderId} ya fue cancelado.` })
      }
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'cancelled' }
      })
      await prisma.product.update({
        where: { id: order.productId },
        data: { quantity: { increment: order.quantity } }
      })
      return NextResponse.json({ response: `Tu pedido de ${order.quantity} ${order.product.name} fue cancelado.` })
    } else if (keywords.includes('modificar')) {
      const newQuantityMatch = message.match(/quantity (\d+)/)
      if (newQuantityMatch) {
        const newQuantity = parseInt(newQuantityMatch[1])
        if (newQuantity > order.product.quantity + order.quantity) {
          return NextResponse.json({ response: `Lo sentimos, no tenemos suficiente stock. La cantidad máxima disponible es ${order.product.quantity + order.quantity}.` })
        }
        await prisma.order.update({
          where: { id: orderId },
          data: { quantity: newQuantity }
        })
        await prisma.product.update({
          where: { id: order.productId },
          data: { quantity: order.product.quantity + order.quantity - newQuantity }
        })
        return NextResponse.json({ response: `Tu pedido ha sido actualizado a ${newQuantity} ${order.product.name}.` })
      }
    }
  }

  // Default keyword matching
  const chatResponse = await prisma.chatResponse.findFirst({
    where: {
      keyword: {
        in: keywords
      }
    },
  })

  if (chatResponse) {
    return NextResponse.json({ response: chatResponse.response })
  } else {
    return NextResponse.json({ response: "Lo siento, no entiendo esa pregunta. Puedes preguntarme sobre las preguntas disponibles si necesitas ayuda." })
  }
} catch (error) {
  console.error('Error processing request:', error)
  return NextResponse.json({ response: "Lo sentimos, hubo un error al procesar tu solicitud." }, { status: 500 })
}
}

