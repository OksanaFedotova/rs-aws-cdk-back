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
const productsTableName = process.env.PRODUCTS_TABLE_NAME;
const stocksTableName = process.env.STOCKS_TABLE_NAME;

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
      TableName: productsTableName,
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
      TableName: stocksTableName,
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
        ...product,
        count: stock.count
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
