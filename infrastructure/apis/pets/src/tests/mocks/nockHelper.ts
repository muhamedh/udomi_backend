import nock from "nock";

// Nock a database call with user id "dummy-user-id" and return a list of pets
export const nockDynamoDBGetMyPetsCall = () => {
  const response = {
    Items: [
      {
        email: { S: "dummy@email.com" },
        id: { S: "dummy-user-id" },
        data: { S: '{"phoneNumber":"2312312"}' },
        pet_id: { S: "PET_ID#" },
      },
      {
        id: { S: "dummy-user-id" },
        data: {
          S: '{"petName":"Dummy Pet Name","location":"Dummy Location","vaccinatedStatus":"VACCINATED","chippedStatus":"CHIPPED","shortDescription":"Dummy Short Description"}',
        },
        pet_id: { S: "PET_ID#8312d226-7c90-4ec4-a4df-8def0ece1bcb" },
      },
    ],
  };

  nock("https://dynamodb.us-east-1.amazonaws.com/", {
    encodedQueryParams: true,
  })
    .post("/", {
      ExpressionAttributeValues: {
        ":id": { S: "dummy-user-id" },
        ":pet_id": { S: "PET_ID#" },
      },
      KeyConditionExpression: "id = :id and begins_with(pet_id, :pet_id)",
    })
    .reply(200, response);
};

export const nockDynamoDBGetMyPetsErrorCall = () => {
  nock("https://dynamodb.us-east-1.amazonaws.com:443", {
    encodedQueryParams: true,
  })
    .post(
      "/",
      '{"ExpressionAttributeValues":{":id":{"S":"dummy-user-id"},":pet_id":{"S":"PET_ID#"}},"KeyConditionExpression":"id = :id and begins_with(pet_id, :pet_id)"}'
    )
    .reply(500);
};
