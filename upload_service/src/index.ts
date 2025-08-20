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
const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;

const deploymentLogs: { [key: string]: {message:string, timestamp:string}[] } = {};
const activeConnections: { [key: string]: any[] } = {};
const addLog = (id: string, log: string) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    message: log,
    timestamp: timestamp
  };
  
  if(!deploymentLogs[id]){
    deploymentLogs[id] = [];
  }
  deploymentLogs[id].push(logEntry);
  // console.log(deploymentLogs);
  console.log("activeConnections",activeConnections[id]);

    if(activeConnections[id]){
      activeConnections[id].forEach((res) => {
        res.write(`data: ${JSON.stringify({type: "log", data: logEntry})}\n\n`);
      });
    }
  };

app.get("/logs/stream/:id", async (req, res) => {
  const {id} = req.params;
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
});

if(!activeConnections[id]){
  activeConnections[id] = [];
}
activeConnections[id].push(res);

  const existingLogs = deploymentLogs[id]||[];
  existingLogs.forEach((log) => {
    res.write(`data: ${JSON.stringify({type: "log", data: log})}\n\n`);
  });


  req.on("close", () => {
    activeConnections[id] = activeConnections[id]?.filter((conn) => conn !== res) || [];
  });
});

app.post("/upload", async (req, res) => {
  const repoUrl = await req.body.repoUrl;
  const id = generate();
  res.status(200).send({ id });

  addLog(id,`Your Repo URL is ${repoUrl} and your unique Session id is ${id}`);
  try {
  const git = simpleGit();
  await git.clone(repoUrl, path.join(__dirname, `./output/${id}`));
  // addLog(id,`Cloned the repo ${repoUrl} to ${path.join(__dirname, `./output/${id}`)}`);
  const allFilePaths = getPath(path.join(__dirname, `./output/${id}`));
  // console.log("allFilePaths", allFilePaths);

  for (const filePath of allFilePaths) {
    await exportUpload(
      `${filePath.substring(filePath.indexOf("output"))}`,
      filePath
    );
  }
  addLog(id,`Uploaded the files to S3`);

  enqueue(`output/${id}`);
  addLog(id,`Enqueued the Id to SQS`);

    await updateDeploymentStatus(id, "uploaded");
    addLog(id,`Deployment status updated to uploaded`);

  } catch (error) {
    addLog(id, `Error: ${error instanceof Error ? error.message : "Unknown error"}`);
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
