import { DynamoDBClient, ScanCommand, PutItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({
  region: "eu-north-1",
});

export const getTodos = async () => {
  try {
    const params = {
      TableName: "Todos",
    };
    const result = await client.send(new ScanCommand(params));
    const transformedItems = result.Items.map((item) => unmarshall(item));
    return {
      statusCode: 200,
      body: JSON.stringify(transformedItems),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: "Failed to fetch todos",
    };
  }
};

export const createTodo = async (event) => {
  try {
    const todo = JSON.parse(event.body);
    const params = {
      TableName: "Todos",
      Item: marshall(todo),
    };
    await client.send(new PutItemCommand(params));
    return {
      statusCode: 201,
      body: JSON.stringify(todo),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: "Failed to create Todo",
    };
  }
};

export const deleteTodo = async (event) => {
  try {
    const todoId = event.pathParameters.todoId;
    if (!todoId) {
      return {
        statusCode: 400,
        body: "todoId is required",
      };
    }
    const params = {
      TableName: "Todos",
      Key: {
        todoId: { S: todoId },
      },
    };
    await client.send(new DeleteItemCommand(params));
    return {
      statusCode: 200,
      body: "Todo deleted successfully",
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: "Failed to delete Todo",
    };
  }
};

export const updateTodo = async (event) => {
  try {
    const todoId = event.pathParameters.todoId;
    const updatedFields = JSON.parse(event.body);

    if (!todoId) {
      return {
        statusCode: 400,
        body: "todoId is required",
      };
    }

    let updateExpression = "SET";
    let expressionAttributeNames = {};
    let expressionAttributeValues = {};
    let first = true;

    for (const [key, value] of Object.entries(updatedFields)) {
      if (!first) {
        updateExpression += ",";
      }
      updateExpression += ` #${key} = :${key}`;
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value; // Now, directly setting the value
      first = false;
    }

    const params = {
      TableName: "Todos",
      Key: {
        todoId: { S: todoId },
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    await client.send(new UpdateItemCommand(params));

    return {
      statusCode: 200,
      body: "Todo patched successfully",
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: "Failed to patch Todo",
    };
  }
};