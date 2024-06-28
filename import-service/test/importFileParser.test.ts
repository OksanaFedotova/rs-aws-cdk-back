import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const mockSignedUrl = "https://signed-url.example.com";

const mockEvent: APIGatewayProxyEvent = {
  queryStringParameters: { name: "test-file.csv" },
} as unknown as APIGatewayProxyEvent;
let mockS3Client: any;
mockS3Client = mockClient(S3Client);
mockS3Client.on(GetObjectCommand).resolves({
  Body: Buffer.from("mocked file contents"),
});
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn().mockResolvedValue(mockSignedUrl),
}));

import { handler } from "../lambda/importProductsFile";

describe("handler", () => {
  afterEach(() => {
    mockS3Client.restore();
  });

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
