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

  test("should return products with status code 200", async () => {
    const result = (await handler(
      event,
      context,
      callback
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(result.body).toBeDefined();
  });
});
