import { APIRequestContext, expect, Page } from '@playwright/test'
import { faker } from '@faker-js/faker'
import fs from 'fs'

export async function getFullFilledResponseCU(page: Page) {
    return page.waitForResponse('/notes/api/users/register')
}

export async function getFullFilledResponseLogIn(page: Page) {
    return page.waitForResponse('/notes/api/users/login', { timeout: 60000 })
}

export async function logInUserViaWeb(page: Page, randomNumber: string) {
    const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
    const user = {
        user_email: body.user_email,
        user_id: body.user_id,
        user_name: body.user_name,
        user_password: body.user_password
    }
    await page.goto('app/login')
    await page.getByTestId('login-email').fill(user.user_email)
    await page.getByTestId('login-password').fill(user.user_password)
    const responsePromise = getFullFilledResponseLogIn(page)
    await page.getByRole('button', { name: 'Login' }).click()
    const response = await responsePromise
    const responseBody = await response.json()
    await page.goto('app/profile')
    const userEmail = page.locator('[data-testid="user-email"]')
    await expect(userEmail).toHaveValue(user.user_email)        
    await expect(userEmail).toBeVisible()
    const userId = page.locator('[data-testid="user-id"]')
    await expect(userId).toHaveValue(user.user_id)        
    await expect(userId).toBeVisible()
    const userName = page.locator('[data-testid="user-name"]')
    await expect(userName).toHaveValue(user.user_name)        
    await expect(userName).toBeVisible()    
    fs.writeFileSync(`tests/fixtures/testdata-${randomNumber}.json`,JSON.stringify({
        user_email: user.user_email,
        user_id: user.user_id,
        user_name: user.user_name,
        user_password: user.user_password,
        user_token: responseBody.data.token
    }), "utf8");
}

export async function deleteJsonFile(randomNumber: string) {
    try {fs.unlinkSync(`tests/fixtures/testdata-${randomNumber}.json`)} catch(err) {throw err}
}

