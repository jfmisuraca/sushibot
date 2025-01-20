import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Intenta una consulta simple
    const count = await prisma.product.count();
    
    return NextResponse.json({ 
      status: 'success',
      message: `Conexión exitosa. Hay ${count} productos en la base de datos.`
    });
  } catch (error) {
    console.error('Error de conexión:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Error al conectar con la base de datos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 