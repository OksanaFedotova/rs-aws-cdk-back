import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import * as uuid from "uuid";

interface Message {
  body: string;
}

interface Event {
  Records: Message[];
}

interface Product {
  description: string;
  price: string;
  title: string;
  count: string;
}

const productsTableName = process.env.PRODUCTS_TABLE_NAME!;
const stocksTableName = process.env.STOCKS_TABLE_NAME!;

export const handler = async (event: Event): Promise<void> => {
  try {
    console.log(event.Records);
    const dynamoDBClient = new DynamoDBClient({ region: "eu-west-1" });

    for (const message of event.Records) {
      console.log(message.body);
      const products: Product[] = JSON.parse(message.body);
      console.log(products);

      for (const product of products) {
        const { description, price, title, count } = product;

        if (!description || !price  || !title || !count) {
          console.error("Missing required fields in messageBody");
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
