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
console.log(__dirname);
listQueues();
app.post("/upload", async (req, res) => {
  const repoUrl = await req.body.repoUrl;
  const id = generate();
  console.log(
    `Your Repo URL is ${repoUrl} and your unique Session id is ${id}`
  );
  const git = simpleGit();
  await git.clone(repoUrl, path.join(__dirname, `./output/${id}`));
  const allFilePaths = getPath(path.join(__dirname, `./output/${id}`));
  // console.log("allFilePaths", allFilePaths);

  for (const filePath of allFilePaths) {
    await exportUpload(
      `${filePath.substring(filePath.indexOf("output"))}`,
      filePath
    );
  }

  enqueue(`output/${id}`);
  res.status(200).send({ id });

  await updateDeploymentStatus(id, "uploaded");
  console.log("Deployment status updated to uploaded");
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
