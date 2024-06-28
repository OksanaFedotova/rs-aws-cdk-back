import { APIGatewayProxyResult, Context } from "aws-lambda";
import { handler } from "../lambda/getProductsById";

describe("handler", () => {
  const context: Context = {} as Context;
  const callback = () => {};
  test("should return product when valid productId is provided", async () => {
    const event = {
      pathParameters: {
        productId: "7567ec4b-b10c-48c5-9345-fc73c48a80aa",
      },
    } as any;
    const result = (await handler(
      event,
      context,
      callback
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(result.body).toBeDefined();
  });

  test("should return 404 error when invalid productId is provided", async () => {
    const event = {
      pathParameters: {
        productId: "invalidProductId",
      },
    } as any;

    const result = (await handler(
      event,
      context,
      callback
    )) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(404);
    expect(result.body).toBe(
      JSON.stringify("No products with id invalidProductId")
    );
  });
});
