const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid'); // npm install uuid

const wss = new WebSocket.Server({ port: 3000 });
const clients = new Map();

console.log("✅ Сервер запущен на ws://localhost:3000");

wss.on('connection', function (ws) {
  const clientId = uuidv4();
  clients.set(ws, { id: clientId });

  console.log(`👤 Новый клиент: ${clientId}`);
  broadcastSystemMessage(`👋 Пользователь подключился`);

  ws.on('message', function (data) {
    try {
      const message = JSON.parse(data);
      // Простейшая валидация
      if (typeof message.name !== "string" || typeof message.message !== "string") return;

      const fullMessage = JSON.stringify({
        type: "chat",
        name: message.name,
        message: message.message,
        time: new Date().toISOString()
      });

      broadcast(fullMessage);
    } catch (err) {
      console.error("❌ Ошибка обработки сообщения:", err.message);
    }
  });

  ws.on('close', function () {
    clients.delete(ws);
    console.log(`❌ Клиент отключен: ${clientId}`);
    broadcastSystemMessage(`👋 Пользователь отключился`);
  });

  ws.on('error', function (err) {
    console.error(`⚠️ Ошибка на клиенте ${clientId}:`, err.message);
  });
});

// Сердцебиение (ping/pong)
setInterval(() => {
  for (let client of clients.keys()) {
    if (client.readyState === WebSocket.OPEN) {
      client.ping();
    }
  }
}, 30000);

// Рассылка обычного сообщения
function broadcast(message) {
  for (let client of clients.keys()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Системное сообщение (например, подключение/отключение)
function broadcastSystemMessage(msg) {
  const message = JSON.stringify({
    type: "system",
    message: msg,
    time: new Date().toISOString()
  });
  broadcast(message);
}
