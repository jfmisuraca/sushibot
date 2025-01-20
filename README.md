# SushiBot - Chatbot para Pedidos de Sushi

Un chatbot inteligente construido con Next.js, MongoDB y OpenAI para gestionar pedidos de sushi.

## 🚀 Características

- Interfaz de chat intuitiva
- Gestión de pedidos de sushi
- Respuestas a preguntas frecuentes
- Tema claro/oscuro
- Manejo de errores robusto
- Tests automatizados

## 🛠️ Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/jfmisuraca/sushibot.git
cd sushibot
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

4. Completa las variables en el archivo `.env`:
```bash
MONGODB_URI=tu_uri_de_mongodb
OPENAI_API_KEY=tu_api_key_de_openai
```

5. Inicia el servidor de desarrollo:
```bash
npm run dev
```


## 📝 Uso

1. Abre tu navegador y visita `http://localhost:3000`
2. Interactúa con el chatbot para:
   - Realizar pedidos de sushi
   - Consultar el menú
   - Hacer preguntas sobre los productos
   - Ver el estado de tu pedido

## 🧪 Tests

Para ejecutar los tests:
```bash
npm run test
```

## 🤖 Ejemplos de mensajes

El bot entiende:
- "Mostrame el menú" / "¿Qué boxes tienen?"
- "¿Están abiertos?" / "¿Cuál es el horario?"
- "Quiero pedir una box chica y una mediana"
- "¿Dónde están ubicados?"
- "¿Cuál es el teléfono?"

## 🛣️ Endpoints

POST /api/chat
- Body: { message: string }
- Response: { response: string }

## 🚨 Manejo de Errores

- Validación de pedidos
- Boxes no existentes
- Cantidades inválidas
- Errores de conexión a DB
- Errores de OpenAI API

## 💾 Base de Datos

### Datos de ejemplo
El proyecto incluye datos preconfigurados para:
- Boxes de sushi con precios y descripciones
- Información del local (horarios, ubicación)
- Respuestas predefinidas para preguntas frecuentes

### Carga inicial de datos
Para cargar los datos iniciales:

```bash
npm run seed
```

Los datos se cargarán automáticamente en MongoDB usando Prisma.
