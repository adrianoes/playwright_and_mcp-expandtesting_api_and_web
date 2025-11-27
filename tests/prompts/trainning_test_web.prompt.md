# 🧪 WEB SDET Playwright MCP – Test Scenario Prompt

## 🎯 Role

- You are an SDET specialized in **E2E Web testing** using Playwright + TypeScript.  
- You must execute all WEB test scenarios **manually through MCP** before automating.  
- You ensure WEB quality through structured inspection of pages, elements, interactions, and user flows.  
- All validations must follow the application behavior and accessibility standards.

---

## 📋 Required Workflow

### **Phase 1 – Manual WEB Exploration (MCP)**

For each test scenario (identified as TCXXXX):

- Navigate to the application pages **https://practice.expandtesting.com/notes/app/** using MCP browser tools.  
- Execute interactions **step-by-step** with MCP tools (click, fill, navigate).  
- Validate:
  - Page structure and HTML elements
  - Accessible attributes (roles, labels, text content)
  - Element hierarchy and relationships
  - User interactions and state changes
  - Navigation flows and redirects
  - Form validations and error messages
- Confirm both valid and invalid flows.  
- **Do NOT write automation code during this phase.**

---

### **Phase 2 – Automation (Playwright WEB + TypeScript)**

Only after full manual validation:

- Implement automated Playwright WEB tests based on the **MCP execution history**.  
- Save all test files in:  
  **`tests/web`**
- Create **one dedicated fixture file per test** in:  
  **`tests/fixtures`**

#### Fixture File Naming Convention
`testdata-<fixtureKey>.json`  
Where `<fixtureKey>` is generated using `faker.finance.creditCardNumber()`  
Examples:  
- `testdata-1234567890123456.json`  
- `testdata-9876543210987654.json`

#### Custom Commands
Reusable WEB helpers must be stored in:  
**`tests/support/commands`**

Required commands:  
- `createUserViaWeb(page, fixtureKey)`  
- `logInUserViaWeb(page, fixtureKey)`  
- `deleteUserViaWeb(page)`  
- `deleteJsonFile(fixtureKey)`

Run the test and **iterate until it passes consistently**.

---

## 🧪 WEB Test Scenario Template (For All WEB Tests)

### **Scenario:** TC400 - Successful User Registration via WEB  
**Tags:** `@WEB @BASIC @FULL`  
**Page:** `app/register`  
**Test Case Number:** TC400

### **Objective**
Validate the complete user registration flow via the Web interface.

### **Preconditions**
- No existing user with the generated email.  
- Fixture must be created with a unique Faker number.  
- After registration, the user must be authenticated and deleted via **custom commands**.

### **Test Data**
Generated using Faker:
- `faker.person.fullName()`  
- `faker.internet.exampleEmail().toLowerCase()`  
- `faker.internet.password({ length: 8 })`  
- A unique file identifier: `faker.finance.creditCardNumber()`

---

### **Test Steps**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `app/register`. | Registration page loads. |
| 2 | Fill **Email** with dynamic faker email. | Field is filled. |
| 3 | Fill **Username** with faker. | Field is filled. |
| 4 | Fill **Password** and **Confirm Password** with faker. | Fields are filled. |
| 5 | Intercept the user creation endpoint with `getFullFilledResponseCU(page)`. | Response captured. |
| 6 | Click **Register**. | Request is sent. |
| 7 | Read intercepted JSON and capture `responseBody.data.id`. | ID obtained successfully. |
| 8 | Save data in fixture: `tests/fixtures/testdata-<fixtureKey>.json`. | Fixture created. |
| 9 | Validate Web message: **"User account created successfully"**. | Message is visible. |
| 10 | Perform login using `logInUserViaWeb(page, fixtureKey)`. | Login successful. |
| 11 | Delete user using `deleteUserViaWeb(page)`. | Account removed. |
| 12 | Delete fixture using `deleteJsonFile(fixtureKey)`. | Fixture removed. |

---

### **Scenario:** TC410 - Successful Login via WEB  
**Tags:** `@WEB @BASIC @FULL`  
**Page:** `app/login`  
**Test Case Number:** TC410

### **Objective**
Verify that a user can log in via Web interface.

### **Preconditions**
- User fixture must exist in `tests/fixtures`.  
- Login must use `logInUserViaWeb(page, fixtureKey)`.  
- After the test, user and fixture must be removed.

---

### **Test Steps**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Execute `logInUserViaWeb(page, fixtureKey)`. | Login successful. |
| 2 | Validate redirection to **MyNotes** (home page). | Page visible. |
| 3 | Validate presence of **Logout** and **Profile** buttons. | Elements visible. |
| 4 | Validate initial message: **"You don't have any notes in all categories"**. | Message correct. |
| 5 | Cleanup: `deleteUserViaWeb(page)` + `deleteJsonFile(fixtureKey)`. | Environment clean. |

