import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any, context: any) => {
  //console.log("Received event:", JSON.stringify(event, null, 2));
  //console.log("Proceeding with database insert");
  const command = new PutCommand({
    TableName: process.env.USER_TABLE,
    Item: {
      id: event?.request?.userAttributes?.sub,
      pet_id: "PET_ID#",
      email: event?.request?.userAttributes?.email,
    },
  });
  
  try {
    const response = await docClient.send(command);
  } catch (e) {
    console.log(`Database insert failed with message ${e}`);
  }
  return context.done(null, event);
};
