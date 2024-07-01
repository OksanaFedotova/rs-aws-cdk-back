import { DynamoDBClient, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import * as uuid from 'uuid';

interface Message {
  body: string;
}

interface Event {
  Records: Message[];
}

const productsTableName = process.env.PRODUCTS_TABLE_NAME!;
const stocksTableName = process.env.STOCKS_TABLE_NAME!;

export const handler = async (event: Event): Promise<void> => {
  try {
  console.log(event.Records);

  const dynamoDBClient = new DynamoDBClient({ region: "eu-west-1" });


  for (const message of event.Records) {
    const messageBody = JSON.parse(message.body);
    if (!messageBody.title || !messageBody.description || !messageBody.price || !messageBody.count) {
      console.error('Missing required fields in messageBody');
    }
    const productId = uuid.v4().toString();

     const params = {
      TransactItems: [
        {
          Put: {
            TableName: productsTableName,
            Item: marshall({
              id: productId,
              title: messageBody.title,
              description: messageBody.description,
              price: messageBody.price,
            }),
          },
        },
        {
          Put: {
            TableName: stocksTableName,
            Item: marshall({
              product_id: productId,
              count: messageBody.count,
            }),
          },
        },
      ],
    };

    await dynamoDBClient.send(new TransactWriteItemsCommand(params));
  }
} catch (error) {
    console.error("Error:", error);
  }
};
