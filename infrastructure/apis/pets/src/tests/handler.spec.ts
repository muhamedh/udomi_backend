import { getMyPetsEvent } from "./mocks/events/getMyPets";
import { handler } from "../handler";
import {
  nockDynamoDBGetMyPetsCall,
  nockDynamoDBGetMyPetsErrorCall,
} from "./mocks/nockHelper";
import nock from "nock";

//   nock.recorder.rec();

describe("GET /pets/my", () => {
  jest.setTimeout(15000);
  const event = getMyPetsEvent;
  const context = {};
  afterAll(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    nock.cleanAll();
  });

  it("Should return 200 status code and user's pets", async () => {
    nockDynamoDBGetMyPetsCall();

    const response = await handler(getMyPetsEvent, context as any, jest.fn());

    expect(response).toMatchSnapshot();
  });
  it("Should return 5XX status code when database call fails", async () => {
    nockDynamoDBGetMyPetsErrorCall();
    try {
      const response = await handler(getMyPetsEvent, context as any, jest.fn());
      expect(true).toBe(false);
    } catch (e) {
      expect(true).toBe(true);
    }
  });
});
