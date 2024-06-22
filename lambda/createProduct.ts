import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";

const dynamoDBClient = new DynamoDBClient({ region: "eu-west-1" });
const productsTableName = "products";
const stocksTableName = "stocks";

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Incoming request:", event);
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: "Method Not Allowed" }),
      };
    }
    const productId = randomUUID();
    const productData = JSON.parse(event.body!);
    const params = {
      TransactItems: [
        {
          Put: {
            TableName: productsTableName,
            Item: marshall({
              id: productId,
              title: productData.title,
              description: productData.description,
              price: productData.price,
            }),
          },
        },
        {
          Put: {
            TableName: stocksTableName,
            Item: marshall({
              product_id: productId,
              count: productData.count,
            }),
          },
        },
      ],
    };

    // Execute the transaction
    await dynamoDBClient.send(new TransactWriteItemsCommand(params));

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
