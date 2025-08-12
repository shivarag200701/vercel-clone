import {
  SQSClient,
  ListQueuesCommand,
  SendMessageCommand,
} from "@aws-sdk/client-sqs";
import dotenv from "dotenv";
dotenv.config();

const queueUrl = process.env.AWS_SQS_URL || "";
const sqs = new SQSClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  region: process.env.AWS_REGION || "",
});
const listQueues = async () => {
  const command = new ListQueuesCommand({});
  const result = await sqs.send(command);
  console.log(result);
};

const enqueue = async (message: string) => {
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: message,
    MessageGroupId: "task-group-1", // Required
    MessageDeduplicationId: new Date().getTime().toString(),
    MessageAttributes: {
      status: {
        DataType: "String",
        StringValue: "Uploaded",
      },
    },
  });

  const result = await sqs.send(command);
  console.log(result);
};

export default enqueue;
export { listQueues };
