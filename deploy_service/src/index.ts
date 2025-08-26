import dequeue from "./aws";
import { WebSocketServer } from "ws";
import http from "http";

const server = http.createServer()

const wss = new WebSocketServer({server})
const clients = new Set<WebSocket>();
wss.on("connection",(ws:WebSocket)=>{
  console.log("Client connected");
  clients.add(ws);
  ws.send("Connected to ws of deployer server");
  })

  export function sendLog(data:any){
    clients.forEach((client:any)=>{
      if(client.readyState === client.OPEN){
        client.send(data);
      }
    })
  }

async function runService() {
  while (true) {
    try {
      await dequeue();
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

server.listen(3002,()=>{
  console.log("Server is running on port 3002");
})

runService();
