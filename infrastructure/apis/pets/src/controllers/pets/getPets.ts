import middy from "@middy/core";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { docClient } from "../../clients/dynamodb";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../../clients/s3";
import { unmarshall } from "@aws-sdk/util-dynamodb";

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
  location: { S: string };
  numberOfPhotos: { N: string };
  photoNames: { L: { S: string }[] };
  id: { S: string };
  photos: string[];
};

const attachPresignedURLS = async (pet: any) => {
  const presigningPromises = [];
  for (let i = 0; i < pet.numberOfPhotos; i++) {
    const command = new GetObjectCommand({
      Bucket: process.env.PETS_PHOTOS_BUCKET_NAME,
      Key: `${pet.pet_id}/${pet.photoNames[i]}`,
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
  pet.photos = presignedURLS;
  return pet;
};
export const getPets = middy().handler(
  async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    console.log("Proceeding with my pet fetch");
    console.log("EVENT", event);
    const params = event.queryStringParameters;
    let limit = parseInt(params?.limit ? params.limit : "20");
    const key_id = params?.key_id;
    const key_pet_id = params?.key_pet_id;
    let key = undefined;
    // construct key
    if (key_id && key_pet_id) {
      key = {
        id: { S: key_id },
        pet_id: { S: key_pet_id },
      };
    }
    if (limit > 20 || !limit) {
      limit = 20;
    }
    const scanCommand = new ScanCommand({
      TableName: process.env.USER_TABLE,
      FilterExpression: "attribute_exists(#location)",
      ExpressionAttributeNames: {
        "#location": "location",
      },
      Limit: limit,
      ExclusiveStartKey: key ? key : undefined,
    });

    try {
      let data = await docClient.send(scanCommand);
      let sanitizedData = {
        pets: [] as any,
        key: data.LastEvaluatedKey ? data.LastEvaluatedKey : undefined,
      };
      if (data?.Items) {
        for (let i = 0; i < data.Items.length; i++) {
          sanitizedData.pets.push(unmarshall(data.Items[i]));
        }
        for (let i = 0; i < data.Items.length; i++) {
          sanitizedData.pets[i] = await attachPresignedURLS(
            sanitizedData.pets[i]
          );
        }
      }
      return {
        statusCode: 200,
        body: sanitizedData ? JSON.stringify(sanitizedData) : ([] as any),
      };
    } catch (e) {
      console.log(`Database scan failed with message ${e}`);
      throw Error("Database scan failed");
    }
  }
);
