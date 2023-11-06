import middy from "@middy/core";
import httpMultipartBodyParser from "@middy/http-multipart-body-parser";
import { APIGatewayProxyResult, Context } from "aws-lambda";

import { v4 as uuidv4 } from "uuid";
import { docClient } from "../../clients/dynamodb";
import { s3Client } from "../../clients/s3";
import { getUserId } from "../../helpers/jwt";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand } from "@aws-sdk/client-s3";

type MultiPartFormEvent = {
  headers: { Authorization: string };
  body: {
    data: {
      petName: string;
      location: string;
      vaccinatedStatus: string;
      chippedStatus: string;
      shortDescription: string;
      numberOfPhotos: number;
      photoNames: string[];
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
const getPhotoNames = (images: any): string[] => {
  const mimesMap = new Map();
  mimesMap.set("image/jpeg", ".jpg");
  mimesMap.set("image/png", ".png");
  mimesMap.set("image/webp", ".webp");
  const names = [];
  if (!images.length) {
    return [`photo-0${mimesMap.get(images.mimetype)}`];
  }
  for (let i = 0; i < images.length; i++) {
    names.push(`photo-${i}${mimesMap.get(images[i].mimetype)}`);
  }
  return names;
};
const uploadImages = async (
  images: any,
  userId: string,
  petId: string,
  names: any
) => {
  //TODO optimize using async await.

  console.log(images);
  if(!images.length) {
    const command = new PutObjectCommand({
      Bucket: process.env.PETS_PHOTOS_BUCKET_NAME,
      Key: `${petId}/${names[0]}`,
      Body: images.content,
      ContentType: images.mimetype,
      ContentEncoding: images.encoding,
    });
    try {
      const response = await s3Client.send(command);
      console.log(response);
    } catch (e) {
      console.log(e);
    }
    return {
      statusCode: 200,
      body: JSON.stringify(""),
    };
  }
  for (let i = 0; i < images.length; i++) {
    const command = new PutObjectCommand({
      Bucket: process.env.PETS_PHOTOS_BUCKET_NAME,
      Key: `${petId}/${names[i]}`,
      Body: images[i].content,
      ContentType: images[i].mimetype,
      ContentEncoding: images[i].encoding,
    });
    try {
      const response = await s3Client.send(command);
      console.log(response);
    } catch (e) {
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
      const petId = `PET_ID#${uuidv4()}`;
      const photosNames: string[] = getPhotoNames(event?.body?.["images[]"]);

      // for us to be able to give out presigned url, we need to know how many images are there and which type are they
      // the received data has been overstringified (probably) by the multipart parser, so we need to parse it twice
      const data = JSON.parse(
        JSON.parse(JSON.stringify(event.body.data) as any)
      );
      console.log(event);
      console.log(event?.body?.["images[]"]);

      const command = new PutCommand({
        TableName: process.env.USER_TABLE,
        Item: {
          id: userId,
          pet_id: petId,
          data: data ? (data as any) : {},
          numberOfPhotos: event?.body?.["images[]"].length
            ? event?.body?.["images[]"].length
            : 1,
          photoNames: photosNames ? photosNames : [],
        },
      });

      try {
        await docClient.send(command);
        console.log("Continuing with image upload");
        return await uploadImages(
          event?.body?.["images[]"],
          userId,
          petId,
          photosNames
        );
      } catch (e) {
        console.log(`Uploading images failed with error:  ${e}`);
        throw Error("Uploading of images failed!");
      }
    }
  )
  .use(httpMultipartBodyParser());
