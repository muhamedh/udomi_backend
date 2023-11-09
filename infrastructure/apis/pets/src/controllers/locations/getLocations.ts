import middy from "@middy/core";
import { APIGatewayProxyResult } from "aws-lambda";
import cors from "@middy/http-cors";
import { locations } from "src/helpers/locations";

export const getLocations = middy().handler(
  async (): Promise<APIGatewayProxyResult> => {
    console.log("Proceeding with location fetch");
    return {
      statusCode: 200,
      body: locations ? JSON.stringify(locations) : ([] as any),
    };
  }
);