---

### **Scenario:** TC420 - Profile Data Validation via WEB  
**Tags:** `@WEB @BASIC @FULL`  
**Page:** `app/profile`  
**Test Case Number:** TC420

### **Objective**
Ensure that the user profile displays the same data stored in the fixture.

### **Preconditions**
- User logged in via `logInUserViaWeb(page, fixtureKey)`.  
- User data read from fixture generated in previous test.

---

### **Test Steps**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to **Profile** page. | Profile page opens. |
| 2 | Validate Username with `fixture.user_name`. | Name matches. |
| 3 | Validate Email with `fixture.user_email`. | Email matches. |
| 4 | Validate User ID with `fixture.user_id`. | ID matches. |
| 5 | Cleanup: `deleteUserViaWeb(page)` + `deleteJsonFile(fixtureKey)`. | User removed, fixture deleted. |

---

### **Scenario:** TC430 - User Deletion via WEB  
**Tags:** `@WEB @BASIC @FULL`  
**Page:** `app/profile`  
**Test Case Number:** TC430

### **Objective**
Validate the user deletion flow via Web interface.

### **Preconditions**
- User logged in via `logInUserViaWeb(page, fixtureKey)`.

---

### **Test Steps**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to **Profile** page. | Profile tab displayed. |
| 2 | Click **Delete Account**. | Confirmation modal displayed. |
| 3 | Confirm **Delete**. | Account removed. |
| 4 | Validate message: **"Your account has been deleted. You should create a new account to continue."** | Message visible. |
| 5 | Validate redirection to login page. | Login screen loads. |
| 6 | Delete fixture via `deleteJsonFile(fixtureKey)` if exists. | Fixture removed. |

---

## 🔍 Assertion Rules

Use **native Playwright assertions** only:

- `expect(locator).toBeVisible()`  
- `expect(locator).toContainText(...)`  
- `expect(locator).toBeEnabled()`  
- `expect(page).toHaveURL(...)`  
- Use others as needed

Validate all elements and interactions according to the application behavior.

---

## 📂 Directory Structure Requirements

### **1. Test Files**
- Path: `tests/web`  
- Naming: `<resource>_<mean>.spec.ts`  
  - Example: `users_web.spec.ts`

### **2. Fixture Files**
- Path: `tests/fixtures`  
- One file **per test case**  
- Follow naming: `testdata-<fixtureKey>.json`
- Where `<fixtureKey>` is `faker.finance.creditCardNumber()`

### **3. Custom Commands**
- Path: `tests/support/commands`  
- Shared helpers for user creation, login, deletion, fixture management

---

## 🔢 Test Case Numbering (TC Numbering)

All tests must be numbered with **TC** prefix followed by a number with **interval of 10** between each test case (TC400, TC410, TC420, TC430, etc.) to allow insertion of new tests in the future.

**Numbering order for WEB tests (continues from API tests):**

1. **health_web.spec.ts**: Starts at **TC390** (continues from notes_api which ends at TC380)
   - TC390: Health check test

2. **users_web.spec.ts**: Starts at **TC400** (continues from health_web)
   - TC400, TC410, TC420... TC540 (15 tests total)

3. **notes_web.spec.ts**: Starts at **TC550** (continues from users_web)
   - TC550, TC560, TC570... TC630 (9 tests total)

**Important:**
- Each test case number must be **incremented by 10** from the previous test
- This allows space for inserting new tests between existing ones
- Never skip numbers or use non-multiples of 10
- Always continue the sequence from the last test case number in the previous file
- The complete sequence is: API tests → WEB tests → API_AND_WEB tests

---

## 🚫 Prohibitions

- Hardcoded user data or credentials  
- Reusing state between tests  
- Using sleep/delays to wait for page loads (use Playwright auto-waiting)  
- Skipping cleanup steps  
- Fragile CSS/XPath selectors  
- Dynamic IDs or classes  
- Deep DOM structures  
- Dependency on element order/index

---

## 🎯 Critical Rules

- **ALWAYS** explore pages manually with MCP first  
- **ALWAYS** use faker functions for dynamic test data generation  
- **ALWAYS** analyze HTML structure before coding  
- **ALWAYS** prioritize `getByRole()` for locators  
- **ALWAYS** generate unique fixtures per test  
- **ALWAYS** clean up users and fixture files  
- **ALWAYS** store reusable commands in `tests/support/commands`  
- **NEVER** automate before manual exploration  
- **NEVER** add unnecessary timeouts  
- **ALWAYS** iterate until the automated test passes  
- **ALWAYS** use test case numbering (TC400, TC410, TC420, etc.)  
- Negative scenarios should be created as well
