import { APIGatewayProxyEvent } from "aws-lambda";

// We created a dummy JWT token 
// The format of the payload is:
// {
//   "sub": "dummy-user-id",
//   "email_verified": true,
//   "iss": "https://dummy-url.com",
//   "cognito:username": "dummy-username",
//   "origin_jti": "dummy-origin-jti",
//   "aud": "dummy-aud",
//   "event_id": "dummy-event_id",
//   "token_use": "id",
//   "auth_time": 1,
//   "exp": 2,
//   "iat": 1,
//   "jti": "dummy-jti",
//   "email": "dummy-email.com"
// }
// Now we can mock endpoints that require a JWT token and expect the call to be made for the "dummy-user-id"

export const getMyPetsEvent: APIGatewayProxyEvent = {
  body: "",
  headers: {
    Authorization:
      "eyJraWQiOiJZdlA2ZkhMWExUR2FCeUQwTFwvWFhHVU9Db3lSSDZLMzI1aXY2T05sbUlOYz0iLCJhbGciOiJSUzI1NiJ9.ewogICJzdWIiOiAiZHVtbXktdXNlci1pZCIsCiAgImVtYWlsX3ZlcmlmaWVkIjogdHJ1ZSwKICAiaXNzIjogImh0dHBzOi8vZHVtbXktdXJsLmNvbSIsCiAgImNvZ25pdG86dXNlcm5hbWUiOiAiZHVtbXktdXNlcm5hbWUiLAogICJvcmlnaW5fanRpIjogImR1bW15LW9yaWdpbi1qdGkiLAogICJhdWQiOiAiZHVtbXktYXVkIiwKICAiZXZlbnRfaWQiOiAiZHVtbXktZXZlbnRfaWQiLAogICJ0b2tlbl91c2UiOiAiaWQiLAogICJhdXRoX3RpbWUiOiAxLAogICJleHAiOiAyLAogICJpYXQiOiAxLAogICJqdGkiOiAiZHVtbXktanRpIiwKICAiZW1haWwiOiAiZHVtbXktZW1haWwuY29tIgp9.tAPqa7yTNnZUHJi7nG0owx3AjCwOV9tx8yZLwt5XvbbXY6iXsCn8EC6v_D7ymMRDovZWPTrrBxxzP4r3USoVreQxyyfSuV81p3YDzuSsmWbe0lNRJ9_bQ2PqcKPEA_H1TY4P7yQdHTR2XOdNK5aTLGFut4iXAyWsGiUBfslhcszc_gkBeDNxtm7yq3LAP7gjiNN-NAOHb4Z7GmI8O4G3p7ZWaY2fAQo2KSBrIgyQ8l6mJoYE18CRU1iyzZT3FyltxomsWLRyFvHyBz4hvclSA3AiPGioQKBlLRUqm6n9QrIBxa8y7TxGpy1hRjdzuKI41T5XbMssckrdEnopP0d_YA",
  },
  multiValueHeaders: {},
  httpMethod: "GET",
  isBase64Encoded: false,
  path: "/pets/my",
  pathParameters: {},
  queryStringParameters: {},
  multiValueQueryStringParameters: {},
  stageVariables: {},
  requestContext: {
    accountId: "",
    apiId: "",
    authorizer: {},
    domainName: "",
    domainPrefix: "",
    extendedRequestId: "",
    httpMethod: "",
    identity: {
      accessKey: null,
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      clientCert: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: "",
      user: null,
      userAgent: null,
      userArn: null,
    },
    path: "",
    protocol: "",
    requestId: "",
    requestTime: "",
    requestTimeEpoch: 0,
    resourceId: "",
    resourcePath: "",
    stage: "",
  },
  resource: "",
};
