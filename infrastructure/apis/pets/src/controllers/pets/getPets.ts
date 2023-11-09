import middy from "@middy/core";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import cors from "@middy/http-cors";

import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { docClient } from "../../clients/dynamodb";
import { getUserId } from "../../helpers/jwt";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "src/clients/s3";

type DynamoDBPet = {
  pet_id: { S: string };
  data: {
    M: {
      petName: { S: string };
      location: { S: string };
      chippedStatus: { S: string };
      shortDescription: { S: string };
      vaccinatedStatus: { S: string };
    };
  };
  numberOfPhotos: { N: string };
  photoNames: { L: { S: string }[] };
  id: { S: string };
  photos: string[];
};
const attachPresignedURLS = async (
  pets: DynamoDBPet[]
): Promise<DynamoDBPet[]> => {
  for (let i = 0; i < pets.length; i++) {
    const presigningPromises = [];
    for (let j = 0; j < parseInt(pets[i].numberOfPhotos.N); j++) {
      const command = new GetObjectCommand({
        Bucket: process.env.PETS_PHOTOS_BUCKET_NAME,
        Key: `${pets[i].pet_id.S}/${pets[i].photoNames.L[j].S}`,
      });
      presigningPromises.push(
        getSignedUrl(s3Client, command, { expiresIn: 3600 })
      );
    }
    const presignedURLS: string[] = [];
    await Promise.allSettled(presigningPromises).then((results) => {
      for (const result of results) {
        result.status === "fulfilled" ? presignedURLS.push(result.value) : null;
      }
    });
    pets[i].photos = presignedURLS;
  }
  return pets;
};
export const getMyPets = middy().handler(
  async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    console.log("Proceeding with my pet fetch");

    const command = new QueryCommand({
      TableName: process.env.USER_TABLE,
      KeyConditionExpression: "id = :id and begins_with(pet_id, :pet_id)",
      ExpressionAttributeValues: {
        ":pet_id": { S: "PET_ID#" },
      },
    });
    try {
      let data = await docClient.send(command);
      let response: DynamoDBPet[] = [];
      if (data?.Items) {
        response = await attachPresignedURLS(
          data.Items as unknown as DynamoDBPet[]
        );
        // console.log("RESPONSE", response);
      }
      return {
        statusCode: 200,
        body: response ? JSON.stringify(response) : ([] as any),
      };
    } catch (e) {
      console.log(`Database fetch failed with message ${e}`);
      throw Error("Database fetch failed");
    }
  }
);
