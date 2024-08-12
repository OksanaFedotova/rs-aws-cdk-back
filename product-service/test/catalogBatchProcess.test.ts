import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { v4 as uuidv4 } from "uuid";

jest.mock("@aws-sdk/client-dynamodb");
jest.mock("@aws-sdk/client-sns");
jest.mock("uuid");
const mockProducts: Product[] = [
  {
    description: "Product 1 description",
    price: "19.99",
    title: "Product 1",
    count: "10",
  },
];

const mockEvent: Event = {
  Records: [
    {
      body: JSON.stringify(mockProducts),
    },
  ],
};

const mockProductId = "abc123";
(uuidv4 as jest.Mock).mockReturnValue(mockProductId);

const dynamoDBClientSendMock = jest.fn().mockResolvedValue({});
(DynamoDBClient as jest.Mock).mockReturnValue({
  send: dynamoDBClientSendMock,
});

const snsClientSendMock = jest.fn().mockResolvedValue({});
(SNSClient as jest.Mock).mockReturnValue({
  send: snsClientSendMock,
});

process.env.PRODUCTS_TABLE_NAME = "products";
process.env.STOCKS_TABLE_NAME = "stocks";
process.env.CREATE_PRODUCT_TOPIC_ARN =
  "arn:aws:sns:eu-west-1:905418269002:create-product-topic";

import { handler, Product, Event } from "../lambda/catalogBatchProcess";

describe("handler", () => {
  it("should publish message to SNS topic and write product to DynamoDB", async () => {
    const spyOnSNSClientSend = jest.spyOn(SNSClient.prototype, "send");
    const spyOnDynamoDBClientSend = jest.spyOn(
      DynamoDBClient.prototype,
      "send"
    );

    try {
      await handler(mockEvent);
    } catch (error) {
      console.error("Error in handler:", error);
      throw error;
    }

    expect(snsClientSendMock).toHaveBeenCalledTimes(1);
    expect(dynamoDBClientSendMock).toHaveBeenCalledTimes(1);

    spyOnSNSClientSend.mockRestore();
    spyOnDynamoDBClientSend.mockRestore();
  });

  it("should handle missing required fields in messageBody", async () => {
    const mockProducts: Product[] = [
      {
        description: "Product 1 description",
        price: "19.99",
        title: "",
        count: "10",
      },
    ];

    const mockEvent: Event = {
      Records: [
        {
          body: JSON.stringify(mockProducts),
        },
      ],
    };

    await handler(mockEvent);
  });

  it("should handle non-numeric price and count", async () => {
    const mockProducts: Product[] = [
      {
        description: "Product 1 description",
        price: "abc",
        title: "Product 1",
        count: "def",
      },
    ];

    const mockEvent: Event = {
      Records: [
        {
          body: JSON.stringify(mockProducts),
        },
      ],
    };

    await handler(mockEvent);
  });

  it("should handle missing CREATE_PRODUCT_TOPIC_ARN environment variable", async () => {
    delete process.env.CREATE_PRODUCT_TOPIC_ARN;

    const mockProducts: Product[] = [
      {
        description: "Product 1 description",
        price: "19.99",
        title: "Product 1",
        count: "10",
      },
    ];

    const mockEvent: Event = {
      Records: [
        {
          body: JSON.stringify(mockProducts),
        },
      ],
    };

    await handler(mockEvent);
  });
});
