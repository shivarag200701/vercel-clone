import dequeue from "./aws";
import express from "express";

const app = express();


const deploymnetLogs:{[key:string]:{message:string,timestamp:string}[]} = {};
const activeConnections:{[key:string]:any[]} = {};

export const addLog = (id:string,log:string)=>{
  const timestamp = new Date().toISOString();
  const logEntry = {message:log,timestamp};

  if(!deploymnetLogs[id]){
    deploymnetLogs[id] = [];
  }

  deploymnetLogs[id].push(logEntry);

  if(activeConnections[id]){
    activeConnections[id].forEach((connection)=>{
      connection.write(`data: ${JSON.stringify({type:"log",data:logEntry})}\n\n`);
    })
  }
}



app.get("/logs/stream/:id", async(req,res)=>{
  const {id} = req.params;

  res.writeHead(200,{
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  })

  if(!activeConnections[id]){
    activeConnections[id] = [];
  }

  activeConnections[id].push(res);

  const existingLogs = deploymnetLogs[id] || [];
  existingLogs.forEach((log)=>{
    res.write(`data: ${JSON.stringify({type:"log",data:log})}\n\n`);
  })

  res.on("close",()=>{
    activeConnections[id] = activeConnections[id].filter((connection)=>connection !== res);
  })



})

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

app.listen(3001,()=>{
  console.log("Server is running on port 3001");
})


runService();