export async function deleteUserViaWeb(page: Page) {
    await page.goto('app/profile', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.getByRole('button', { name: 'Delete Account' }).click()
    // Wait for modal to appear and button to be clickable
    const confirmButton = page.getByTestId('note-delete-confirm')
    await confirmButton.waitFor({ state: 'visible', timeout: 10000 })
    await confirmButton.waitFor({ state: 'attached', timeout: 10000 })
    // Force click if needed
    await confirmButton.click({ force: true })
    // Wait for navigation to login page after deletion
    await page.waitForURL(/.*\/login/, { timeout: 60000 })
    // Wait for alert message to appear on login page
    const alertMessage = page.getByTestId('alert-message')
    await expect(alertMessage).toContainText('Your account has been deleted. You should create a new account to continue.')
    await expect(alertMessage).toBeVisible()
}

export async function createUserViaWeb(page: Page, randomNumber: string) {
    const user = {
        user_name: faker.person.fullName(),
        user_email: faker.internet.exampleEmail().toLowerCase(),
        user_password: faker.internet.password({ length: 8 })
    }
    await page.goto('app/register', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.getByTestId('register-email').fill(user.user_email)
    await page.getByTestId('register-name').fill(user.user_name)
    await page.getByTestId('register-password').fill(user.user_password)
    await page.getByTestId('register-confirm-password').fill(user.user_password)
    const responsePromise = getFullFilledResponseCU(page)
    await page.getByRole('button', { name: 'Register' }).click()
    const response = await responsePromise
    const responseBody = await response.json()
    await expect(page).toHaveTitle('Notes React Application for Automation Testing Practice')
    const userRegistered = page.getByText('User account created successfully')
    await expect(userRegistered).toContainText('User account created successfully')        
    await expect(userRegistered).toBeVisible() 
    fs.writeFileSync(`tests/fixtures/testdata-${randomNumber}.json`,JSON.stringify({
        user_email: user.user_email,
        user_id: responseBody.data.id,
        user_name: user.user_name,                
        user_password: user.user_password        
    }), "utf8"); 
}

// API Commands
export async function createUserViaApi(request: APIRequestContext, randomNumber: string) {
    const user = {
        user_email: faker.internet.exampleEmail().toLowerCase(),
        user_name: faker.person.fullName(),
        user_password: faker.internet.password({ length: 8 })
    }
    const responseCU = await request.post(`api/users/register`, {
        data: {
            name: user.user_name,
            email: user.user_email,
            password: user.user_password
        }
    })
    const responseBodyCU = await responseCU.json()
    expect(responseBodyCU.data.email).toEqual(user.user_email)
    expect(responseBodyCU.data.name).toEqual(user.user_name)
    expect(responseBodyCU.message).toEqual('User account created successfully')
    expect(responseCU.status()).toEqual(201)
    console.log(responseBodyCU.message)
    fs.writeFileSync(`tests/fixtures/testdata-${randomNumber}.json`, JSON.stringify({
        user_email: user.user_email,
        user_id: responseBodyCU.data.id,
        user_name: user.user_name,
        user_password: user.user_password
    }), 'utf8')
}

export async function logInUserViaApi(request: APIRequestContext, randomNumber: string) {
    const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
    const user = {
        user_email: body.user_email,
        user_id: body.user_id,
        user_name: body.user_name,
        user_password: body.user_password
    }
    const responseLU = await request.post(`api/users/login`, {
        data: {
            email: user.user_email,
            password: user.user_password
        }
    });
    const responseBodyLU = await responseLU.json()
    expect(responseBodyLU.data.email).toEqual(user.user_email)
    expect(responseBodyLU.data.id).toEqual(user.user_id)
    expect(responseBodyLU.data.name).toEqual(user.user_name) 
    expect(responseBodyLU.message).toEqual('Login successful')
    expect(responseLU.status()).toEqual(200)    
    console.log(responseBodyLU.message)   
    fs.writeFileSync(`tests/fixtures/testdata-${randomNumber}.json`,JSON.stringify({
        user_email: user.user_email,
        user_id: user.user_id,
        user_name: user.user_name,
        user_password: user.user_password,
        user_token: responseBodyLU.data.token
    }), "utf8");
}

export async function deleteUserViaApi(request: APIRequestContext, randomNumber: string) {
    const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
    const user_token = body.user_token
    const responseDU = await request.delete(`api/users/delete-account`,{
        headers: { 'X-Auth-Token': user_token }
    })
    const responseBodyDU = await responseDU.json()
    expect(responseBodyDU.message).toEqual('Account successfully deleted')
    expect(responseDU.status()).toEqual(200)
    console.log(responseBodyDU.message)
}

export async function createNoteViaApi(request: APIRequestContext, randomNumber: string) {
    const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, 'utf8'))
    const user = {
        user_token: body.user_token,
        user_id: body.user_id
    }
    if (!user.user_token) {
        throw new Error('User token is required to create a note. Make sure logInUserViaApi was executed.')
    }
    const note = {
        note_title: faker.word.words(3),
        note_description: faker.word.words(5),
        note_category: faker.helpers.arrayElement(['Home', 'Work', 'Personal'])
    }
    const response = await request.post(`api/notes`, {
        headers: { 'X-Auth-Token': user.user_token },
        data: {
            category: note.note_category,
            description: note.note_description,
            title: note.note_title
        }
    })
    const responseBody = await response.json()
    expect(responseBody.data.category).toEqual(note.note_category)
    expect(responseBody.data.description).toEqual(note.note_description)
    expect(responseBody.data.title).toEqual(note.note_title)
    expect(responseBody.data.user_id).toEqual(user.user_id)
    expect(responseBody.message).toEqual('Note successfully created')
    expect(response.status()).toEqual(200)
    console.log(responseBody.message)
    fs.writeFileSync(`tests/fixtures/testdata-${randomNumber}.json`, JSON.stringify({
        ...body,
        note_category: responseBody.data.category,
        note_completed: responseBody.data.completed ?? false,
        note_description: responseBody.data.description,
        note_id: responseBody.data.id,
        note_title: responseBody.data.title
    }), 'utf8')
}

