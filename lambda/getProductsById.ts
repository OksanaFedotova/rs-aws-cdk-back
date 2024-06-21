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

const dynamoDBClient = new DynamoDBClient({ region: "eu-west-1" }); // Укажите ваш регион

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const idParams = event.pathParameters?.productId;

  if (!idParams) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify("Missing productId in path parameters"),
    };
  }

  const params = {
    TableName: "products", // Укажите имя вашей таблицы DynamoDB
    Key: {
      id: { S: idParams }, // Предполагается, что id является строковым типом (S)
    },
  };

  try {
    const command = new GetItemCommand(params);
    const data = await dynamoDBClient.send(command);

    if (data.Item) {
      const product = unmarshall(data.Item);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(product),
      };
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify(`No product found with id ${idParams}`),
      };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify("Error fetching product"),
    };
  }
};
