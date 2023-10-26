import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { APIGatewayProxyEvent } from "aws-lambda";
import jwt from "jsonwebtoken";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const getUserId = (token: any): any => {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (decoded) {
      return decoded.payload.sub;
    } else {
      console.log("Not decoded");
      throw new Error("Invalid token");
    }
  } catch (error) {
    console.log(error);
    throw new Error("Invalid token");
  }
};
const addPet = async (userId: any, pet: any) => {
  console.log("Proceeding with pet insert");
  const command = new PutCommand({
    TableName: process.env.USER_TABLE,
    Item: {
      id: userId,
      pet_id: `PET_ID#${uuidv4()}`,
      data: pet ? JSON.stringify(pet) : {},
    },
  });
  try {
    await docClient.send(command);
  } catch (e) {
    console.log(`Database insert failed with message ${e}`);
    throw Error("Database insert failed");
  }
};
export const handler = async (event: APIGatewayProxyEvent, context: any) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  try {
    if (
      event?.httpMethod === "POST" &&
      event?.resource === "/pets" &&
      event?.headers?.Authorization
    ) {
      const userId = getUserId(event?.headers?.Authorization);
      await addPet(userId, event?.body);
    } else {
      return {
        isBase64Encoded: false,
        statusCode: 404,
        body: JSON.stringify({
          message: "Invalidna metoda.",
        }),
      };
    }

    return {
      isBase64Encoded: false,
      statusCode: 200,
      body: JSON.stringify({
        message: "Ljubimac uspješno dodan.",
      }),
    };
  } catch (error) {
    return {
      isBase64Encoded: false,
      statusCode: 500,
      body: JSON.stringify({
        message: "Greška na serveru.",
      }),
    };
  }
};
