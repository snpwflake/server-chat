const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const port = 9000;

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let users = [];
io.on("connection", (socket) => {
  console.log(socket.handshake.auth.email, "user connected");
  users.push({
    role: "user",
    auth: false,
    id: socket.id,
    online: true,
    ...socket.handshake.auth,
  });
  console.log(users);
  socket.join(socket.handshake.auth.email);

  socket.on("user-message", (msg) => {
    // Отправляем сообщение админам
    console.log(msg);
    io.emit("admin-chat", {
      from: socket.id,
      message: msg,
    });
  });

  socket.on("admin-chat", (msg) => {
    console.log(msg);
    io.to(msg.to).emit("user-message", msg.message);
  });

  io.emit("users", users);

  socket.on("disconnect", () => {
    console.log(socket.handshake.auth.email || "unknown", "user disconnected");
    users = users.map((user) => {
      if (user.id === socket.id) {
        user.online = false;
      }
      return user;
    });
    io.emit("users", users);
    users = users.filter((user) => user.id !== socket.id);
  });
});

server.listen(port, () => {
  console.log(`Запущен на порту ${port}`);
});
