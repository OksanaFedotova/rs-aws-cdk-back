import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
const mockSignedUrl = "https://signed-url.example.com";
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn().mockResolvedValue(mockSignedUrl),
}));

import { handler } from "../lambda/importProductsFile";

const mockEvent: APIGatewayProxyEvent = {
  queryStringParameters: { name: "test-file.csv" },
} as unknown as APIGatewayProxyEvent;

describe("handler", () => {
  it("should return a signed URL when a valid filename is provided", async () => {
    const result: APIGatewayProxyResult = await handler(mockEvent);

    expect(result.statusCode).toEqual(200);
    expect(result.body).toContain(mockSignedUrl);
  });

  it("should handle missing name parameter gracefully", async () => {
    const mockEventWithoutName: APIGatewayProxyEvent = {
      queryStringParameters: {},
    } as APIGatewayProxyEvent;

    const result: APIGatewayProxyResult = await handler(mockEventWithoutName);

    expect(result.statusCode).toEqual(400);
    expect(result.body).toContain("Missing name in query parameters");
  });
});
