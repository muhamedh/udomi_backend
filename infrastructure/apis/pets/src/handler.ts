import middy from "@middy/core";
import httpRouterHandler from "@middy/http-router";
import cors from "@middy/http-cors";

import { getMyPets } from "./controllers/pets/getMyPets";
import { addPet } from "./controllers/pets/addPet";
import { editPet } from "./controllers/pets/editPet";
import { editUser } from "./controllers/users/editUser";
import { getLocations } from "./controllers/locations/getLocations";
import httpErrorHandler from "@middy/http-error-handler";

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
    method: "PUT",
    path: "/pets",
    handler: editPet,
  },
  {
    method: "POST",
    path: "/users",
    handler: editUser,
  },
  {
    method: "GET",
    path: "/location",
    handler: getLocations,
  },
];

export const handler = middy()
  .handler(httpRouterHandler(routes))
  .use(httpErrorHandler({ fallbackMessage: "Greška na serveru" }))
  .use(
    cors({
      origin: "*",
      methods: "OPTIONS,GET,POST,PUT",
      headers:
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    })
  );
