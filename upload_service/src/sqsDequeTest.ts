import { SQSClient, ReceiveMessageCommand } from "@aws-sdk/client-sqs";
import dotenv from "dotenv";
dotenv.config();

const sqs = new SQSClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  region: process.env.AWS_REGION || "",
});

const dequeue = async () => {
  const command = new ReceiveMessageCommand({
    QueueUrl: process.env.AWS_SQS_URL || "",
  });
  const result = await sqs.send(command);
  console.log(result);
};

export default dequeue;
