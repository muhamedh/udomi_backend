import { s3Client } from "../clients/s3";
import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

export const deleteImages = async (pet_id: string) => {
  const listCommand = new ListObjectsV2Command({
    Bucket: process.env.PETS_PHOTOS_BUCKET_NAME,
    Prefix: pet_id,
  });
  let list = await s3Client.send(listCommand);
  console.log(list);
  if (list.KeyCount) {
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: process.env.PETS_PHOTOS_BUCKET_NAME,
      Delete: {
        Objects: list.Contents?.map((item) => ({ Key: item.Key })),
        Quiet: false,
      },
    });

    let deleted = await s3Client.send(deleteCommand);
    if (deleted.Errors) {
      deleted.Errors.map((error) =>
        console.log(`error: ${error.Key} could not be deleted - ${error.Code}`)
      );
    }
  }
  return null;
};
