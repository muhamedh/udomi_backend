import middy from "@middy/core";
import httpMultipartBodyParser from "@middy/http-multipart-body-parser";
import { APIGatewayProxyResult, Context } from "aws-lambda";

import { v4 as uuidv4 } from "uuid";
import { docClient } from "../../clients/dynamodb";
import cors from "@middy/http-cors";
import { getUserId } from "../../helpers/jwt";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { uploadImages, getPhotoNames } from "../../helpers/uploadImagesToS3";

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
      const location = data.location;
      //TODO validate location value
      delete data.location;

      // console.log(event);
      // console.log(event?.body?.["images[]"]);

      const command = new PutCommand({
        TableName: process.env.USER_TABLE,
        Item: {
          id: userId,
          pet_id: petId,
          data: data ? (data as any) : {},
          location: location,
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
