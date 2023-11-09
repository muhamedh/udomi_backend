import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../clients/s3";

export const getPhotoNames = (images: any): string[] => {
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

export const uploadImages = async (
  images: any,
  userId: string,
  petId: string,
  names: any
) => {
  //TODO optimize using async await.

  console.log(images);
  if (!images.length) {
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
