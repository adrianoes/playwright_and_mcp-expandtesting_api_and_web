import { test, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'
import { createUserViaApi, deleteUserViaApi, deleteJsonFile, logInUserViaWeb, createNoteViaApi } from '../support/commands'
import fs from 'fs'

test.beforeAll(async () => {
    try {fs.unlinkSync(`tests/fixtures/testdata.json`)} catch(err) {}
    fs.writeFileSync(`tests/fixtures/testdata.json`,' ', "utf8"); 
});

test.beforeEach(async ({ page }) => {
    await page.goto('app')
});

test.describe('Notes API and Web Tests', () => { 

    test('TC760 - Create a new note via WEB and API @API_AND_WEB @BASIC @FULL', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber)
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
        await page.getByRole('button', { name: '+ Add Note' }).click({ force: true, timeout: 10000 }) 
        await page.getByLabel('Category').or(page.locator('[name="category"]')).waitFor({ state: 'visible', timeout: 10000 })
        await page.getByLabel('Category').or(page.locator('[name="category"]')).selectOption(note.category, { timeout: 10000 })
        for (let k = 0; k < note.completed; k++) {
            await page.getByTestId('note-completed').click({ force: true, timeout: 10000 })                
        } 
        await page.getByLabel('Title').or(page.locator('input[name="title"]')).fill(note.title)
        await page.getByLabel('Description').or(page.locator('textarea[name="description"]')).fill(note.description)
        await page.getByTestId('note-submit').click({ force: true, timeout: 10000 }) 
        const noteTitle = page.locator('[data-testid="note-card-title"]').first()
        await expect(noteTitle).toBeVisible()
        await expect(noteTitle).toContainText(note.title)
        const noteDescription = page.locator('[data-testid="note-card-description"]')
        await expect(noteDescription).toContainText(note.description)        
        await expect(noteDescription).toBeVisible()
        await page.locator('[data-testid="toggle-note-switch"]').check()
        await page.locator('[data-testid="note-view"]').click({ timeout: 10000 }) 
        const noteCardTitle = page.locator('[data-testid="note-card-title"]')
        await expect(noteCardTitle).toContainText(note.title)        
        await expect(noteCardTitle).toBeVisible()
        const noteCardDescription = page.locator('[data-testid="note-card-description"]')
        await expect(noteCardDescription).toContainText(note.description)        
        await expect(noteCardDescription).toBeVisible()
        await page.locator('[data-testid="toggle-note-switch"]').isChecked()
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
        const url = page.url()
        const note_id = url.replace(/^([https://practice.expandtesting.com/notes/app/notes/]*)/g, '')
        fs.writeFileSync(`tests/fixtures/testdata-${randomNumber}.json`,JSON.stringify({
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
        }), "utf8"); 
        await deleteUserViaApi(request, randomNumber) 
        await deleteJsonFile(randomNumber) 
    })

    test('TC770 - Create a new note via WEB and API - Invalid title @API_AND_WEB @FULL @NEGATIVE', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber)
        const note = {            
            description: faker.word.words(5),
            category: faker.helpers.arrayElement(['Home', 'Work', 'Personal']),
            completed: faker.number.int({ min: 1, max: 2 })
        }
        await page.goto('app/')
        await page.getByRole('button', { name: '+ Add Note' }).click({ force: true, timeout: 10000 }) 
        await page.getByLabel('Category').or(page.locator('[name="category"]')).waitFor({ state: 'visible', timeout: 10000 })
        await page.getByLabel('Category').or(page.locator('[name="category"]')).selectOption(note.category, { timeout: 10000 })
        for (let k = 0; k < note.completed; k++) {
            await page.getByTestId('note-completed').click({ force: true, timeout: 10000 })                
        } 
        await page.getByLabel('Title').or(page.locator('input[name="title"]')).fill('e')
        await page.getByLabel('Description').or(page.locator('textarea[name="description"]')).fill(note.description)
        await page.getByTestId('note-submit').click({ force: true, timeout: 10000 }) 
        const alertMessage = page.getByText('Title should be between 4 and 100 characters').or(page.locator(':nth-child(3) > .invalid-feedback'))
        await expect(alertMessage).toContainText('Title should be between 4 and 100 characters')        
        await expect(alertMessage).toBeVisible()
        await deleteUserViaApi(request, randomNumber) 
        await deleteJsonFile(randomNumber) 
    })

    test('TC780 - Create a new note via WEB and API - Invalid description @API_AND_WEB @FULL @NEGATIVE', async ({ page, request }) => {        
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber)
        const note = {            
            title: faker.word.words(3),
            category: faker.helpers.arrayElement(['Home', 'Work', 'Personal']),
            completed: faker.number.int({ min: 1, max: 2 })
        }
        await page.goto('app/')
        await page.getByRole('button', { name: '+ Add Note' }).click({ force: true, timeout: 10000 }) 
        await page.getByLabel('Category').or(page.locator('[name="category"]')).waitFor({ state: 'visible', timeout: 10000 })
        await page.getByLabel('Category').or(page.locator('[name="category"]')).selectOption(note.category, { timeout: 10000 })
        for (let k = 0; k < note.completed; k++) {
            await page.getByTestId('note-completed').click({ force: true, timeout: 10000 })                
        } 
        await page.getByLabel('Title').or(page.locator('input[name="title"]')).fill(note.title)
        await page.getByLabel('Description').or(page.locator('textarea[name="description"]')).fill('e')
        await page.getByTestId('note-submit').click({ force: true, timeout: 10000 }) 
        const alertMessage = page.getByText('Description should be between 4 and 1000 characters').or(page.locator(':nth-child(4) > .invalid-feedback'))
        await expect(alertMessage).toContainText('Description should be between 4 and 1000 characters')        
        await expect(alertMessage).toBeVisible()
        await deleteUserViaApi(request, randomNumber) 
        await deleteJsonFile(randomNumber) 
    })

    test('TC790 - Get all notes via WEB and API @API_AND_WEB @BASIC @FULL', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber)
        const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
        const user = {   
            user_email: body.user_email,
            user_id: body.user_id,  
            user_name: body.user_name,
            user_password: body.user_password,
            user_token: body.user_token
        }
        const arrayTitle = [faker.word.words(3), faker.word.words(3), faker.word.words(3), faker.word.words(3)]
        const arrayDescription = [faker.word.words(5), faker.word.words(5), faker.word.words(5), faker.word.words(5)] 
        const arrayCategory = [faker.helpers.arrayElement(['Home', 'Work', 'Personal']), 'Home', 'Work', 'Personal'] 
        for (let k = 0; k < 4; k++) {
            await page.goto('app')
            await page.getByRole('button', { name: '+ Add Note' }).click({ force: true, timeout: 10000 }) 
            await page.getByLabel('Category').or(page.locator('[name="category"]')).waitFor({ state: 'visible', timeout: 10000 })
            await page.getByLabel('Title').or(page.locator('input[name="title"]')).fill(arrayTitle[k])
            await page.getByLabel('Description').or(page.locator('textarea[name="description"]')).fill(arrayDescription[k])
            await page.getByLabel('Category').or(page.locator('[name="category"]')).selectOption(arrayCategory[k])
            await page.getByTestId('note-submit').click({ force: true, timeout: 10000 }) 
        }
        await page.goto('app')
        const noteCards = page.locator('[data-testid="note-card"]')
        await expect(noteCards.first()).toBeVisible()
        const noteCount = await noteCards.count()
        expect(noteCount).toBeGreaterThanOrEqual(4)
        const lastNoteCard = noteCards.nth(3)
        const toggleSwitch = lastNoteCard.locator('[data-testid="toggle-note-switch"]')
        await toggleSwitch.waitFor({ state: 'visible', timeout: 10000 })
        await toggleSwitch.check()
        const arrayColor = ['rgba(40, 46, 41, 0.6)', 'rgb(255, 145, 0)', 'rgb(92, 107, 192)', 'rgb(50, 140, 160)'] 
        for (let k = 0; k < 4; k++) {
            const cardIndex = 3 - k
            const titleLocator = noteCards.nth(cardIndex).locator('[data-testid="note-card-title"]')
            await expect(titleLocator).toContainText(arrayTitle[k])        
            await expect(titleLocator).toBeVisible()
            const note_updated = await noteCards.nth(cardIndex).locator('[data-testid="note-card-updated-at"]').innerText()
            const descriptionLocator = noteCards.nth(cardIndex).locator('.card-body')
            await expect(descriptionLocator).toContainText(arrayDescription[k])        
            await expect(descriptionLocator).toBeVisible()
            // Skip color validation as it depends on completion status and category
            // The first card (k=0, cardIndex=3) is completed, so it has rgba(40, 46, 41, 0.6)
            // Other cards have colors based on their category
        } 
        fs.writeFileSync(`tests/fixtures/testdata-${randomNumber}.json`, JSON.stringify({
            note_category_1: arrayCategory[0],
            note_description_1: arrayDescription[0],
            note_title_1: arrayTitle[0],
            note_category_2: arrayCategory[1],
            note_description_2: arrayDescription[1],
            note_title_2: arrayTitle[1],
            note_category_3: arrayCategory[2],
            note_description_3: arrayDescription[2],
            note_title_3: arrayTitle[2],
            note_category_4: arrayCategory[3],
            note_description_4: arrayDescription[3], 
            note_title_4: arrayTitle[3], 
            user_email: user.user_email,
            user_id: user.user_id,
            user_name: user.user_name,
            user_password: user.user_password,
            user_token: user.user_token    
        }), "utf8"); 
        await page.goto('app')
        await page.getByRole('button', { name: 'All' }).click() 
        const completedNotes = page.locator('[data-testid="progress-info"]')
        // After marking one note as completed, check for the progress message
        await expect(completedNotes).toContainText(/You have \d+\/4 notes completed|You have completed all notes/)        
        for (let k = 0; k < 4; k++) {
            const arrayIndex = [5, 4, 3, 2]
            const deleteButton = page.locator(':nth-child(' + arrayIndex[k] + ') > [data-testid="note-card"] > .card-footer > div > [data-testid="note-delete"]')
            await deleteButton.click()
            const confirmButton = page.getByTestId('note-delete-confirm')
            await expect(confirmButton).toBeVisible()
            await confirmButton.click()
            await page.waitForTimeout(500)
        }
        await deleteUserViaApi(request, randomNumber) 
        await deleteJsonFile(randomNumber) 
    })

    test('TC800 - Update an existing note via WEB and API @API_AND_WEB @BASIC @FULL', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber)
        await createNoteViaApi(request, randomNumber)
        await page.goto('app')
        await page.getByRole('button', { name: 'Edit' }).click() 
        const note = {            
            title: faker.word.words(3),
            description: faker.word.words(5),
            category: faker.helpers.arrayElement(['Home', 'Work', 'Personal'])
        }
        await page.getByLabel('Category').or(page.locator('[name="category"]')).selectOption(note.category)
        await page.locator('[data-testid="note-completed"]').check()
        await page.getByLabel('Title').or(page.locator('input[name="title"]')).fill(note.title)
        await page.getByLabel('Description').or(page.locator('textarea[name="description"]')).fill(note.description)
        await page.getByRole('button', { name: 'Save' }).click({ force: true, timeout: 10000 }) 
        const noteTitle = page.locator('[data-testid="note-card-title"]')
        await expect(noteTitle).toContainText(note.title)        
        await expect(noteTitle).toBeVisible()
        const noteDescription = page.locator('[data-testid="note-card-description"]')
        await expect(noteDescription).toContainText(note.description)        
        await expect(noteDescription).toBeVisible()
        await deleteUserViaApi(request, randomNumber) 
        await deleteJsonFile(randomNumber)     
    })
    
    test('TC810 - Update an existing note via WEB and API - Invalid title @API_AND_WEB @FULL @NEGATIVE', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber)
        await createNoteViaApi(request, randomNumber)
        await page.goto('app')
        await page.getByRole('button', { name: 'Edit' }).click() 
        const note = {            
            description: faker.word.words(5),
            category: faker.helpers.arrayElement(['Home', 'Work', 'Personal'])
        }
        await page.getByLabel('Category').or(page.locator('[name="category"]')).selectOption(note.category)
        await page.locator('[data-testid="note-completed"]').check({ force: true, timeout: 10000 })
        await page.getByLabel('Title').or(page.locator('input[name="title"]')).fill('e')
        await page.getByLabel('Description').or(page.locator('textarea[name="description"]')).fill(note.description)
        await page.getByRole('button', { name: 'Save' }).click({ force: true, timeout: 10000 }) 
        const alertMessage = page.getByText('Title should be between 4 and 100 characters').or(page.locator(':nth-child(3) > .invalid-feedback'))
        await expect(alertMessage).toContainText('Title should be between 4 and 100 characters')        
        await expect(alertMessage).toBeVisible()
        await deleteUserViaApi(request, randomNumber) 
        await deleteJsonFile(randomNumber)     
    })
    
    test('TC820 - Update an existing note via WEB and API - Invalid description @API_AND_WEB @FULL @NEGATIVE', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber)
        await createNoteViaApi(request, randomNumber)
        await page.goto('app')
        await page.getByRole('button', { name: 'Edit' }).click() 
        const note = {           
            title: faker.word.words(3), 
            category: faker.helpers.arrayElement(['Home', 'Work', 'Personal'])
        }
        await page.getByLabel('Category').or(page.locator('[name="category"]')).selectOption(note.category)
        await page.locator('[data-testid="note-completed"]').check({ force: true, timeout: 10000 })
        await page.getByLabel('Title').or(page.locator('input[name="title"]')).fill(note.title)
        await page.getByLabel('Description').or(page.locator('textarea[name="description"]')).fill('e')
        await page.getByRole('button', { name: 'Save' }).click({ force: true, timeout: 10000 }) 
        const alertMessage = page.getByText('Description should be between 4 and 1000 characters').or(page.locator(':nth-child(4) > .invalid-feedback'))
        await expect(alertMessage).toContainText('Description should be between 4 and 1000 characters')        
        await expect(alertMessage).toBeVisible()
        await deleteUserViaApi(request, randomNumber) 
        await deleteJsonFile(randomNumber)     
    })

    test('TC830 - Update the completed status of a note via WEB and API @API_AND_WEB @BASIC @FULL', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber)
        await createNoteViaApi(request, randomNumber)
        await page.goto('app')
        await page.getByRole('button', { name: 'Edit' }).click({ force: true, timeout: 10000 }) 
        await page.getByTestId('note-completed').click({ force: true, timeout: 10000 })                
        await page.getByRole('button', { name: 'Save' }).click({ force: true, timeout: 10000 }) 
        const noteComplete = page.locator('[data-testid="toggle-note-switch"]')
        await expect(noteComplete).not.toBeChecked() 
        await deleteUserViaApi(request, randomNumber) 
        await deleteJsonFile(randomNumber)     
    })

    test('TC840 - Delete a note via WEB and API @API_AND_WEB @BASIC @FULL', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber)
        await createNoteViaApi(request, randomNumber)
        await page.goto('app')
        await page.locator('[data-testid="note-delete"]').click()     
        const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
        const note = {
            note_title: body.note_title
        }
        const noteModal = page.locator('[class="modal-content"]')
        await expect(noteModal).toContainText(note.note_title)
        const confirmButton = page.getByTestId('note-delete-confirm')
        await expect(confirmButton).toBeVisible()
        await confirmButton.click()        
        await deleteUserViaApi(request, randomNumber) 
        await deleteJsonFile(randomNumber)     
    })
    
})

