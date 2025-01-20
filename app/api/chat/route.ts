import openai from '@/lib/openai';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StoreHours {
  day: string;
  open: string;
  close: string;
}

export async function POST(req: Request) {
  const { message } = await req.json();

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "Sos un asistente de ayuda para un restaurante de sushi. Podés consultar productos (mostrándolos en forma de lista, no uno detrás del otro), verificar su disponibilidad, realizar pedidos, cambiar o cancelar pedidos, y brindar información sobre los horarios del local. Tus clientes son argentinos, tenés que hablarles con voseo. Sólo podés usar información de la base de datos." 
        },
        { role: "user", content: message }
      ],
      tools: [
        {
          type: "function",
          function: {
          name: "query_products",
          description: "Query available products",
          parameters: {
            type: "object",
            properties: {},
          },
          }
        },
        {
          type: "function",
          function: {
          name: "get_info",
            description: "Get information about store hours and current open/closed status",
          parameters: {
            type: "object",
              properties: {},
            },
          }
        }
      ],
    });

    const assistantMessage = chatCompletion.choices[0].message;

    if (assistantMessage.tool_calls) {
      const functionName = assistantMessage.tool_calls[0].function.name;

      switch (functionName) {
        case 'query_products':
          return await handleQueryProducts();
        case 'get_info':
          return await handleGetStoreInfo();
        default:
          return NextResponse.json({ 
            response: "Lo siento, no pude procesar esa solicitud." 
          });
      }
    }

    return NextResponse.json({ 
      response: assistantMessage.content || "Lo siento, no pude procesar esa solicitud." 
    });

  } catch (error) {
    console.error('Error detallado:', error);
    return NextResponse.json({ 
      response: "Lo siento, hubo un error al procesar tu solicitud.",
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

async function handleQueryProducts() {
  try {
    const products = await prisma.product.findMany({
      select: {
        name: true,
        price: true,
        quantity: true,
        description: true
      }
    });
    
    if (!products || products.length === 0) {
      return NextResponse.json({
        response: "Lo siento, no hay productos disponibles en este momento."
      });
    }

    const productList = products.map(p => 
      `- ${p.name}: $${p.price} (${p.quantity} disponibles)`
    ).join('\n');

    return NextResponse.json({
      response: `Estos son nuestros productos disponibles:\n${productList}`
    });
  } catch (error) {
    console.error('Error al consultar productos:', error);
    return NextResponse.json({ 
      response: "Lo siento, hubo un error al consultar los productos.",
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

async function handleGetStoreInfo() {
  try {
    const storeInfo = await prisma.Store.findFirst({
      select: {
        hours: true,
        isOpen: true
      }
    });

    if (!storeInfo) {
      return NextResponse.json({
        response: "Lo siento, no se pudo obtener información del local."
      });
    }

    const now = new Date();
    const currentDay = now.toLocaleDateString('es-AR', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

    const todayHours = storeInfo.hours.find((h: StoreHours) => {
      const days = h.day.toLowerCase();
      return days.includes(currentDay) || 
             (days.includes('lunes a viernes') && ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'].includes(currentDay)) ||
             (days.includes('sábados y domingos') && ['sábado', 'domingo'].includes(currentDay));
    });

    if (!todayHours) {
      return NextResponse.json({
        response: "Lo siento, no tengo información sobre los horarios de hoy."
      });
    }

    const isCurrentlyOpen = currentTime >= todayHours.open && currentTime <= todayHours.close;

    if (isCurrentlyOpen) {
      return NextResponse.json({
        response: `¡Sí! Estamos abiertos ahora. Cerramos a las ${todayHours.close}hs.`
      });
    } else {
      if (currentTime < todayHours.open) {
        return NextResponse.json({
          response: `En este momento estamos cerrados. Abrimos hoy a las ${todayHours.open}hs.`
        });
      } else {
        const nextDay = storeInfo.hours[0];
        return NextResponse.json({
          response: `En este momento estamos cerrados. Abrimos mañana a las ${nextDay.open}hs.`
        });
      }
    }
  } catch (error) {
    console.error('Error al obtener información del local:', error);
    return NextResponse.json({ 
      response: "Lo siento, hubo un error al obtener información del local.",
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}