export async function deleteNoteViaApi(request: APIRequestContext, randomNumber: string) {
    const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, 'utf8'))
    const note_id = body.note_id
    const user_token = body.user_token
    if (!note_id) {
        throw new Error('Note ID is required to delete a note. Make sure a note was created first.')
    }
    const response = await request.delete(`api/notes/${note_id}`, {
        headers: { 'X-Auth-Token': user_token }
    })
    const responseBody = await response.json()
    expect(responseBody.message).toEqual('Note successfully deleted')
    expect(response.status()).toEqual(200)
    console.log(responseBody.message)
    const {
        note_category: _noteCategory,
        note_completed: _noteCompleted,
        note_description: _noteDescription,
        note_title: _noteTitle,
        note_id: _noteId,
        ...rest
    } = body
    fs.writeFileSync(`tests/fixtures/testdata-${randomNumber}.json`, JSON.stringify(rest), 'utf8')
}

export async function createNoteViaWeb(page: Page, randomNumber: string) {
    const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
    const user = {
        user_email: body.user_email,
        user_id: body.user_id,
        user_name: body.user_name,
        user_password: body.user_password,
        user_token: body.user_token
    }
    const note = {
        title: faker.word.words(3),
        description: faker.word.words(5),
        category: faker.helpers.arrayElement(['Home', 'Work', 'Personal']),
        completed: faker.number.int({ min: 1, max: 2 })
    }
    await page.goto('app/')
    await page.getByRole('button', { name: '+ Add Note' }).click()
    await page.getByLabel('Category').or(page.locator('[name="category"]')).selectOption(note.category)
    //Playwright has no support for click(n times), so we create a for with max random limit
    for (let k = 0; k < note.completed; k++) {
        await page.getByTestId('note-completed').click()
    }
    await page.getByLabel('Title').or(page.locator('input[name="title"]')).fill(note.title)
    await page.getByLabel('Description').or(page.locator('textarea[name="description"]')).fill(note.description)
    await page.getByRole('button', { name: 'Create' }).click({ force: true, timeout: 10000 })
    // Wait for note to be created and appear on the page
    const noteTitle = page.getByTestId('note-card-title')
    await expect(noteTitle).toBeVisible()
    await expect(noteTitle).toContainText(note.title)
    const noteDescription = page.getByTestId('note-card-description')
    await expect(noteDescription).toContainText(note.description)
    await expect(noteDescription).toBeVisible()
    await page.getByTestId('toggle-note-switch').check()
    await page.getByTestId('note-view').click()
    const noteCardTitle = page.getByTestId('note-card-title')
    await expect(noteCardTitle).toContainText(note.title)
    await expect(noteCardTitle).toBeVisible()
    const noteCardDescription = page.getByTestId('note-card-description')
    await expect(noteCardDescription).toContainText(note.description)
    await expect(noteCardDescription).toBeVisible()
    await page.getByTestId('toggle-note-switch').isChecked()
    //To get rid of the iframe, reload() was used here
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
    const url = page.url()
    const note_id = url.replace(/^([https://practice.expandtesting.com/notes/app/notes/]*)/g, '')
    fs.writeFileSync(`tests/fixtures/testdata-${randomNumber}.json`, JSON.stringify({
        note_id: note_id,
        note_category: note.category,
        note_completed: note.completed,
        note_description: note.description,
        note_title: note.title,
        user_email: user.user_email,
        user_id: user.user_id,
        user_name: user.user_name,
        user_password: user.user_password,
        user_token: user.user_token
    }), "utf8")
}

export async function deleteNoteViaWeb(page: Page, randomNumber: string) {
    await page.goto('app/')
    await page.locator('[data-testid="note-delete"]').click()
    const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
    const note = {
        note_title: body.note_title
    }
    const noteModal = page.locator('[class="modal-content"]')
    await expect(noteModal).toContainText(note.note_title)
    await page.locator('[data-testid="note-delete-confirm"]').click()
    const {
        note_category: _noteCategory,
        note_completed: _noteCompleted,
        note_description: _noteDescription,
        note_title: _noteTitle,
        note_id: _noteId,
        ...rest
    } = body
    fs.writeFileSync(`tests/fixtures/testdata-${randomNumber}.json`, JSON.stringify(rest), "utf8")
}

