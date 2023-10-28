import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
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
const getMyPets = async (userId: any) => {
  console.log("Proceeding with my pet fetch");
  const command = new QueryCommand({
    TableName: process.env.USER_TABLE,
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": userId,
    },
  });
  try {
    const data = await client.send(command);
    return data.Items;
  } catch (e) {
    console.log(`Database fetch failed with message ${e}`);
    throw Error("Database fetch failed");
  }
}
const editUser = async (userId: any, user: any) => {
  console.log("Proceeding with user insert");
  const command = new PutCommand({
    TableName: process.env.USER_TABLE,
    Item: {
      id: userId,
      pet_id: "PET_ID#",
      data: user ? JSON.stringify(user) : {},
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
  let userId = null;
  if (event?.headers?.Authorization) {
    userId = getUserId(event?.headers?.Authorization);
  }
  try {
    if (event?.httpMethod === "POST" && event?.resource === "/pets") {
      await addPet(userId, event?.body);
    } else if(event?.httpMethod === "GET" && event?.resource === "/pets/mine") {
      const myPets = await getMyPets(userId);
      return {
        isBase64Encoded: false,
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify(myPets)
      };
    }else if (event?.httpMethod === "POST" && event?.resource === "/users") {
      await editUser(userId, event?.body);
    } else {
      return {
        isBase64Encoded: false,
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          message: "Invalidna metoda.",
        }),
      };
    }
    return {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
    };
  } catch (error) {
    return {
      isBase64Encoded: false,
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Greška na serveru.",
      }),
    };
  }
};
