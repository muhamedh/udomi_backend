import middy from "@middy/core";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { docClient } from "../../clients/dynamodb";
import { getUserId } from "../../helpers/jwt";

export const getMyPets = middy().handler(
  async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    console.log("Proceeding with my pet fetch");

    const userId = getUserId(event?.headers?.Authorization);
    const command = new QueryCommand({
      TableName: process.env.USER_TABLE,
      KeyConditionExpression: "id = :id and begins_with(pet_id, :pet_id)",
      ExpressionAttributeValues: {
        ":id": { S: userId },
        ":pet_id": { S: "PET_ID#" },
      },
    });
    try {
      let data = await docClient.send(command);
      return {
        statusCode: 200,
        body: data?.Items ? JSON.stringify(data.Items) : ([] as any),
      };
    } catch (e) {
      console.log(`Database fetch failed with message ${e}`);
      throw Error("Database fetch failed");
    }
  }
);
