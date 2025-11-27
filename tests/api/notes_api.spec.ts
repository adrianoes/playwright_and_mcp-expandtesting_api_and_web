import { test, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'
import {
  createUserViaApi,
  logInUserViaApi,
  deleteUserViaApi,
  deleteJsonFile,
  createNoteViaApi,
  deleteNoteViaApi
} from '../support/commands'
import fs from 'fs'

const FIXTURE_DIR = 'tests/fixtures'
const baseFixturePath = `${FIXTURE_DIR}/testdata.json`
const fixturePath = (key: string) => `${FIXTURE_DIR}/testdata-${key}.json`

const readFixture = (key: string) => JSON.parse(fs.readFileSync(fixturePath(key), 'utf8'))
const updateFixture = (key: string, data: Record<string, unknown>) => {
  const current = readFixture(key)
  fs.writeFileSync(fixturePath(key), JSON.stringify({ ...current, ...data }), 'utf8')
}

const createAndLoginUser = async (request: any, key: string) => {
  await createUserViaApi(request, key)
  await logInUserViaApi(request, key)
  return readFixture(key)
}

test.beforeAll(async () => {
  try {
    fs.unlinkSync(baseFixturePath)
  } catch {
    // File didn't exist, ignore.
  }
  fs.writeFileSync(baseFixturePath, ' ', 'utf8')
})

test.describe('Notes API Tests', () => {
  test('TC210 - Create a new note via API @API @BASIC @FULL', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    const user = await createAndLoginUser(request, fixtureKey)
    const note = {
      category: faker.helpers.arrayElement(['Home', 'Work', 'Personal']),
      description: faker.word.words(5),
      title: faker.word.words(3)
    }

    const response = await request.post('api/notes', {
      headers: { 'X-Auth-Token': user.user_token },
      data: note
    })
    const body = await response.json()

    expect(response.status()).toEqual(200)
    expect(body.message).toEqual('Note successfully created')
    expect(body.data.category).toEqual(note.category)
    expect(body.data.description).toEqual(note.description)
    expect(body.data.title).toEqual(note.title)
    expect(body.data.user_id).toEqual(user.user_id)

    updateFixture(fixtureKey, {
      note_category: body.data.category,
      note_description: body.data.description,
      note_id: body.data.id,
      note_title: body.data.title,
      note_completed: body.data.completed ?? false
    })

    await deleteNoteViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC220 - Create a new note via API - Bad request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    const user = await createAndLoginUser(request, fixtureKey)

    const response = await request.post('api/notes', {
      headers: { 'X-Auth-Token': user.user_token },
      data: {
        category: 'invalid',
        description: faker.word.words(5),
        title: faker.word.words(3)
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(400)
    expect(body.message).toEqual('Category must be one of the categories: Home, Work, Personal')

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC230 - Create a new note via API - Unauthorized request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    const user = await createAndLoginUser(request, fixtureKey)

    const response = await request.post('api/notes', {
      headers: { 'X-Auth-Token': '@' + user.user_token },
      data: {
        category: faker.helpers.arrayElement(['Home', 'Work', 'Personal']),
        description: faker.word.words(5),
        title: faker.word.words(3)
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(401)
    expect(body.message).toEqual('Access token is not valid or has expired, you will need to login')

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC240 - Get all notes via API @API @BASIC @FULL', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createAndLoginUser(request, fixtureKey)
    await createNoteViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.get('api/notes', {
      headers: { 'X-Auth-Token': user.user_token }
    })
    const body = await response.json()

    expect(response.status()).toEqual(200)
    expect(body.message).toEqual('Notes successfully retrieved')
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)

    await deleteNoteViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC250 - Get all notes via API - Bad request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createAndLoginUser(request, fixtureKey)
    await createNoteViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.get('api/notes', {
      headers: {
        'X-Auth-Token': user.user_token,
        'x-content-format': 'badRequest'
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(400)
    expect(body.message).toEqual('Invalid X-Content-Format header, Only application/json is supported.')

    await deleteNoteViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC260 - Get all notes via API - Unauthorized request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createAndLoginUser(request, fixtureKey)
    await createNoteViaApi(request, fixtureKey)
    const user = readFixture(fixtureKey)

    const response = await request.get('api/notes', {
      headers: { 'X-Auth-Token': '@' + user.user_token }
    })
    const body = await response.json()

    expect(response.status()).toEqual(401)
    expect(body.message).toEqual('Access token is not valid or has expired, you will need to login')

    await deleteNoteViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC270 - Get note by ID via API @API @BASIC @FULL', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createAndLoginUser(request, fixtureKey)
    await createNoteViaApi(request, fixtureKey)
    const fixture = readFixture(fixtureKey)

    const response = await request.get(`api/notes/${fixture.note_id}`, {
      headers: { 'X-Auth-Token': fixture.user_token }
    })
    const body = await response.json()

    expect(response.status()).toEqual(200)
    expect(body.message).toEqual('Note successfully retrieved')
    expect(body.data.id).toEqual(fixture.note_id)
    expect(body.data.title).toEqual(fixture.note_title)
    expect(body.data.description).toEqual(fixture.note_description)
    expect(body.data.user_id).toEqual(fixture.user_id)

    await deleteNoteViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC280 - Get note by ID via API - Bad request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createAndLoginUser(request, fixtureKey)
    await createNoteViaApi(request, fixtureKey)
    const fixture = readFixture(fixtureKey)

    const response = await request.get(`api/notes/${fixture.note_id}`, {
      headers: {
        'X-Auth-Token': fixture.user_token,
        'x-content-format': 'badRequest'
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(400)
    expect(body.message).toEqual('Invalid X-Content-Format header, Only application/json is supported.')

    await deleteNoteViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC290 - Get note by ID via API - Unauthorized request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createAndLoginUser(request, fixtureKey)
    await createNoteViaApi(request, fixtureKey)
    const fixture = readFixture(fixtureKey)

    const response = await request.get(`api/notes/${fixture.note_id}`, {
      headers: { 'X-Auth-Token': '@' + fixture.user_token }
    })
    const body = await response.json()

    expect(response.status()).toEqual(401)
    expect(body.message).toEqual('Access token is not valid or has expired, you will need to login')

    await deleteNoteViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC300 - Update an existing note via API @API @BASIC @FULL', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createAndLoginUser(request, fixtureKey)
    await createNoteViaApi(request, fixtureKey)
    const fixture = readFixture(fixtureKey)
    const updatedNote = {
      category: fixture.note_category,
      completed: faker.helpers.arrayElement([true, false]),
      description: faker.word.words(5),
      title: faker.word.words(3)
    }

    const response = await request.put(`api/notes/${fixture.note_id}`, {
      headers: { 'X-Auth-Token': fixture.user_token },
      data: updatedNote
    })
    const body = await response.json()

    expect(response.status()).toEqual(200)
    expect(body.message).toEqual('Note successfully Updated')
    expect(body.data.description).toEqual(updatedNote.description)
    expect(body.data.title).toEqual(updatedNote.title)
    expect(body.data.completed).toEqual(updatedNote.completed)

    await deleteNoteViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC310 - Update an existing note via API - Bad request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createAndLoginUser(request, fixtureKey)
    await createNoteViaApi(request, fixtureKey)
    const fixture = readFixture(fixtureKey)

    const response = await request.put(`api/notes/${fixture.note_id}`, {
      headers: { 'X-Auth-Token': fixture.user_token },
      data: {
        category: 'invalid',
        completed: false,
        description: faker.word.words(5),
        title: faker.word.words(3)
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(400)
    expect(body.message).toEqual('Category must be one of the categories: Home, Work, Personal')

    await deleteNoteViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC320 - Update an existing note via API - Unauthorized request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createAndLoginUser(request, fixtureKey)
    await createNoteViaApi(request, fixtureKey)
    const fixture = readFixture(fixtureKey)

    const response = await request.put(`api/notes/${fixture.note_id}`, {
      headers: { 'X-Auth-Token': '@' + fixture.user_token },
      data: {
        category: fixture.note_category,
        completed: false,
        description: faker.word.words(5),
        title: faker.word.words(3)
      }
    })
    const body = await response.json()

    expect(response.status()).toEqual(401)
    expect(body.message).toEqual('Access token is not valid or has expired, you will need to login')

    await deleteNoteViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC330 - Update the completed status of a note via API @API @BASIC @FULL', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createAndLoginUser(request, fixtureKey)
    await createNoteViaApi(request, fixtureKey)
    const fixture = readFixture(fixtureKey)

    const response = await request.patch(`api/notes/${fixture.note_id}`, {
      headers: { 'X-Auth-Token': fixture.user_token },
      data: { completed: false }
    })
    const body = await response.json()

    expect(response.status()).toEqual(200)
    expect(body.message).toEqual('Note successfully Updated')
    expect(body.data.completed).toEqual(false)

    await deleteNoteViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC340 - Update the completed status of a note via API - Bad request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createAndLoginUser(request, fixtureKey)
    await createNoteViaApi(request, fixtureKey)
    const fixture = readFixture(fixtureKey)

    const response = await request.patch(`api/notes/${fixture.note_id}`, {
      headers: { 'X-Auth-Token': fixture.user_token },
      data: { completed: 'invalid' }
    })
    const body = await response.json()

    expect(response.status()).toEqual(400)
    expect(body.message).toEqual('Note completed status must be boolean')

    await deleteNoteViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC350 - Update the completed status of a note via API - Unauthorized request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createAndLoginUser(request, fixtureKey)
    await createNoteViaApi(request, fixtureKey)
    const fixture = readFixture(fixtureKey)

    const response = await request.patch(`api/notes/${fixture.note_id}`, {
      headers: { 'X-Auth-Token': '@' + fixture.user_token },
      data: { completed: false }
    })
    const body = await response.json()

    expect(response.status()).toEqual(401)
    expect(body.message).toEqual('Access token is not valid or has expired, you will need to login')

    await deleteNoteViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC360 - Delete a note by ID via API @API @BASIC @FULL', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createAndLoginUser(request, fixtureKey)
    await createNoteViaApi(request, fixtureKey)
    const fixture = readFixture(fixtureKey)

    const response = await request.delete(`api/notes/${fixture.note_id}`, {
      headers: { 'X-Auth-Token': fixture.user_token }
    })
    const body = await response.json()

    expect(response.status()).toEqual(200)
    expect(body.message).toEqual('Note successfully deleted')

    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC370 - Delete a note by ID via API - Bad request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createAndLoginUser(request, fixtureKey)
    await createNoteViaApi(request, fixtureKey)
    const fixture = readFixture(fixtureKey)

    const response = await request.delete(`api/notes/+${fixture.note_id}`, {
      headers: { 'X-Auth-Token': fixture.user_token }
    })
    const body = await response.json()

    expect(response.status()).toEqual(400)
    expect(body.message).toEqual('Note ID must be a valid ID')

    await deleteNoteViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })

  test('TC380 - Delete a note by ID via API - Unauthorized request @API @FULL @NEGATIVE', async ({ request }) => {
    const fixtureKey = faker.finance.creditCardNumber()
    await createAndLoginUser(request, fixtureKey)
    await createNoteViaApi(request, fixtureKey)
    const fixture = readFixture(fixtureKey)

    const response = await request.delete(`api/notes/${fixture.note_id}`, {
      headers: { 'X-Auth-Token': '@' + fixture.user_token }
    })
    const body = await response.json()

    expect(response.status()).toEqual(401)
    expect(body.message).toEqual('Access token is not valid or has expired, you will need to login')

    await deleteNoteViaApi(request, fixtureKey)
    await deleteUserViaApi(request, fixtureKey)
    await deleteJsonFile(fixtureKey)
  })
})

