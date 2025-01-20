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
git clone https://github.com/tu-usuario/sushibot.git
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

5. Ejecuta la migración de la base de datos:
```bash
npm run seed
```

6. Inicia el servidor de desarrollo:
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