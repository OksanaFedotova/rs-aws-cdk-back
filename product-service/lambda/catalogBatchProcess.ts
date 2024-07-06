import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import * as uuid from "uuid";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

export interface Message {
  body: string;
}

export interface Event {
  Records: Message[];
}

export interface Product {
  description: string;
  price: string;
  title: string;
  count: string;
}

const productsTableName = process.env.PRODUCTS_TABLE_NAME!;
const stocksTableName = process.env.STOCKS_TABLE_NAME!;
const createProductTopicArn = process.env.CREATE_PRODUCT_TOPIC_ARN;

export const handler = async (event: Event): Promise<void> => {
  try {
    console.log(event.Records);
    const dynamoDBClient = new DynamoDBClient({ region: "eu-west-1" });
    const snsClient = new SNSClient({ region: "eu-west-1" });

    if (!createProductTopicArn) {
      console.error("CREATE_PRODUCT_TOPIC_ARN environment variable not set");
    }

    for (const message of event.Records) {
      //console.log(message.body);
      const products: Product[] = JSON.parse(message.body);
      //console.log(products);
      if (createProductTopicArn) {
        const publishCommand = new PublishCommand({
          TopicArn: createProductTopicArn,
          Message: message.body,
        });
        try {
          await snsClient.send(publishCommand);
          console.log("Message published to SNS topic");
        } catch (error) {
          console.error("Error publishing message to SNS topic:", error);
        }
      } else {
        console.log(
          "CREATE_PRODUCT_TOPIC_ARN environment variable not set, skipping SNS publishing"
        );
      }
      for (const product of products) {
        const { description, price, title, count } = product;

        if (!description || !price || !title || !count) {
          console.error("Missing required fields in messageBody");
          continue;
        }

        if (isNaN(parseFloat(price)) || isNaN(parseInt(count))) {
          console.error("Price and count must be numeric");
          continue;
        }

        const productId = uuid.v4().toString();

        const params = {
          TransactItems: [
            {
              Put: {
                TableName: productsTableName,
                Item: marshall({
                  id: productId,
                  title,
                  description,
                  price,
                }),
              },
            },
            {
              Put: {
                TableName: stocksTableName,
                Item: marshall({
                  product_id: productId,
                  count,
                }),
              },
            },
          ],
        };

        try {
          await dynamoDBClient.send(new TransactWriteItemsCommand(params));
          console.log(`Wrote product with ID ${productId} to DynamoDB`);
        } catch (error) {
          console.error("Error writing to DynamoDB:", error);
        }
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
