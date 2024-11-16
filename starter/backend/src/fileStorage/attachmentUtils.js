import { getTodo, updatedTodoImageUrlDb } from '../dataLayer/todosAccess.js'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import { parseUserId } from '../auth/utils.js'

const s3Client = new S3Client()
const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = 100000

function getUserId(event) {
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  return parseUserId(jwtToken)
}

export async function handler(event) {
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)

  const item = await getTodo(userId, todoId)
  const createdAt = item.createdAt

  const imageId = uuidv4()
  const attachmentUrl = `https://${bucketName}.s3.amazonaws.com/${imageId}`
  const urlForImage = await getUploadUrl(imageId)

  try {
    const result = await updatedTodoImageUrlDb(todoId, createdAt, attachmentUrl)
    console.log('Update result:', JSON.stringify(result, null, 2))

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Todo item updated successfully',
        uploadUrl: urlForImage
      })
    }
  } catch (error) {
    console.error('Error updating todo item:', error)

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Could not update todo item',
        error: error.message
      })
    }
  }
}

async function getUploadUrl(imageId) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: imageId
  })
  const url = await getSignedUrl(s3Client, command, {
    expiresIn: urlExpiration
  })
  return url
}
