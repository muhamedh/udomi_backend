import middy from "@middy/core";
import httpMultipartBodyParser from "@middy/http-multipart-body-parser";
import { APIGatewayProxyResult, Context } from "aws-lambda";
import cors from "@middy/http-cors";
import { getUserId } from "../../helpers/jwt";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../clients/dynamodb";
import { getPhotoNames, uploadImages } from "../../helpers/uploadImagesToS3";
import { deleteImages } from "../../helpers/deleteImagesFromS3";

type MultiPartFormEvent = {
  headers: { Authorization: string };
  body: {
    data: {
      pet_id: string;
      petName: string;
      location: string;
      vaccinatedStatus: string;
      chippedStatus: string;
      shortDescription: string;
      numberOfPhotos: number;
      photoNames: string[];
    };
    "images[]"?:
      | [
          {
            filename: string;
            mimetype: string;
            encoding: string;
            truncated: boolean;
            content: Buffer;
          }
        ]
      | undefined;
    images?: string[] | undefined;
  };
};
export const editPet = middy()
  .handler(
    async (
      event: MultiPartFormEvent,
      context: Context
    ): Promise<APIGatewayProxyResult> => {
      console.log(event);
      const userId = getUserId(event?.headers?.Authorization);
      let photosNames: string[] = [];
      console.log("Proceeding with pet edit");
      // const petData = JSON.parse(event?.body ? event?.body : "{}");
      // console.log(petData);
      // console.log(typeof petData)
      // console.log(petData?.data?.pet_id);
      // console.log('-- parse --')
      // console.log(JSON.parse(petData).data.pet_id);
      // console.log(typeof JSON.parse(petData));
      let command: UpdateCommand = {} as UpdateCommand;

      const data = JSON.parse(
        JSON.parse(JSON.stringify(event.body.data) as any)
      );
      //TODO validate location value
      const location = data.location;
      delete data.location;

      if (event?.body?.["images[]"]) {
        console.log("New images were uploaded");
        photosNames = getPhotoNames(event?.body?.["images[]"]);
        //delete old images
        await deleteImages(data?.pet_id);
        await uploadImages(
          event?.body?.["images[]"],
          userId,
          data?.pet_id,
          photosNames
        );
        command = new UpdateCommand({
          TableName: process.env.USER_TABLE,
          Key: {
            id: userId,
            pet_id: `${data?.pet_id}`,
          },
          UpdateExpression:
            "SET #data = :data, #numberOfPhotos = :numberOfPhotos, #photoNames = :photoNames, #location = :location",
          ExpressionAttributeNames: {
            "#data": "data",
            "#numberOfPhotos": "numberOfPhotos",
            "#photoNames": "photoNames",
            "#location": "location",
          },
          ExpressionAttributeValues: {
            ":data": data ? data : {},
            ":numberOfPhotos": event?.body?.["images[]"].length
              ? event?.body?.["images[]"].length
              : 1,
            ":photoNames": photosNames ? photosNames : [],
            ":location": location ? location : "Ostalo",
          },
        });
      } else {
        console.log("No new images were uploaded");
        command = new UpdateCommand({
          TableName: process.env.USER_TABLE,
          Key: {
            id: userId,
            pet_id: `${data?.pet_id}`,
          },
          UpdateExpression: "SET #data = :data, #location = :location",
          ExpressionAttributeNames: {
            "#data": "data",
            "#location": "location",
          },
          ExpressionAttributeValues: {
            ":data": data ? data : {},
            ":location": location ? location : "Ostalo",
          },
        });
      }

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
  )
  .use(httpMultipartBodyParser());
