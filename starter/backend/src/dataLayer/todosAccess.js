import AWSXRay from 'aws-xray-sdk-core'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { createLogger } from '../auth/utils.js'

const dynamoDb = new DynamoDB()
const dynamoDbXRay = AWSXRay.captureAWSv3Client(dynamoDb)
const dynamoDbClient = DynamoDBDocument.from(dynamoDbXRay)
const todosTable = process.env.TODOS_TABLE
const logger = createLogger('utils')

export async function createTodoDb(item) {
  await dynamoDbClient.put({
    TableName: todosTable,
    Item: item
  })
}

export async function getAllToDo(userId) {
  const result = await dynamoDbClient.query({
    TableName: todosTable,
    IndexName: 'TodosUserIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  })
  return result.Items
}

export async function getTodo(userId, todoId) {
  const getTodo = await dynamoDbClient.query({
    TableName: todosTable,
    IndexName: 'TodosUserIndex',
    KeyConditionExpression: 'userId = :userId and todoId = :todoId',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':todoId': todoId
    }
  })
  logger.info('getTodo', getTodo)
  return getTodo.Items[0]
}

export async function updatedTodoDb(todoId, createdAt, update) {
  const params = {
    TableName: todosTable,
    Key: {
      todoId: todoId,
      createdAt: createdAt
    },
    UpdateExpression: 'set #name = :name, #done = :done, #dueDate = :dueDate',
    ExpressionAttributeNames: {
      '#name': 'name',
      '#done': 'done',
      '#dueDate': 'dueDate'
    },
    ExpressionAttributeValues: {
      ':name': update.name,
      ':done': update.done,
      ':dueDate': update.dueDate
    },
    ReturnValues: 'ALL_NEW'
  }

  const result = await dynamoDbClient.update(params)
  return result.Attributes
}

export async function updatedTodoImageUrlDb(todoId, createdAt, attachmentUrl) {
  const params = {
    TableName: todosTable,
    Key: {
      todoId: todoId,
      createdAt: createdAt
    },
    UpdateExpression: 'SET #attachmentUrl = :attachmentUrl',
    ExpressionAttributeNames: {
      '#attachmentUrl': 'attachmentUrl'
    },
    ExpressionAttributeValues: {
      ':attachmentUrl': attachmentUrl
    },
    ReturnValues: 'ALL_NEW'
  }

  const result = await dynamoDbClient.update(params)
  return result.Attributes
}

export async function deleteTodoDb(todoId, createdAt) {
  const params = {
    TableName: todosTable,
    Key: {
      todoId: todoId,
      createdAt: createdAt
    }
  }
  const result = await dynamoDbClient.delete(params)
  return result.Attributes
}
