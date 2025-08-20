import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { execSyncCommandWithLogs, getPath } from "./utils";
import { updateDeploymentStatus } from "./dynamoDB";
import { addLog } from "./index";
dotenv.config();


const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const queueUrl = process.env.AWS_SQS_URL;
const bucketName = process.env.AWS_BUCKET_NAME;

async function transformToByteArray(stream: any): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];

  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: Uint8Array) => {
      chunks.push(chunk);
    });

    stream.on("end", () => {
      const result = Buffer.concat(chunks);
      resolve(result);
    });

    stream.on("error", reject);
  });
}

function ensureDirectoryExists(filePath: string) {
  const finalPath = path.join(__dirname, filePath);
  const dirName = path.dirname(finalPath);
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }
  return finalPath;
}

async function downloadAllFilesFromS3(prefix: string) {
  const S3command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
  });
  const listResult = await s3Client.send(S3command);

  // const downloadFiles: string[] = [];

  for (const fileObj of listResult?.Contents || []) {
    if (fileObj.Key) {
      try {
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: fileObj.Key,
        });

        const s3Result = await s3Client.send(getCommand);
        const fileContent = await transformToByteArray(s3Result.Body);
        const filePath = fileObj.Key;
        const finalPath = ensureDirectoryExists(filePath);
        fs.writeFileSync(finalPath, fileContent);
        // downloadFiles.push(filePath);
      } catch (error) {
        addLog(prefix,`Error downloading file ${fileObj.Key}: ${error}`);
      }
    }
  }
}

async function build(targetDir: string,projectId:string) {
  addLog(projectId,`Building project in ${targetDir}`);

  const packageJsonPath = path.join(targetDir, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    addLog(projectId,"package.json not found");
    return false;
  }
  try{
  console.log("npm install");
  const installResult = await execSyncCommandWithLogs("npm install", targetDir, (log)=>addLog(projectId,log));
  if (!installResult) {
    console.error("npm install failed");
    return false;
  }

  const buildResult = await execSyncCommandWithLogs("npm run build", targetDir, (log)=>addLog(projectId,log));
  if (!buildResult) {
    console.error("npm run build failed");
    return false;
  }
    addLog(projectId, "build completed successfully");
    return true;
  } catch (error) {
    addLog(projectId, `Build process failed with error: ${error}`);
    console.log("build failed",error);
    return false;
  }
}

async function exportUpload(prefix: string) {
  const id = prefix.split("/")[1];
  const filePath = path.join(__dirname, `./${prefix}/dist`);
  const allFilePaths = getPath(filePath);
  for (const filePath of allFilePaths) {
    const fileContent = fs.readFileSync(filePath);
    console.log("prefix", prefix);
    console.log("filePath", filePath);
    const afterDist = filePath.substring(filePath.indexOf("dist") + 4);
    const key = `dist/${id}${afterDist}`;
    console.log("key", key);

    const s3Command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
    });
    await s3Client.send(s3Command);
  }
}

async function dequeue() {
  const SQScommand = new ReceiveMessageCommand({
    QueueUrl: queueUrl,
    AttributeNames: ["All"], // includes system attributes like SentTimestamp
    MessageAttributeNames: ["All"], // includes custom attributes
  });

  const result = await sqsClient.send(SQScommand);

  const prefix = result.Messages?.[0]?.Body;
  console.log("prefix", prefix);

  if (prefix) {
    await downloadAllFilesFromS3(prefix);
    addLog(prefix.split("/")[1],"downloaded all files from s3");
    const targetDir = path.join(__dirname, prefix || "");
    await build(targetDir,prefix.split("/")[1]);
    await exportUpload(prefix);
    await updateDeploymentStatus(prefix.split("/")[1], "deployed");
  }

  if (result.Messages?.[0]?.ReceiptHandle) {
    const deleteCommand = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: result.Messages?.[0]?.ReceiptHandle,
    });

    await sqsClient.send(deleteCommand);
    console.log("Message deleted");
  } else {
    console.log("No message in queue");
  }
}

export default dequeue;
