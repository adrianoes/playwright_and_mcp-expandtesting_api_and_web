import { test, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'
import { createUserViaApi, logInUserViaApi, deleteUserViaApi, deleteJsonFile } from '../support/commands'
import fs from 'fs'

const FIXTURE_DIR = 'tests/fixtures'

const fixturePath = (key: string) => `${FIXTURE_DIR}/testdata-${key}.json`

const readFixture = (key: string) => JSON.parse(fs.readFileSync(fixturePath(key), 'utf8'))

test.beforeAll(async () => {
  try {
    fs.unlinkSync(`${FIXTURE_DIR}/testdata.json`)
  } catch {
    // File didn't exist, which is fine because we'll recreate it.
  }
  fs.writeFileSync(`${FIXTURE_DIR}/testdata.json`, ' ', 'utf8')
})

test.describe('Users API Tests', () => {
  test('TC010 - Create a New User via API @API @BASIC @FULL', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    const user = {
      user_name: faker.person.fullName(),
      user_email: faker.internet.exampleEmail().toLowerCase(),
      user_password: faker.internet.password({ length: 8 })
    }

    const response = await request.post('api/users/register', {
      data: {
        name: user.user_name,
        email: user.user_email,
        password: user.user_password
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(201)
    expect(body.success).toBe(true)
    expect(body.status).toEqual(201)
    expect(body.message).toEqual('User account created successfully')
    expect(body.data.id).toBeDefined()
    expect(body.data.email).toEqual(user.user_email)
    expect(body.data.name).toEqual(user.user_name)

    fs.writeFileSync(fixturePath(fixtureKey), JSON.stringify({
      user_email: user.user_email,
      user_id: body.data.id,
      user_name: user.user_name,
      user_password: user.user_password
    }), 'utf8')

    await logInUserViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC020 - Create a New User via API - Bad request @API @FULL @NEGATIVE', async ({ request }) => {
    const user = {
      user_name: faker.person.fullName(),
      user_email: faker.internet.exampleEmail().toLowerCase(),
      user_password: faker.internet.password({ length: 8 })
    }

    const response = await request.post('api/users/register', {
      data: {
        name: user.user_name,
        email: '@' + user.user_email,
        password: user.user_password
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(400)
    expect(body.message).toEqual('A valid email address is required')
  })

  test('TC030 - Log in as an existing user via API @API @BASIC @FULL', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.post('api/users/login', {
      data: {
        email: user.user_email,
        password: user.user_password
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(200)
    expect(body.message).toEqual('Login successful')
    expect(body.data.email).toEqual(user.user_email)
    expect(body.data.id).toEqual(user.user_id)
    expect(body.data.name).toEqual(user.user_name)

    fs.writeFileSync(fixturePath(fixtureKey), JSON.stringify({
      user_email: user.user_email,
      user_id: user.user_id,
      user_name: user.user_name,
      user_password: user.user_password,
      user_token: body.data.token
    }), 'utf8')

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC040 - Log in as an existing user via API - Bad request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.post('api/users/login', {
      data: {
        email: '@' + user.user_email,
        password: user.user_password
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(400)
    expect(body.message).toEqual('A valid email address is required')

    await logInUserViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC050 - Log in as an existing user via API - Unauthorized request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.post('api/users/login', {
      data: {
        email: user.user_email,
        password: '@' + user.user_password
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(401)
    expect(body.message).toEqual('Incorrect email address or password')

    await logInUserViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC060 - Retrieve user profile information via API @API @BASIC @FULL', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    await logInUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.get('api/users/profile', {
      headers: { 'X-Auth-Token': user.user_token }
    })
    const body = await response.json()

    expect(response.status()).toEqual(200)
    expect(body.message).toEqual('Profile successful')
    expect(body.data.email).toEqual(user.user_email)
    expect(body.data.id).toEqual(user.user_id)
    expect(body.data.name).toEqual(user.user_name)

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC070 - Retrieve user profile information via API - Bad request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    await logInUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.get('api/users/profile', {
      headers: {
        'X-Auth-Token': user.user_token,
        'x-content-format': 'badRequest'
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(400)
    expect(body.message).toEqual('Invalid X-Content-Format header, Only application/json is supported.')

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC080 - Retrieve user profile information via API - Unauthorized request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    await logInUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.get('api/users/profile', {
      headers: { 'X-Auth-Token': '@' + user.user_token }
    })
    const body = await response.json()

    expect(response.status()).toEqual(401)
    expect(body.message).toEqual('Access token is not valid or has expired, you will need to login')

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC090 - Update the user profile information via API @API @BASIC @FULL', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    await logInUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const updatedUser = {
      name: faker.person.fullName(),
      phone: faker.string.numeric({ length: 12 }),
      company: faker.internet.username()
    }

    const response = await request.patch('api/users/profile', {
      headers: { 'X-Auth-Token': user.user_token },
      data: {
        name: updatedUser.name,
        phone: updatedUser.phone,
        company: updatedUser.company
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(200)
    expect(body.message).toEqual('Profile updated successful')
    expect(body.data.email).toEqual(user.user_email)
    expect(body.data.id).toEqual(user.user_id)
    expect(body.data.name).toEqual(updatedUser.name)
    expect(body.data.phone).toEqual(updatedUser.phone)
    expect(body.data.company).toEqual(updatedUser.company)

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC100 - Update the user profile information via API - Bad request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    await logInUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.patch('api/users/profile', {
      headers: { 'X-Auth-Token': user.user_token },
      data: {
        name: '6@#',
        phone: faker.string.numeric({ length: 12 }),
        company: faker.internet.username()
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(400)
    expect(body.message).toEqual('User name must be between 4 and 30 characters')

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC110 - Update the user profile information via API - Unauthorized request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    await logInUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.patch('api/users/profile', {
      headers: { 'X-Auth-Token': '@' + user.user_token },
      data: {
        name: faker.person.fullName(),
        phone: faker.string.numeric({ length: 12 }),
        company: faker.internet.username()
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(401)
    expect(body.message).toEqual('Access token is not valid or has expired, you will need to login')

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC120 - Change a user\'s password via API @API @BASIC @FULL', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    await logInUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)
    const newPassword = faker.internet.password({ length: 8 })

    const response = await request.post('api/users/change-password', {
      headers: { 'X-Auth-Token': user.user_token },
      data: {
        currentPassword: user.user_password,
        newPassword: newPassword
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(200)
    expect(body.message).toEqual('The password was successfully updated')
    expect(user.user_password).not.toEqual(newPassword)

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC130 - Change a user\'s password via API - Bad request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    await logInUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.post('api/users/change-password', {
      headers: { 'X-Auth-Token': user.user_token },
      data: {
        currentPassword: user.user_password,
        newPassword: '123'
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(400)
    expect(body.message).toEqual('New password must be between 6 and 30 characters')

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC140 - Change a user\'s password via API - Unauthorized request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    await logInUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)
    const newPassword = faker.internet.password({ length: 8 })

    const response = await request.post('api/users/change-password', {
      headers: { 'X-Auth-Token': '@' + user.user_token },
      data: {
        currentPassword: user.user_password,
        newPassword: newPassword
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(401)
    expect(body.message).toEqual('Access token is not valid or has expired, you will need to login')

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC150 - Log out a user via API @API @BASIC @FULL', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    await logInUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.delete('api/users/logout', {
      headers: { 'X-Auth-Token': user.user_token }
    })
    const body = await response.json()

    expect(response.status()).toEqual(200)
    expect(body.message).toEqual('User has been successfully logged out')

    await logInUserViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC160 - Log out a user via API - Bad request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    await logInUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.delete('api/users/logout', {
      headers: {
        'X-Auth-Token': user.user_token,
        'x-content-format': 'badRequest'
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(400)
    expect(body.message).toEqual('Invalid X-Content-Format header, Only application/json is supported.')

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC170 - Log out a user via API - Unauthorized request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    await logInUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.delete('api/users/logout', {
      headers: { 'X-Auth-Token': '@' + user.user_token }
    })
    const body = await response.json()

    expect(response.status()).toEqual(401)
    expect(body.message).toEqual('Access token is not valid or has expired, you will need to login')

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC180 - Delete user account via API @API @BASIC @FULL', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    await logInUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.delete('api/users/delete-account', {
      headers: { 'X-Auth-Token': user.user_token }
    })
    const body = await response.json()

    expect(response.status()).toEqual(200)
    expect(body.message).toEqual('Account successfully deleted')

    await deleteJsonFile(fixtureKey)
  })

  test('TC190 - Delete user account via API - Bad request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    await logInUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.delete('api/users/delete-account', {
      headers: {
        'X-Auth-Token': user.user_token,
        'x-content-format': 'badRequest'
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(400)
    expect(body.message).toEqual('Invalid X-Content-Format header, Only application/json is supported.')

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC200 - Delete user account via API - Unauthorized request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createUserViaApi(request, fixtureKey)
    await logInUserViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.delete('api/users/delete-account', {
      headers: { 'X-Auth-Token': '@' + user.user_token }
    })
    const body = await response.json()

    expect(response.status()).toEqual(401)
    expect(body.message).toEqual('Access token is not valid or has expired, you will need to login')

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })
})