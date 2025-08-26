import express from "express";
import cors from "cors";
import { generate } from "./utilis.ts";
import { getPath } from "./utilis.ts";
import { simpleGit } from "simple-git";
import exportUpload from "./S3.ts";
import path from "path";
import enqueue, { listQueues } from "./sqs.ts";
import dequeue from "./sqsDequeTest.ts";
import { getDeploymentStatus, updateDeploymentStatus } from "./dynamoDB.ts";
import { WebSocketServer } from "ws";
import { createServer } from "http";
const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;

const server = createServer()
const wss = new WebSocketServer({server})
const clients = new Set()

function sendLog(data:any){
  clients.forEach((client:any)=>{
    if(client.readyState === client.OPEN){
      client.send(data);
    }
  })
}

wss.on("connection",(ws)=>{
  console.log("New connection");
  clients.add(ws);
  console.log("clients",clients);
  ws.send("Connected to the ws of upload server");
})

app.post("/upload", async (req, res) => {
  const repoUrl = await req.body.repoUrl;
  const id = generate();
  res.status(200).send({ id });

  setTimeout(()=>{
    sendLog(JSON.stringify({type: "log", data: {message: `Your Repo URL is ${repoUrl} and your unique Session id is ${id}  `, timestamp: new Date().toLocaleString().slice(11, 23)}}));
  },1000)

  try {
  const git = simpleGit();
  await git.clone(repoUrl, path.join(__dirname, `./output/${id}`));

  const allFilePaths = getPath(path.join(__dirname, `./output/${id}`));

  for (const filePath of allFilePaths) {
    await exportUpload(
      `${filePath.substring(filePath.indexOf("output"))}`,
      filePath
    );
  }
  setTimeout(()=>{
    sendLog(JSON.stringify({type: "log", data: {message: `Uploaded the files to S3 `, timestamp: new Date().toLocaleString().slice(11, 23)}}));
  },1000)

  enqueue(`output/${id}`);
  setTimeout(()=>{
    sendLog(JSON.stringify({type: "log", data: {message: `Enqueued the Id to SQS  `, timestamp: new Date().toLocaleString().slice(11, 23)}}));
  },2000)

    await updateDeploymentStatus(id, "uploaded");

  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
    return;
  }
});



app.get("/dequeue", async (req, res) => {
  const result = await dequeue();
  res.status(200).send({ result });
});

app.get("/status/:projectId", async (req, res) => {
  const { projectId } = req.params;
  try {
    const status = await getDeploymentStatus(projectId);
    if (!status) {
      res.status(404).send({ error: "Deployment not found" });
      return;
    }
    res
      .status(200)
      .send({ projectId, status: status.status, updatedAt: status.updatedAt });
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
    return;
  }
});

app.listen(port, () => {
  console.log(`App listening to port ${port}`);
});

server.listen(3001,()=>{
  console.log("WebSocket Server is running on port 3001");
})