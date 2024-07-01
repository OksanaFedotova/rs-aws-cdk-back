import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const dynamoDB = new DynamoDBClient({ region: "eu-west-1" });

interface ProductItem {
    id: { S: string };
    title: { S: string };
    description: { S: string };
    price: { N: string };
}

interface StockItem {
    product_id: { S: string };
    count: { N: string };
}

const addProduct = async (title: string, description: string, price: number): Promise<string> => {
    const id = randomUUID(); 

    const params: PutItemCommandInput = {
        TableName: "products", 
        Item: {
            id: { S: id },
            title: { S: title },
            description: { S: description },
            price: { N: price.toString() },
        },
    };

    try {
        const command = new PutItemCommand(params);
        await dynamoDB.send(command);
        console.log(`Product with ID ${id} added successfully.`);
        return id;
    } catch (error) {
        console.error("Error adding product:", error);
        throw error;
    }
};

const addStock = async (productId: string): Promise<void> => {
    const count = Math.floor(Math.random() * 10) + 1; 

    const params: PutItemCommandInput = {
        TableName: "stocks", 
        Item: {
            product_id: { S: productId },
            count: { N: count.toString() },
        },
    };

    try {
        const command = new PutItemCommand(params);
        await dynamoDB.send(command);
        console.log(`Stock entry for product ${productId} added successfully.`);
    } catch (error) {
        console.error("Error adding stock entry:", error);
        throw error; 
    }
};


const fillDatabase = async (): Promise<void> => {
    try {

        const productId1 = await addProduct("Travel one", "Travel to the sea", 500);
        const productId2 = await addProduct("Travel two", "Travel to the mountains", 400);
        const productId3 = await addProduct("Travel three", "Travel to the moon", 2000000);
        await addStock(productId1);
        await addStock(productId2);
        await addStock(productId3);

        console.log("All products and stocks added successfully.");
    } catch (error) {
        console.error("Error filling database:", error);
    }
};

fillDatabase();

