import middy from "@middy/core";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { docClient } from "../../clients/dynamodb";
import { getUserId } from "../../helpers/jwt";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import cors from "@middy/http-cors";

export const editUser = middy().handler(
  async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    const userId = getUserId(event?.headers?.Authorization);
    console.log("Proceeding with user edit");
    const command = new UpdateCommand({
      TableName: process.env.USER_TABLE,
      Key: {
        id: userId,
        pet_id: "USER_TYPE#REGULAR_USER",
      },
      UpdateExpression: "SET #data = :data",
      ExpressionAttributeNames: {
        "#data": "data",
      },
      ExpressionAttributeValues: {
        ":data": event?.body ? JSON.parse(event?.body) : {},
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
      throw Error("Database insert failed");
    }
  }
);
