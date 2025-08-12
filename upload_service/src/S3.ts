import {
  S3Client,
  PutObjectCommand,
  ListBucketsCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "fs";
import log from "simple-git/dist/src/lib/tasks/log";
dotenv.config();

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  region: process.env.AWS_REGION || "",
});

const exportUpload = async (fileName: string, localFilePath: string) => {
  console.log("fileName", fileName);
  const fileContent = fs.readFileSync(localFilePath);
  const result = await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME || "",
      Key: fileName,
      Body: fileContent,
    })
  );
};

export default exportUpload;
