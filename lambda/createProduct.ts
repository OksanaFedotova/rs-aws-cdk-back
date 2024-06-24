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

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
};

const dynamoDBClient = new DynamoDBClient({ region: "eu-west-1" });
const productsTableName = process.env.PRODUCTS_TABLE_NAME;
const stocksTableName = process.env.STOCKS_TABLE_NAME;


export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Incoming request:", event);

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

    await dynamoDBClient.send(new TransactWriteItemsCommand(params));

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: `Product with ID ${productId} created successfully`,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify("Error creating product"),
    };
  }
};
