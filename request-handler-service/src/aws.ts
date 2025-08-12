import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import transformToByteArray from "./utils";
dotenv.config();
const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});
const bucket = process.env.AWS_BUCKET_NAME as string;
export const getObject = async (id: string, file: string) => {
  const key = `dist/${id}${file}`;
  console.log(key);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  const response = await s3Client.send(command);
  const body = await transformToByteArray(response.Body);
  return body;
};
