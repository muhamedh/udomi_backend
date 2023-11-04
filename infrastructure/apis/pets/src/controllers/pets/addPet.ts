import middy from "@middy/core";
import httpMultipartBodyParser from "@middy/http-multipart-body-parser";
import { APIGatewayProxyResult, Context } from "aws-lambda";

import { v4 as uuidv4 } from "uuid";
import { docClient } from "../../clients/dynamodb";
import { s3Client } from "../../clients/s3";
import { getUserId } from "../../helpers/jwt";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

type MultiPartFormEvent = {
  headers: { Authorization: string };
  body: {
    data: {
      petName: string;
      location: string;
      vaccinatedStatus: string;
      chippedStatus: string;
      shortDescription: string;
    };
    "images[]": [
      {
        filename: string;
        mimetype: string;
        encoding: string;
        truncated: boolean;
        content: Buffer;
      }
    ];
  };
};
const uploadImages = async (images: any, userId: string, petId: string) => {
  //TODO optimize using async await.
  
  for( let i = 0; i < images.length; i++ ) {
    console.log("Image", images[i].content.Buffer);
    const buffer = Buffer.from(images[i].content);
    console.log("Buffer", buffer);
    console.log("Buffer lenght", buffer.length);
    const command = new PutObjectCommand({
      Bucket: process.env.PETS_PHOTOS_BUCKET_NAME,
      Key: `${petId}/pet-photo-${i}`,
      Body:  buffer,
      ContentType: images[i].mimetype,
      ContentEncoding: images[i].encoding,
      ContentLength: buffer.length,
    });
    try{
      const response = await s3Client.send(command);
      console.log(response);
    }catch(e){
      console.log(e);
    }
  }
  return {
    statusCode: 200,
    body: JSON.stringify(""),
  };
};
export const addPet = middy()
  .handler(
    async (
      event: MultiPartFormEvent,
      context: Context
    ): Promise<APIGatewayProxyResult> => {
      const userId = getUserId(event?.headers?.Authorization);
      const petId = `PET_ID#${uuidv4()}`
      console.log("Proceeding with pet insert");
      const command = new PutCommand({
        TableName: process.env.USER_TABLE,
        Item: {
          id: userId,
          pet_id: petId,
          data: event?.body?.data ? JSON.parse(event.body.data as any) : {},
        },
      });

      try {
        await docClient.send(command);
        console.log("Continuing with image upload");
        return await uploadImages(event?.body?.["images[]"], userId, petId);
      } catch (e) {
        console.log(`Database insert failed with message ${e}`);
        throw Error("Database insert failed!");
      }
    }
  )
  .use(httpMultipartBodyParser());
