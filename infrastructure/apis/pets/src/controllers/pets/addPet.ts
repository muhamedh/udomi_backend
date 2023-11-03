import middy from "@middy/core";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { v4 as uuidv4 } from "uuid";
import { docClient } from "../../clients/dynamodb";
import { getUserId } from "../../helpers/jwt";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

export const addPet = middy().handler(
  async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    const userId = getUserId(event?.headers?.Authorization);
    console.log("Proceeding with pet insert");
    const command = new PutCommand({
      TableName: process.env.USER_TABLE,
      Item: {
        id: userId,
        pet_id: `PET_ID#${uuidv4()}`,
        data: event?.body ? JSON.parse(event?.body) : {},
      },
    });
    try {
      await docClient.send(command);
      return {
        statusCode: 200,
        body: JSON.stringify(""),
      };
    } catch (e) {
      console.log(`Database insert failed with message ${e}`);
      throw Error("Database insert failed!");
    }
  }
);
