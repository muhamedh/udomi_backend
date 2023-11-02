import middy from "@middy/core";
import httpRouterHandler from "@middy/http-router";
import cors from "@middy/http-cors";

import { getMyPets } from "./controllers/pets/getMyPets";
import { addPet } from "./controllers/pets/addPet";
import { editUser } from "./controllers/users/editUser";

const routes: any = [
  {
    method: "GET",
    path: "/pets/my",
    handler: getMyPets,
  },
  {
    method: "POST",
    path: "/pets",
    handler: addPet,
  },
  {
    method: "POST",
    path: "/users",
    handler: editUser,
  },
];

export const handler = middy()
  .handler(httpRouterHandler(routes))
  .use(
    cors({
      origin: '*',
      methods: 'OPTIONS,GET,POST',
      headers: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
    })
  );
