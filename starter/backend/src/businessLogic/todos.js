import { parseUserId } from '../auth/utils.js'
import {
  createTodoDb,
  getAllToDo,
  getTodo,
  updatedTodoDb,
  deleteTodoDb
} from '../dataLayer/todosAccess.js'
import * as uuid from 'uuid'

function getUserId(event) {
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  return parseUserId(jwtToken)
}

export async function createTodo(event) {
  const newTodo = JSON.parse(event.body)
  const itemId = uuid.v4()
  const userId = getUserId(event)

  const item = {
    todoId: itemId,
    userId: userId,
    name: newTodo.name,
    done: false,
    dueDate: newTodo.dueDate,
    createdAt: new Date().toISOString()
  }

  await createTodoDb(item)

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      item
    })
  }
}

export async function getTodos(event) {
  const userId = getUserId(event)
  const items = await getAllToDo(userId)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items
    })
  }
}

export async function updatedTodo(event) {
  const todoId = event.pathParameters.todoId
  const update = JSON.parse(event.body)
  const userId = getUserId(event)

  const item = await getTodo(userId, todoId)
  const createdAt = item.createdAt

  const itemUpdate = await updatedTodoDb(todoId, createdAt, update)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'Todo item updated successfully',
      updatedItem: itemUpdate
    })
  }
}

export async function deleteTodo(event) {
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)
  console.log('todoId', todoId)
  console.log('userId', userId)

  const item = await getTodo(userId, todoId)
  console.log('item', item)
  const createdAt = item.createdAt
  console.log('createdAt', createdAt)

  try {
    const itemDelete = await deleteTodoDb(todoId, createdAt)
    console.log('Delete succeeded:', itemDelete)
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Todo item updated successfully',
        updatedItem: itemDelete
      })
    }
  } catch (error) {
    console.error('Error deleting item:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Could not update todo item',
        error: error.message
      })
    }
  }
}
