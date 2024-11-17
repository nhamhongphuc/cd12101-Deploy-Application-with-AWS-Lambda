import { decode } from 'jsonwebtoken'
import jsonwebtoken from 'jsonwebtoken'
import winston from 'winston'

export function createLogger(loggerName) {
  return winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { name: loggerName },
    transports: [new winston.transports.Console()]
  })
}

const logger = createLogger('utils')
/**
 * Parse a JWT token and return a user id
 * @param jwtToken JWT token to parse
 * @returns a user id from the JWT token
 */
export function parseUserId(jwtToken) {
  const decodedJwt = decode(jwtToken)
  return decodedJwt.sub
}

const certificate = `-----BEGIN CERTIFICATE-----
MIIDHTCCAgWgAwIBAgIJWMCqufKSx9laMA0GCSqGSIb3DQEBCwUAMCwxKjAoBgNV
BAMTIWRldi1rdXV3MHVxeWJzeXhxenc0LnVzLmF1dGgwLmNvbTAeFw0yNDExMTEx
MzQ4NDNaFw0zODA3MjExMzQ4NDNaMCwxKjAoBgNVBAMTIWRldi1rdXV3MHVxeWJz
eXhxenc0LnVzLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBAK/eUWD9FpTfxRpw9AQZtB4Du8MqgVsl6OEksTHd/e01nGXTOsrENhNG3n1O
bcW57Zolc+BNmWI7qxQaT+RqWq+4nF/0wfdhaRgsE+m2XfZF75Wf7MFf9dVVipcC
tlmxeT3pr60BQ9ol+uHzkG6ciV1ckrfbigoieLXHzlaBOdAFMHUA2W8V9TRXO5x0
Pf8VqvBbGq7bTZKiCQuLF+tvDBq4CIt/dKYDkInnnHqQa2YrdgTvIe31Gn4ScKIH
nhV5bUdHQIHy7PXy1JAp6B4P69B8kJrtuP4IN/swm7Ldpu9XUmOQbFLe94l6Ziv6
/Uw5AfwaKhjwILfvGzPG2663NeMCAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQUTqORBXwciZ5/3wEkeDVVWgZ1RuAwDgYDVR0PAQH/BAQDAgKEMA0G
CSqGSIb3DQEBCwUAA4IBAQAXEAoUsTn9JLy8ZrZWbNEZ4qb1/Nwv8Dz56LMAdgBd
tM66d020rDu8IUvazMqvJWez5D6BevXfH2qJn3gu5gB/RUI2w1jf68sEdTeIo/fV
vpK969h/txW5LrR5jLwlRYa3aQKw0gHSnwT/ZaoTC44R9LrlWYU/WewaztAtc3e6
nU1lT/eu37VNB4X+mi/tLDNR2dYiinwIOmmc+vbdK4ItYjtmHLQWdgsLhEWLrkBV
Dr7GGFXmK9gQKhH0yKZXDTfwMKhuePHyM678FXHGWyxcSrhUh+1/94DqF5ZYNt8d
H7xB7/rhtnyAdZNAErDScCOPdLjB6SgTl0ukXTDt2FT1
-----END CERTIFICATE-----`

const jwksUrl = 'https://test-endpoint.auth0.com/.well-known/jwks.json'

export async function handler(event) {
  try {
    const jwtToken = await verifyToken(event.authorizationToken)

    logger.info('jwtToken', jwtToken)
    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader) {
  const token = getToken(authHeader)
  // TODO: Implement token verification
  return jsonwebtoken.verify(token, certificate, { algorithms: ['RS256'] })
}

function getToken(authHeader) {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
