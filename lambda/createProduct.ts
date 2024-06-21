import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";

const dynamoDBClient = new DynamoDBClient({ region: "eu-west-1" });
const tableName = "products";

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: "Method Not Allowed" }),
      };
    }

    const productId = randomUUID();

    const productData = JSON.parse(event.body!);

    const params = {
      TableName: tableName,
      Item: marshall({
        id: productId,
        title: productData.title,
        description: productData.description,
        price: productData.price,
      }),
    };

    await dynamoDBClient.send(new PutItemCommand(params));

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: `Product with ID ${productId} created successfully`,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify("Error creating product"),
    };
  }
};
