import middy from "@middy/core";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { QueryCommand, QueryCommandOutput } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
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
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": { S: userId },
      },
    });
    try {
      let data = await docClient.send(command);
      return {
        statusCode: 200,
        body: data.Items ? JSON.stringify(data.Items) : ([] as any),
      };
    } catch (e) {
      console.log(`Database fetch failed with message ${e}`);
      throw Error("Database fetch failed");
    }
  }
);
