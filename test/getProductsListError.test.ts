jest.mock("../lambda/data", () => []);

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { handler } from "../lambda/getProductsList";

describe("handler", () => {
  const context: Context = {} as Context;
  const callback = () => {};
  const event: APIGatewayProxyEvent = {} as APIGatewayProxyEvent;

  test('should return "No products" with status code 404 if products is empty', async () => {
    const event: APIGatewayProxyEvent = {} as APIGatewayProxyEvent;

    const result = (await handler(
      event,
      context,
      callback
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(404);
    expect(result.body).toBe('"No products"');
  });
});

afterEach(() => {
  jest.clearAllMocks();
});
