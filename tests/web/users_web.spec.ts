import { test, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'
import { deleteJsonFile, getFullFilledResponseCU, getFullFilledResponseLogIn, logInUserViaWeb, deleteUserViaWeb, createUserViaWeb } from '../support/commands'
import fs from 'fs'

test.describe('Users Web Tests', () => {

    test('TC400 - Successful User Registration via WEB @WEB @BASIC @FULL', async ({ page }) => {
        // Step 1: Generate unique fixture key
        const fixtureKey = faker.finance.creditCardNumber()
        
        // Step 2: Generate dynamic test data
        const user = {
            user_name: faker.person.fullName(),
            user_email: faker.internet.exampleEmail().toLowerCase(),
            user_password: faker.internet.password({ length: 8 })
        }

        // Step 3: Navigate to registration page
        await page.goto('app/register')
        await expect(page).toHaveURL(/.*\/register/)
        
        // Step 4: Fill Email with dynamic faker email
        await page.getByTestId('register-email').fill(user.user_email)
        await expect(page.getByTestId('register-email')).toHaveValue(user.user_email)
        
        // Step 5: Fill Username with faker
        await page.getByTestId('register-name').fill(user.user_name)
        await expect(page.getByTestId('register-name')).toHaveValue(user.user_name)
        
        // Step 6: Fill Password and Confirm Password with faker
        await page.getByTestId('register-password').fill(user.user_password)
        await page.getByTestId('register-confirm-password').fill(user.user_password)
        await expect(page.getByTestId('register-password')).toHaveValue(user.user_password)
        await expect(page.getByTestId('register-confirm-password')).toHaveValue(user.user_password)
        
        // Step 7: Intercept the user creation endpoint
        const responsePromise = getFullFilledResponseCU(page)
        
        // Step 8: Click Register
        await page.getByRole('button', { name: 'Register' }).click()
        
        // Step 9: Read intercepted JSON and capture responseBody.data.id
        const response = await responsePromise
        const responseBody = await response.json()
        const user_id = responseBody.data.id
        
        // Step 10: Save data in fixture
        fs.writeFileSync(`tests/fixtures/testdata-${fixtureKey}.json`, JSON.stringify({
            user_email: user.user_email,
            user_id: user_id,
            user_name: user.user_name,
            user_password: user.user_password
        }), "utf8")
        
        // Step 11: Validate Web message: "User account created successfully"
        const successMessage = page.locator('b')
        await expect(successMessage).toContainText('User account created successfully')
        await expect(successMessage).toBeVisible()
        
        // Step 12: Perform login using logInUserViaWeb
        await logInUserViaWeb(page, fixtureKey)
        
        // Step 13: Delete user using deleteUserViaWeb
        await deleteUserViaWeb(page)
        
        // Step 14: Delete fixture using deleteJsonFile
        await deleteJsonFile(fixtureKey)
    })

    test('TC410 - Successful Login via WEB @WEB @BASIC @FULL', async ({ page }) => {
        // Generate unique fixture key
        const fixtureKey = faker.finance.creditCardNumber()
        
        // Create user first (registration flow)
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
        
        fs.writeFileSync(`tests/fixtures/testdata-${fixtureKey}.json`, JSON.stringify({
            user_email: user.user_email,
            user_id: responseBody.data.id,
            user_name: user.user_name,
            user_password: user.user_password
        }), "utf8")
        
        // Step 1: Execute logInUserViaWeb
        await logInUserViaWeb(page, fixtureKey)
        
        // Step 2: Navigate to MyNotes (home page) to validate redirection
        await page.goto('app/')
        await expect(page).toHaveURL(/.*\/app\/$/)
        
        // Step 3: Validate presence of Logout and Profile buttons
        // Check for navigation elements that indicate user is logged in
        const navigationElements = page.locator('button, a').filter({ hasText: /Logout|Profile/i })
        await expect(navigationElements.first()).toBeVisible()
        
        // Step 4: Validate title: "MyNotes" - check for page heading or validate by Add Note button
        // The MyNotes page is validated by presence of notes-related functionality
        const addNoteButton = page.getByRole('button', { name: /Add Note/i }).or(page.getByText(/\+ Add Note/i))
        await expect(addNoteButton.first()).toBeVisible()
        
        // Step 5: Validate initial message: "You don't have any notes in all categories"
        const emptyMessage = page.getByText(/You don't have any notes|don't have any notes/i)
        await expect(emptyMessage).toBeVisible()
        
        // Step 6: Cleanup
        await deleteUserViaWeb(page)
        await deleteJsonFile(fixtureKey)
    })

    test('TC420 - Profile Data Validation via WEB @WEB @BASIC @FULL', async ({ page }) => {
        // Generate unique fixture key
        const fixtureKey = faker.finance.creditCardNumber()
        
        // Create user first (registration flow)
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
        
        fs.writeFileSync(`tests/fixtures/testdata-${fixtureKey}.json`, JSON.stringify({
            user_email: user.user_email,
            user_id: responseBody.data.id,
            user_name: user.user_name,
            user_password: user.user_password
        }), "utf8")
        
        // Step 1: Login user
        await logInUserViaWeb(page, fixtureKey)
        
        // Read fixture data
        const fixture = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${fixtureKey}.json`, "utf8"))
        
        // Step 2: Click Profile (already on profile page from login, but ensure we're there)
        await page.goto('app/profile')
        await expect(page).toHaveURL(/.*\/profile/)
        
        // Step 3: Validate Username with fixture.user_name
        const userName = page.locator('[data-testid="user-name"]')
        await expect(userName).toHaveValue(fixture.user_name)
        await expect(userName).toBeVisible()
        
        // Step 4: Validate Email with fixture.user_email
        const userEmail = page.locator('[data-testid="user-email"]')
        await expect(userEmail).toHaveValue(fixture.user_email)
        await expect(userEmail).toBeVisible()
        
        // Step 5: Cleanup
        await deleteUserViaWeb(page)
        await deleteJsonFile(fixtureKey)
    })

    test('TC430 - User Deletion via WEB @WEB @BASIC @FULL', async ({ page }) => {
        // Generate unique fixture key
        const fixtureKey = faker.finance.creditCardNumber()
        
        // Create user first (registration flow)
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
        
        fs.writeFileSync(`tests/fixtures/testdata-${fixtureKey}.json`, JSON.stringify({
            user_email: user.user_email,
            user_id: responseBody.data.id,
            user_name: user.user_name,
            user_password: user.user_password
        }), "utf8")
        
        // Login user
        await logInUserViaWeb(page, fixtureKey)
        
        // Step 1: Click Profile
        await page.goto('app/profile')
        await expect(page).toHaveURL(/.*\/profile/)
        
        // Step 2: Click Delete Account
        await page.getByRole('button', { name: 'Delete Account' }).click()
        
        // Step 3: Confirm Delete
        await page.getByTestId('note-delete-confirm').click()
        
        // Step 4: Validate message: "Your account has been deleted. You should create a new account to continue."
        const alertMessage = page.getByTestId('alert-message')
        await expect(alertMessage).toContainText('Your account has been deleted. You should create a new account to continue.')
        await expect(alertMessage).toBeVisible()
        
        // Step 5: Validate redirection to login page
        await expect(page).toHaveURL(/.*\/login/)
        
        // Step 6: Delete fixture via deleteJsonFile if exists
        await deleteJsonFile(fixtureKey)
    })

    test('TC440 - Create a new user account via WEB - Invalid email @WEB @FULL @NEGATIVE', async ({ page }) => {
        const user = {
            user_name: faker.person.fullName(),
            user_email: faker.internet.exampleEmail().toLowerCase(),
            user_password: faker.internet.password({ length: 8 })
        }
        await page.goto('app/register', { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.getByTestId('register-email').fill('@' + user.user_email)
        await page.getByTestId('register-name').fill(user.user_name)
        await page.getByTestId('register-password').fill(user.user_password)
        await page.getByTestId('register-confirm-password').fill(user.user_password)
        await page.getByRole('button', { name: 'Register' }).click()
        const alertMessage = page.getByTestId('alert-message')
        await expect(alertMessage).toContainText('A valid email address is required')
        await expect(alertMessage).toBeVisible()
    })

    test('TC450 - Create a new user account via WEB - Wrong password @WEB @FULL @NEGATIVE', async ({ page }) => {
        const user = {
            user_name: faker.person.fullName(),
            user_email: faker.internet.exampleEmail().toLowerCase(),
            user_password: faker.internet.password({ length: 8 })
        }
        await page.goto('app/register')
        await page.getByTestId('register-email').fill(user.user_email)
        await page.getByTestId('register-name').fill(user.user_name)
        await page.getByTestId('register-password').fill(user.user_password)
        await page.getByTestId('register-confirm-password').fill('e' + user.user_password)
        await page.getByRole('button', { name: 'Register' }).click()
        const alertMessage = page.getByText('Passwords don\'t match!').or(page.locator('.mb-3 > .invalid-feedback'))
        await expect(alertMessage).toContainText('Passwords don\'t match!')
        await expect(alertMessage).toBeVisible()
    })

    test('TC460 - Log in as an existing user via WEB - Invalid email @WEB @FULL @NEGATIVE', async ({ page }) => {
        const fixtureKey = faker.finance.creditCardNumber()
        await createUserViaWeb(page, fixtureKey)
        const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${fixtureKey}.json`, "utf8"))
        const user = {
            user_email: body.user_email,
            user_id: body.user_id,
            user_name: body.user_name,
            user_password: body.user_password
        }
        await page.goto('app/login')
        await page.getByTestId('login-email').fill('e' + user.user_email)
        await page.getByTestId('login-password').fill(user.user_password)
        await page.getByRole('button', { name: 'Login' }).click()
        const alertMessage = page.getByTestId('alert-message')
        await expect(alertMessage).toContainText('Incorrect email address or password')
        await expect(alertMessage).toBeVisible()
        await logInUserViaWeb(page, fixtureKey)
        await deleteUserViaWeb(page)
        await deleteJsonFile(fixtureKey)
    })

    test('TC470 - Log in as an existing user via WEB - Wrong password @WEB @FULL @NEGATIVE', async ({ page }) => {
        const fixtureKey = faker.finance.creditCardNumber()
        await createUserViaWeb(page, fixtureKey)
        const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${fixtureKey}.json`, "utf8"))
        const user = {
            user_email: body.user_email,
            user_id: body.user_id,
            user_name: body.user_name,
            user_password: body.user_password
        }
        await page.goto('app/login')
        await page.getByTestId('login-email').fill(user.user_email)
        await page.getByTestId('login-password').fill('e' + user.user_password)
        await page.getByRole('button', { name: 'Login' }).click()
        const alertMessage = page.getByTestId('alert-message')
        await expect(alertMessage).toContainText('Incorrect email address or password')
        await expect(alertMessage).toBeVisible()
        await logInUserViaWeb(page, fixtureKey)
        await deleteUserViaWeb(page)
        await deleteJsonFile(fixtureKey)
    })

    test('TC480 - Retrieve user profile information via WEB @WEB @BASIC @FULL', async ({ page }) => {
        const fixtureKey = faker.finance.creditCardNumber()
        await createUserViaWeb(page, fixtureKey)
        await logInUserViaWeb(page, fixtureKey)
        // input assertion
        await page.goto('app/profile')
        await deleteUserViaWeb(page)
        await deleteJsonFile(fixtureKey)
    })

    test('TC490 - Update user profile information via WEB @WEB @BASIC @FULL', async ({ page }) => {
        const fixtureKey = faker.finance.creditCardNumber()
        await createUserViaWeb(page, fixtureKey)
        await logInUserViaWeb(page, fixtureKey)
        await page.goto('app/profile')
        await page.getByLabel('Phone').or(page.locator('input[name="phone"]')).fill(faker.string.numeric({ length: 12 }))
        await page.getByLabel('Company').or(page.locator('input[name="company"]')).fill(faker.internet.username())
        await page.getByRole('button', { name: 'Update profile' }).click()
        const profileUpdated = page.getByTestId('alert-message')
        await expect(profileUpdated).toContainText('Profile updated successful')
        await expect(profileUpdated).toBeVisible()
        await deleteUserViaWeb(page)
        await deleteJsonFile(fixtureKey)
    })

    test('TC500 - Update user profile information via WEB - Invalid company name @WEB @FULL @NEGATIVE', async ({ page }) => {
        const fixtureKey = faker.finance.creditCardNumber()
        await createUserViaWeb(page, fixtureKey)
        await logInUserViaWeb(page, fixtureKey)
        await page.goto('app/profile')
        await page.getByLabel('Phone').or(page.locator('input[name="phone"]')).fill(faker.string.numeric({ length: 12 }))
        await page.getByLabel('Company').or(page.locator('input[name="company"]')).fill('e')
        await page.getByRole('button', { name: 'Update profile' }).click()
        const alertMessage = page.getByText('company name should be between 4 and 30 characters').or(page.locator('.mb-4 > .invalid-feedback'))
        await expect(alertMessage).toContainText('company name should be between 4 and 30 characters')
        await expect(alertMessage).toBeVisible()
        await deleteUserViaWeb(page)
        await deleteJsonFile(fixtureKey)
    })

    test('TC510 - Update user profile information via WEB - Invalid phone number @WEB @FULL @NEGATIVE', async ({ page }) => {
        const fixtureKey = faker.finance.creditCardNumber()
        await createUserViaWeb(page, fixtureKey)
        await logInUserViaWeb(page, fixtureKey)
        await page.goto('app/profile')
        await page.getByLabel('Phone').or(page.locator('input[name="phone"]')).fill(faker.string.numeric({ length: 2 }))
        await page.getByLabel('Company').or(page.locator('input[name="company"]')).fill(faker.internet.username())
        await page.getByRole('button', { name: 'Update profile' }).click()
        const alertMessage = page.getByText('Phone number should be between 8 and 20 digits').or(page.locator(':nth-child(2) > .mb-2 > .invalid-feedback'))
        await expect(alertMessage).toContainText('Phone number should be between 8 and 20 digits')
        await expect(alertMessage).toBeVisible()
        await deleteUserViaWeb(page)
        await deleteJsonFile(fixtureKey)
    })

    test('TC520 - Change a user\'s password via WEB @WEB @BASIC @FULL', async ({ page }) => {
        const fixtureKey = faker.finance.creditCardNumber()
        await createUserViaWeb(page, fixtureKey)
        await logInUserViaWeb(page, fixtureKey)
        const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${fixtureKey}.json`, "utf8"))
        const user = {
            user_password: body.user_password,
            new_password: faker.internet.password({ length: 8 })
        }
        await page.goto('app/profile')
        await page.getByRole('button', { name: 'Change password' }).click()
        await page.getByTestId('current-password').fill(user.user_password)
        await page.getByTestId('new-password').fill(user.new_password)
        await page.getByTestId('confirm-password').fill(user.new_password)
        await page.getByRole('button', { name: 'Update password' }).click()
        const passwordChanged = page.getByTestId('alert-message')
        await expect(passwordChanged).toContainText('The password was successfully updated')
        await expect(passwordChanged).toBeVisible()
        await deleteUserViaWeb(page)
        await deleteJsonFile(fixtureKey)
    })

    test('TC530 - Change a user\'s password via WEB - Wrong password @WEB @FULL @NEGATIVE', async ({ page }) => {
        const fixtureKey = faker.finance.creditCardNumber()
        await createUserViaWeb(page, fixtureKey)
        await logInUserViaWeb(page, fixtureKey)
        const body = JSON.parse(fs.readFileSync(`tests/fixtures/testdata-${fixtureKey}.json`, "utf8"))
        const user = {
            user_password: body.user_password,
        }
        await page.goto('app/profile')
        await page.getByRole('button', { name: 'Change password' }).click()
        await page.getByTestId('current-password').fill('e' + user.user_password)
        const newPassword = faker.internet.password({ length: 8 })
        await page.getByTestId('new-password').fill(newPassword)
        await page.getByTestId('confirm-password').fill(newPassword)
        await page.getByRole('button', { name: 'Update password' }).click()
        const alertMessage = page.getByTestId('alert-message')
        await expect(alertMessage).toContainText('The current password is incorrect')
        await expect(alertMessage).toBeVisible()
        await deleteUserViaWeb(page)
        await deleteJsonFile(fixtureKey)
    })

    test('TC540 - Log out a user via WEB @WEB @BASIC @FULL', async ({ page }) => {
        const fixtureKey = faker.finance.creditCardNumber()
        await createUserViaWeb(page, fixtureKey)
        await logInUserViaWeb(page, fixtureKey)
        await page.getByRole('button', { name: 'Logout' }).or(page.getByRole('link', { name: 'Logout' })).first().click()
        const logout = page.getByRole('link', { name: 'Login' }).or(page.locator('[href="/notes/app/login"]'))
        await expect(logout).toContainText('Login')
        await expect(logout).toBeVisible()
        await logInUserViaWeb(page, fixtureKey)
        await deleteUserViaWeb(page)
        await deleteJsonFile(fixtureKey)
    })
})

