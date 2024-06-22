import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
};

const dynamoDBClient = new DynamoDBClient({ region: "eu-west-1" });

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Incoming request:", event);
    const idParams = event.pathParameters?.productId;
    if (!idParams) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify("Missing productId in path parameters"),
      };
    }

    const productsParams = {
      TableName: "products",
      Key: {
        id: { S: idParams },
      },
    };
    const productsCommand = new GetItemCommand(productsParams);
    const productsData = await dynamoDBClient.send(productsCommand);

    if (!productsData.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify(`No product found with id ${idParams}`),
      };
    }

    const stocksParams = {
      TableName: "stocks",
      Key: {
        product_id: { S: idParams },
      },
    };
    const stocksCommand = new GetItemCommand(stocksParams);
    const stocksData = await dynamoDBClient.send(stocksCommand);

    if (stocksData.Item) {
      const stock = unmarshall(stocksData.Item);
      const product = unmarshall(productsData.Item);
      const combinedData = {
        product,
        stock,
      };
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(combinedData),
      };
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify(`No stock found for product with id ${idParams}`),
      };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify("Error fetching data"),
    };
  }
};