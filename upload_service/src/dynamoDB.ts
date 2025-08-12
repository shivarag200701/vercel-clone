import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function updateDeploymentStatus(
  projectId: string,
  status: string
) {
  const command = new PutItemCommand({
    TableName: process.env.DYNAMODB_TABLE_NAME || "",
    Item: marshall({
      projectId,
      status,
      updatedAt: new Date().toISOString(),
    }),
  });
  await dynamoClient.send(command);
}

export async function getDeploymentStatus(projectId: string) {
  const command = new GetItemCommand({
    TableName: process.env.DYNAMODB_TABLE_NAME || "",
    Key: marshall({ projectId }),
  });
  const response = await dynamoClient.send(command);
  return response.Item ? unmarshall(response.Item) : null;
}
