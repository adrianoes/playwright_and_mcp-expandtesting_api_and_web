import { test, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'
import { createUserViaApi, logInUserViaApi, deleteUserViaApi, deleteJsonFile, getFullFilledResponseCU, getFullFilledResponseLogIn, logInUserViaWeb } from '../support/commands'
import fs from 'fs'

test.beforeAll(async () => {
    try {fs.unlinkSync(`tests/fixtures/testdata.json`)} catch(err) {}
    fs.writeFileSync(`tests/fixtures/testdata.json`,' ', "utf8"); 
});

test.beforeEach(async ({ page }) => {
    await page.goto('app', { waitUntil: 'domcontentloaded', timeout: 30000 })
});

test.describe('Users API and Web Tests', () => { 

    test('TC640 - Creates a new user account via WEB and API @API_AND_WEB @BASIC @FULL', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()  
        const user = {
            user_name: faker.person.fullName(), 
            user_email: faker.internet.exampleEmail().toLowerCase(),
            user_password: faker.internet.password({ length: 8 })
        }
        await page.goto('app/register')
        await page.getByTestId('register-email').fill(user.user_email)
        await page.getByTestId('register-name').fill(user.user_name)
        await page.getByTestId('register-password').fill(user.user_password)
        await page.getByTestId('register-confirm-password').fill(user.user_password)
        const responsePromise = getFullFilledResponseCU(page)
        await page.getByRole('button', { name: 'Register' }).click()
        const response = await responsePromise
        const responseBody = await response.json()
        await expect(page).toHaveTitle('Notes React Application for Automation Testing Practice')
        const userRegistered = page.locator('b')
        await expect(userRegistered).toContainText('User account created successfully')        
        await expect(userRegistered).toBeVisible() 
        fs.writeFileSync(`tests/fixtures/testdata-${randomNumber}.json`,JSON.stringify({
            user_email: user.user_email,
            user_id: responseBody.data.id,
            user_name: user.user_name,                
            user_password: user.user_password        
        }), "utf8"); 
        await logInUserViaApi(request, randomNumber) 
        await deleteUserViaApi(request, randomNumber)
        await deleteJsonFile(randomNumber)
    })

    test('TC650 - Log in as an existing user via WEB and API @API_AND_WEB @BASIC @FULL', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()  
        await createUserViaApi(request, randomNumber) 
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
        await page.goto('app/profile', { waitUntil: 'domcontentloaded', timeout: 30000 })
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
        await deleteUserViaApi(request, randomNumber)
        await deleteJsonFile(randomNumber)
    })

    test('TC660 - Log in as an existing user via WEB and API - Invalid email @API_AND_WEB @FULL @NEGATIVE', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()  
        await createUserViaApi(request, randomNumber) 
        const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
        const user = {
            user_email: body.user_email,
            user_id: body.user_id,
            user_name: body.user_name,
            user_password: body.user_password
        }
        await page.goto('app/login', { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.getByTestId('login-email').fill('e'+user.user_email)
        await page.getByTestId('login-password').fill(user.user_password, { timeout: 30000 })
        await page.getByRole('button', { name: 'Login' }).click({ force: true, timeout: 10000 }) 
        const alertMessage = page.getByTestId('alert-message')
        await expect(alertMessage).toContainText('Incorrect email address or password')        
        await expect(alertMessage).toBeVisible()
        await logInUserViaApi(request, randomNumber)
        await deleteUserViaApi(request, randomNumber)
        await deleteJsonFile(randomNumber)
    })

    test('TC670 - Log in as an existing user via WEB and API - Wrong password @API_AND_WEB @FULL @NEGATIVE', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()  
        await createUserViaApi(request, randomNumber) 
        const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
        const user = {
            user_email: body.user_email,
            user_id: body.user_id,
            user_name: body.user_name,
            user_password: body.user_password
        }
        await page.goto('app/login')
        await page.getByTestId('login-email').fill(user.user_email)
        await page.getByTestId('login-password').fill('e'+user.user_password)
        await page.getByRole('button', { name: 'Login' }).click() 
        const alertMessage = page.getByTestId('alert-message')
        await expect(alertMessage).toContainText('Incorrect email address or password')        
        await expect(alertMessage).toBeVisible()
        await logInUserViaApi(request, randomNumber)
        await deleteUserViaApi(request, randomNumber)
        await deleteJsonFile(randomNumber)
    })

    test('TC680 - Navigate to user profile via WEB and API @API_AND_WEB @BASIC @FULL', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber) 
        await page.goto('app/profile', { waitUntil: 'domcontentloaded', timeout: 30000 })
        const userEmail = page.locator('[data-testid="user-email"]')
        await expect(userEmail).toBeVisible()
        const userId = page.locator('[data-testid="user-id"]')
        await expect(userId).toBeVisible()
        const userName = page.locator('[data-testid="user-name"]')
        await expect(userName).toBeVisible()
        await deleteUserViaApi(request, randomNumber) 
        await deleteJsonFile(randomNumber) 
    })

    test('TC690 - Update user profile information via WEB and API @API_AND_WEB @BASIC @FULL', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber) 
        await page.goto('app/profile', { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.getByLabel('Phone').or(page.locator('input[name="phone"]')).fill(faker.string.numeric({ length: 12 }))
        await page.getByLabel('Company').or(page.locator('input[name="company"]')).fill(faker.internet.username())
        await page.getByRole('button', { name: 'Update profile' }).click() 
        const profileUpdated = page.getByTestId('alert-message')
        await expect(profileUpdated).toContainText('Profile updated successful')        
        await expect(profileUpdated).toBeVisible()         
        await deleteUserViaApi(request, randomNumber) 
        await deleteJsonFile(randomNumber) 
    })

    test('TC700 - Update user profile information via WEB and API - Invalid company name @API_AND_WEB @FULL @NEGATIVE', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber) 
        await page.goto('app/profile', { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.locator('input[name="phone"]').fill(faker.string.numeric({ length: 12 }))
        await page.getByLabel('Company').or(page.locator('input[name="company"]')).fill('e')
        await page.getByRole('button', { name: 'Update profile' }).click() 
        const alertMessage = page.getByText('company name should be between 4 and 30 characters').or(page.locator('.mb-4 > .invalid-feedback'))
        await expect(alertMessage).toContainText('company name should be between 4 and 30 characters')        
        await expect(alertMessage).toBeVisible()         
        await deleteUserViaApi(request, randomNumber) 
        await deleteJsonFile(randomNumber) 
    })

    test('TC710 - Update user profile information via WEB and API - Invalid phone number @API_AND_WEB @FULL @NEGATIVE', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber) 
        await page.goto('app/profile', { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.getByLabel('Phone').or(page.locator('input[name="phone"]')).fill(faker.string.numeric({ length: 2 }))
        await page.locator('input[name="company"]').fill(faker.internet.username())
        await page.getByRole('button', { name: 'Update profile' }).click() 
        const alertMessage = page.getByText('Phone number should be between 8 and 20 digits').or(page.locator(':nth-child(2) > .mb-2 > .invalid-feedback'))
        await expect(alertMessage).toContainText('Phone number should be between 8 and 20 digits')        
        await expect(alertMessage).toBeVisible()         
        await deleteUserViaApi(request, randomNumber) 
        await deleteJsonFile(randomNumber) 
    })

    test('TC720 - Change a user\'s password via WEB and API @API_AND_WEB @BASIC @FULL', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber)  
        const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
        const user = {
            user_password: body.user_password,
            new_password: faker.internet.password({ length: 8 })
        }
        await page.goto('app/profile', { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.getByRole('button', { name: 'Change password' }).click()
        await page.getByTestId('current-password').fill(user.user_password)
        await page.getByTestId('new-password').fill(user.new_password)
        await page.getByTestId('confirm-password').fill(user.new_password)
        await page.getByRole('button', { name: 'Update password' }).click()
        const passwordChanged = page.getByTestId('alert-message')
        await expect(passwordChanged).toContainText('The password was successfully updated')        
        await expect(passwordChanged).toBeVisible()        
        await deleteUserViaApi(request, randomNumber) 
        await deleteJsonFile(randomNumber) 
    })

    test('TC730 - Change a user\'s password via WEB and API - Type same password @API_AND_WEB @FULL @NEGATIVE', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber)  
        const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${randomNumber}.json`, "utf8"))
        const user = {
            user_password: body.user_password
        }
        await page.goto('app/profile', { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.getByRole('button', { name: 'Change password' }).click()
        await page.getByTestId('current-password').fill(user.user_password)
        await page.getByTestId('new-password').fill(user.user_password)
        await page.getByTestId('confirm-password').fill(user.user_password)
        await page.getByRole('button', { name: 'Update password' }).click()
        const alertMessage = page.getByTestId('alert-message')
        await expect(alertMessage).toContainText('The new password should be different from the current password')        
        await expect(alertMessage).toBeVisible()        
        await deleteUserViaApi(request, randomNumber) 
        await deleteJsonFile(randomNumber) 
    })

    test('TC740 - Log out a user via WEB and API @API_AND_WEB @BASIC @FULL', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber) 
        await page.getByRole('button', { name: 'Logout' }).click()
        const logout = page.locator('[href="/notes/app/login"]')
        await expect(logout).toContainText('Login')        
        await expect(logout).toBeVisible()
        await logInUserViaApi(request, randomNumber)
        await deleteUserViaApi(request, randomNumber) 
        await deleteJsonFile(randomNumber) 
    })

    test('TC750 - Delete user account via WEB and API @API_AND_WEB @BASIC @FULL', async ({ page, request }) => {
        const randomNumber = faker.finance.creditCardNumber()          
        await createUserViaApi(request, randomNumber) 
        await logInUserViaWeb(page, randomNumber)  
        await page.goto('app/profile', { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.getByRole('button', { name: 'Delete Account' }).click()     
        const confirmButton = page.getByTestId('note-delete-confirm')
        await expect(confirmButton).toBeVisible()
        await confirmButton.click() 
        const alertMessage = page.getByTestId('alert-message')
        await expect(alertMessage).toContainText('Your account has been deleted. You should create a new account to continue.')        
        await expect(alertMessage).toBeVisible() 
        await deleteJsonFile(randomNumber) 
    })

})

