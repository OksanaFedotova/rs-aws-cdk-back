import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
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
    const productsParams = {
      TableName: "products",
    };
    const productsCommand = new ScanCommand(productsParams);
    const productsData = await dynamoDBClient.send(productsCommand);
    const stocksParams = {
      TableName: "stocks",
    };
    const stocksCommand = new ScanCommand(stocksParams);
    const stocksData = await dynamoDBClient.send(stocksCommand);

    if (
      productsData.Items &&
      productsData.Items.length > 0 &&
      stocksData.Items &&
      stocksData.Items.length > 0
    ) {
      const combinedData = {
        products: productsData.Items.map((item) => unmarshall(item)),
        stocks: stocksData.Items.map((item) => unmarshall(item)),
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
        body: JSON.stringify("No data found in one or more tables"),
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
