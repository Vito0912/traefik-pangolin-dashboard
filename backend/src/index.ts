import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import logsRouter from "./routes/logs";
import { logWatcher } from "./services/logWatcher";
import { socketService } from "./services/socketService";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

socketService.setIO(io);

app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/logs", logsRouter);

const port = Number(process.env.PORT) || 3000;

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  logWatcher.start();
});