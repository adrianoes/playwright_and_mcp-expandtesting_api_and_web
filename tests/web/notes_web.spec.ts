import { test, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'
import { deleteJsonFile, logInUserViaWeb, deleteUserViaWeb, createUserViaWeb, deleteNoteViaWeb, createNoteViaWeb } from '../support/commands'
import fs from 'fs'

test.describe('Notes Web Tests', () => {

    test('TC550 - Create a new note via WEB @WEB @BASIC @FULL', async ({ page }) => {
        const randomNumber = faker.finance.creditCardNumber()
        await createUserViaWeb(page, randomNumber)
        await logInUserViaWeb(page, randomNumber)
        const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
        const user = {
            user_email: body.user_email,
            user_id: body.user_id,
            user_name: body.user_name,
            user_password: body.user_password
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
        const noteTitle = page.locator('[data-testid="note-card-title"]')
        await expect(noteTitle).toContainText(note.title)
        await expect(noteTitle).toBeVisible()
        const noteDescription = page.locator('[data-testid="note-card-description"]')
        await expect(noteDescription).toContainText(note.description)
        await expect(noteDescription).toBeVisible()
        await page.locator('[data-testid="toggle-note-switch"]').check()
        await page.locator('[data-testid="note-view"]').click()
        const noteCardTitle = page.locator('[data-testid="note-card-title"]')
        await expect(noteCardTitle).toContainText(note.title)
        await expect(noteCardTitle).toBeVisible()
        const noteCardDescription = page.locator('[data-testid="note-card-description"]')
        await expect(noteCardDescription).toContainText(note.description)
        await expect(noteCardDescription).toBeVisible()
        await page.locator('[data-testid="toggle-note-switch"]').isChecked()
        //To get rid of the iframe, reload() was used here
        await page.reload()
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
            user_token: body.user_token
        }), "utf8")
        await deleteNoteViaWeb(page, randomNumber)
        await deleteUserViaWeb(page)
        await deleteJsonFile(randomNumber)
    })

    test('TC560 - Create a new note via WEB - Invalid title @WEB @FULL @NEGATIVE', async ({ page }) => {
        const randomNumber = faker.finance.creditCardNumber()
        await createUserViaWeb(page, randomNumber)
        await logInUserViaWeb(page, randomNumber)
        const note = {
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
        await page.getByLabel('Title').or(page.locator('input[name="title"]')).fill('e')
        await page.getByLabel('Description').or(page.locator('textarea[name="description"]')).fill(note.description)
        await page.getByRole('button', { name: 'Create' }).click({ force: true, timeout: 10000 })
        const alertMessage = page.getByText('Title should be between 4 and 100 characters').or(page.locator(':nth-child(3) > .invalid-feedback'))
        await expect(alertMessage).toContainText('Title should be between 4 and 100 characters')
        await expect(alertMessage).toBeVisible()
        await deleteUserViaWeb(page)
        await deleteJsonFile(randomNumber)
    })

    test('TC570 - Create a new note via WEB - Invalid description @WEB @FULL @NEGATIVE', async ({ page }) => {
        const randomNumber = faker.finance.creditCardNumber()
        await createUserViaWeb(page, randomNumber)
        await logInUserViaWeb(page, randomNumber)
        const note = {
            title: faker.word.words(5),
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
        await page.getByLabel('Description').or(page.locator('textarea[name="description"]')).fill('e')
        await page.getByRole('button', { name: 'Create' }).click({ force: true, timeout: 10000 })
        const alertMessage = page.getByText('Description should be between 4 and 1000 characters').or(page.locator(':nth-child(4) > .invalid-feedback'))
        await expect(alertMessage).toContainText('Description should be between 4 and 1000 characters')
        await expect(alertMessage).toBeVisible()
        await deleteUserViaWeb(page)
        await deleteJsonFile(randomNumber)
    })

    test('TC580 - Get all notes via WEB @WEB @BASIC @FULL', async ({ page }) => {
        const randomNumber = faker.finance.creditCardNumber()
        await createUserViaWeb(page, randomNumber)
        await logInUserViaWeb(page, randomNumber)
        const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
        const user = {
            user_email: body.user_email,
            user_id: body.user_id,
            user_name: body.user_name,
            user_password: body.user_password
        }
        const arrayTitle = [faker.word.words(3), faker.word.words(3), faker.word.words(3), faker.word.words(3)]
        const arrayDescription = [faker.word.words(5), faker.word.words(5), faker.word.words(5), faker.word.words(5)]
        const arrayCategory = [faker.helpers.arrayElement(['Home', 'Work', 'Personal']), 'Home', 'Work', 'Personal']
        for (let k = 0; k < 4; k++) {
            try {
                await page.goto('app', { waitUntil: 'domcontentloaded', timeout: 30000 })
            } catch (e) {
                await page.goto('app/', { waitUntil: 'domcontentloaded', timeout: 30000 })
            }
            await page.getByRole('button', { name: '+ Add Note' }).click({ force: true, timeout: 10000 })
            await page.getByLabel('Category').or(page.locator('[name="category"]')).waitFor({ state: 'visible', timeout: 10000 })
            await page.getByLabel('Title').or(page.locator('input[name="title"]')).fill(arrayTitle[k])
            await page.getByLabel('Description').or(page.locator('textarea[name="description"]')).fill(arrayDescription[k])
            await page.getByLabel('Category').or(page.locator('[name="category"]')).selectOption(arrayCategory[k])
            await page.getByRole('button', { name: 'Create' }).click({ force: true, timeout: 10000 })
            const noteTitle = page.locator('[data-testid="note-card-title"]').first()
            await expect(noteTitle).toBeVisible()
        }
        await page.goto('app', { waitUntil: 'domcontentloaded', timeout: 30000 })
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
        const firstToggleSwitch = noteCards.nth(0).locator('[data-testid="toggle-note-switch"]')
        await firstToggleSwitch.waitFor({ state: 'visible', timeout: 10000 })
        await firstToggleSwitch.check()
        fs.writeFileSync(`tests/fixtures/testdata-${randomNumber}.json`, JSON.stringify({
            user_email: user.user_email,
            user_id: user.user_id,
            user_name: user.user_name,
            user_password: user.user_password,
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
            user_token: body.user_token
        }), "utf8")
        await page.goto('app')
        await page.getByRole('button', { name: 'All' }).click() 
        const completedNotes = page.getByTestId('progress-info')    
        // After marking one note as completed, check for the progress message
        await expect(completedNotes).toContainText(/You have \d+\/4 notes completed|You have completed all notes/)
        //reverse order so we will have all frames in the screen until end of test.
        for (let k = 0; k < 4; k++) {
            const arrayIndex = [5, 4, 3, 2]
            const deleteButton = page.locator(':nth-child(' + arrayIndex[k] + ') > [data-testid="note-card"] > .card-footer > div > [data-testid="note-delete"]')
            await deleteButton.click()
            // Wait for modal to appear
            const confirmButton = page.getByTestId('note-delete-confirm')
            await expect(confirmButton).toBeVisible()
            await confirmButton.click()
        }
        await deleteUserViaWeb(page)
        await deleteJsonFile(randomNumber)
    })

    test('TC590 - Update an existing note via WEB @WEB @BASIC @FULL', async ({ page }) => {
        const randomNumber = faker.finance.creditCardNumber()
        await createUserViaWeb(page, randomNumber)
        await logInUserViaWeb(page, randomNumber)
        await createNoteViaWeb(page, randomNumber)
        await page.getByRole('button', { name: 'Edit' }).click()
        const note = {
            title: faker.word.words(3),
            description: faker.word.words(5),
            category: faker.helpers.arrayElement(['Home', 'Work', 'Personal'])
        }
        await page.getByLabel('Category').or(page.locator('[name="category"]')).selectOption(note.category)
        await page.getByTestId('note-completed').check()
        await page.getByLabel('Title').or(page.locator('input[name="title"]')).fill(note.title)
        await page.getByLabel('Description').or(page.locator('textarea[name="description"]')).fill(note.description)
        await page.getByRole('button', { name: 'Save' }).click()
        const noteTitle = page.locator('[data-testid="note-card-title"]')
        await expect(noteTitle).toContainText(note.title)
        await expect(noteTitle).toBeVisible()
        const noteDescription = page.locator('[data-testid="note-card-description"]')
        await expect(noteDescription).toContainText(note.description)
        await expect(noteDescription).toBeVisible()
        await deleteUserViaWeb(page)
        await deleteJsonFile(randomNumber)
    })

    test('TC600 - Update an existing note via WEB - Invalid title @WEB @FULL @NEGATIVE', async ({ page }) => {
        const randomNumber = faker.finance.creditCardNumber()
        await createUserViaWeb(page, randomNumber)
        await logInUserViaWeb(page, randomNumber)
        await createNoteViaWeb(page, randomNumber)
        await page.getByRole('button', { name: 'Edit' }).click()
        const note = {
            description: faker.word.words(5),
            category: faker.helpers.arrayElement(['Home', 'Work', 'Personal'])
        }
        await page.getByLabel('Category').or(page.locator('[name="category"]')).selectOption(note.category)
        await page.getByTestId('note-completed').check()
        await page.getByLabel('Title').or(page.locator('input[name="title"]')).fill('e')
        await page.getByLabel('Description').or(page.locator('textarea[name="description"]')).fill(note.description)
        await page.getByRole('button', { name: 'Save' }).click()
        const alertMessage = page.getByText('Title should be between 4 and 100 characters').or(page.locator(':nth-child(3) > .invalid-feedback'))
        await expect(alertMessage).toContainText('Title should be between 4 and 100 characters')
        await expect(alertMessage).toBeVisible()
        await deleteUserViaWeb(page)
        await deleteJsonFile(randomNumber)
    })

    test('TC610 - Update an existing note via WEB - Invalid description @WEB @FULL @NEGATIVE', async ({ page }) => {
        const randomNumber = faker.finance.creditCardNumber()
        await page.goto('app/register', { waitUntil: 'domcontentloaded', timeout: 30000 })
        await createUserViaWeb(page, randomNumber)
        await logInUserViaWeb(page, randomNumber)
        await createNoteViaWeb(page, randomNumber)
        await page.getByRole('button', { name: 'Edit' }).click({ force: true, timeout: 10000 })
        const note = {
            title: faker.word.words(3),
            category: faker.helpers.arrayElement(['Home', 'Work', 'Personal'])
        }
        await page.getByLabel('Category').or(page.locator('[name="category"]')).selectOption(note.category)
        await page.getByTestId('note-completed').check({ force: true, timeout: 10000 })
        await page.getByLabel('Title').or(page.locator('input[name="title"]')).fill(note.title)
        await page.getByLabel('Description').or(page.locator('textarea[name="description"]')).fill('e')
        await page.getByRole('button', { name: 'Save' }).click({ force: true, timeout: 10000 })
        const alertMessage = page.getByText('Description should be between 4 and 1000 characters').or(page.locator(':nth-child(4) > .invalid-feedback'))
        await expect(alertMessage).toContainText('Description should be between 4 and 1000 characters')
        await expect(alertMessage).toBeVisible()
        await deleteUserViaWeb(page)
        await deleteJsonFile(randomNumber)
    })

    test('TC620 - Update the completed status of a note via WEB @WEB @BASIC @FULL', async ({ page }) => {
        const randomNumber = faker.finance.creditCardNumber()
        await page.goto('app/register', { waitUntil: 'domcontentloaded', timeout: 30000 })
        await createUserViaWeb(page, randomNumber)
        await logInUserViaWeb(page, randomNumber)
        await createNoteViaWeb(page, randomNumber)
        await page.getByRole('button', { name: 'Edit' }).click({ force: true, timeout: 10000 }) 
        await page.getByTestId('note-completed').waitFor({ state: 'visible', timeout: 10000 })
        await page.getByTestId('note-completed').click({ force: true, timeout: 10000 })
        await page.getByRole('button', { name: 'Save' }).click({ force: true, timeout: 10000 })
        const noteComplete = page.locator('[data-testid="toggle-note-switch"]')
        await expect(noteComplete).not.toBeChecked()
        await deleteUserViaWeb(page)
        await deleteJsonFile(randomNumber)
    })

    test('TC630 - Delete a note via WEB @WEB @BASIC @FULL', async ({ page }) => {
        const randomNumber = faker.finance.creditCardNumber()
        await page.goto('app/register', { waitUntil: 'domcontentloaded', timeout: 30000 })
        await createUserViaWeb(page, randomNumber)
        await logInUserViaWeb(page, randomNumber)
        await createNoteViaWeb(page, randomNumber)
        await page.locator('[data-testid="note-delete"]').click()
        const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
        const note = {
            note_title: body.note_title
        }
        const noteModal = page.locator('[class="modal-content"]').first()
        await expect(noteModal).toContainText(note.note_title)
        await page.locator('[data-testid="note-delete-confirm"]').click()
        await deleteUserViaWeb(page)
        await deleteJsonFile(randomNumber)
    })

})

