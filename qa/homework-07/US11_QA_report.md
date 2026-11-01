# US11 Guest Viewing Reservation Menu - QA report (Manual QA homework #7)

| | |
|---|---|
| Story | [Draft] US11_Guest Viewing Reservation Menu (Epic: Order Management, role: Guest) |
| Design | Figma "EPAM IT Marathon 6.0", frame "Placing pre-order by guest \| Menu" (node 111683:86716), reviewed through the Figma connector on a copy of the course file; reference image: `attachments/figma-guest-menu.png` |
| Tested build | Screenshot of the implemented screen: `https://d28jftogiwtein.cloudfront.net/join/<token>` (Guest, Menu page) |
| Environment | P_PRD |
| Deliverables | 1. Requirements analysis, 2. Test cases, 3. Test results, 4. Defect reports |

## Summary

- Requirement issues found: **20** (High: 6, Medium: 12, Low: 2).
- Test cases: **37** (Passed: 7, Failed: 9, Not executed: 21). Pass rate of the executed cases: 7/16 = 44%.
- Defects: **8** (Severity - Major: 2, Minor: 5, Trivial: 1; Priority - Medium: 4, Low: 4).
- "Not executed" means the check can not be done from the single screenshot (cart content, admin changes, mobile viewport, negative links). They need a live environment.

## 1. Requirements analysis (shortcomings of the user story)

| ID | Area | Type | Severity | Shortcoming | Impact | Recommendation / question |
|---|---|---|---|---|---|---|
| R1 | Title / description | Inconsistency | Medium | The story has three different names: "US11_Guest Viewing Reservation Menu", "Guest Reservation and Menu View" and the description talks only about seeing "the full restaurant menu". "Reservation" is in the name, but no acceptance criterion describes showing reservation information. | Testers and developers can not agree on the scope. The Figma design shows a reservation strip (address, table, date, time) that no AC covers, so it can be dropped or built differently. | Use one name. Either remove "Reservation" from the name or add an AC for the reservation strip (what fields, format, behaviour when data is missing). |
| R2 | Epic / scope | Scope | Medium | Epic is "Order Management", the description says the Guest wants to see the menu "so that I know what options are available", but AC3 adds the dish to a cart. Viewing the menu and adding to a cart are two different value streams in one story. | Story is not independent and not small (INVEST). A defect in the cart blocks acceptance of the menu view and vice versa. | Split into "View menu" and "Add dish to personal cart", or extend the description with the cart goal. |
| R3 | Pre-conditions | Ambiguity | Medium | "Guest has successfully joined the session (US_G10)" refers to another story by a code only, no link or title; "joined" is not defined (name entered? session token created?). | Test pre-conditions can not be prepared exactly; the border between US_G10 and US11 is unclear. | Add a link and a one-line definition of "joined" (e.g. guest session exists and guest name is saved). |
| R4 | Pre-conditions | Inconsistency | High | "The parent reservation or group session status is in Created/"Reserved"": two statuses separated by a slash and a different quote style, "or" mixes two entities (reservation vs group session), and "Created" is not a reservation status (it looks like an order status). Grammar: "is in Created". | It is impossible to say which exact status combinations allow the menu to be opened and which must be rejected. | Give a table: reservation status x group session status -> menu available / unavailable. Use the exact status names from the data model. |
| R5 | Pre-conditions | Missing requirement | High | Behaviour is not defined when the pre-conditions are NOT met: reservation Cancelled/Completed, group session already submitted or closed, invalid or expired link, guest not joined. Only the test-case examples hint at a static page with the text "This pre-order session has expired or is no longer active." | Negative scenarios can not be derived from the story; the sample defect in the course template shows that a cancelled reservation can open a different error page ("We could not load the invitation") than the one expected by the sample test case. | Add an AC (or reference the owning story) with the screen, the exact message and the allowed navigation for every non-allowed state. |
| R6 | AC1 | Ambiguity | Medium | "Full restaurant menu": it is not clear whether it is the menu of the restaurant, of the location of the reservation, or only of dishes available now. The Figma strip says "48 Rustaveli Avenue, Table 1", so the menu is probably location-specific. | Different testers will expect different sets of dishes; wrong dishes can be shown to the guest. | State the source of the dish list (location of the reservation) and whether unavailable dishes are included. |
| R7 | AC1 | Untestable | Medium | "Structured logically by category (e.g., Appetizers, Main Course, Desserts)": "logically" is not measurable and "e.g." does not define the final list. Not defined: category order, how the guest switches categories (tabs/sections), default category, what to show for an empty category or a dish without category. | The result of the check depends on the tester's opinion. In the implementation the tabs differ from the design (see defect 3). | List the categories and their order, define the navigation control, the default selected category and the empty-category state. |
| R8 | AC1 / design | Inconsistency | Medium | The Figma design has a "Sort by" control with four options (Popular First, Newest First, Price: Low to High, Price: High to Low) and a note "New Filter component". Sorting/filtering is not mentioned in any AC. | Feature is in the design but has no acceptance criteria: it may be skipped by developers or implemented with other options (the implementation shows "Recommended"). | Add an AC for sorting (options, default, behaviour inside a category) or mark it as out of scope on the design. |
| R9 | AC2 | Ambiguity | Medium | AC2 requires name, price, serving size in grams, image and availability status, but formats are not defined: currency symbol and decimals (Figma "$17" vs data like 14.99), weight format ("430 g"), maximum name length / wrapping, what to show when weight or image is missing. | Inconsistent formatting between cards (see defects 5, 6) and no objective pass/fail criteria. | Define the formats with examples, the truncation rule for long names and the fallback for a missing image/weight. |
| R10 | AC2 | Ambiguity | Medium | "Current availability status" is not enumerated. The system seems to know more than two states, but the AC says only "On Stop" in AC4. It is not stated whether an available dish must show any status (the design shows a badge only for the unavailable one). | Not clear how many states must be displayed and with which labels. | List all dish states, the label and the visual for each, and say explicitly that an available dish has no badge. |
| R11 | AC3 | Ambiguity | High | "Personal subcart" is not defined anywhere: the design and the application use a "cart" icon. It is not said where the guest can see the subcart, whether it belongs to the guest session only, and how it relates to the owner's cart / group pre-order. | The core action of the story (adding a dish) has no verifiable expected result. | Define the term, the place where the guest sees the content and the link with the group pre-order. |
| R12 | AC3 | Missing requirement | High | Nothing is said about the result of pressing "Pre-order": feedback (toast, cart counter), quantity (adding the same dish twice - increase or block?), maximum quantity, adding several different dishes, removing a dish from the subcart, adding while offline or after the dish became unavailable. | Most of the functional behaviour has to be guessed; high risk of defects found only after release. | Describe the happy path result and the negative/boundary cases (duplicates, limits, errors). |
| R13 | AC3 | Inconsistency | Low | The button label is written "Pre-order" in AC3 and "Pre-Order" in the design; the label is given only as an example ("e.g."). | Label can differ between the story, the design and the application. | Fix the exact label (and its capitalisation) in one place. |
| R14 | AC4 | Inconsistency | Medium | Three different names for the unavailable state: "On Stop" (AC4), "Sold Out" (Figma badge) and "Out Of Stock" (implementation). | Developers and testers can not tell which text is correct; user-facing wording is inconsistent. | Choose one internal state and one user-facing label. |
| R15 | AC4 | Ambiguity | Medium | "Clearly indicated as unavailable" and "cannot be selected" are subjective: it is not defined whether the card is greyed, whether the button is hidden or disabled, and whether the whole card (not only the button) must be non-interactive, also for keyboard and screen-reader users. | Different implementations are all "correct"; no way to verify the accessibility of the disabled state. | Specify the visual (badge text, greyed name and price), the control state (disabled / hidden; the design hides the button on a Sold Out card) and the accessible name/state. |
| R16 | AC5 | Untestable | High | "The menu reflects the current data at the time the Guest opens or refreshes the screen": "current" and the allowed delay are not defined, nothing is said about an update while the screen stays open (a dish goes On Stop after the guest opened the menu), caching and loading/error states. | A guest can add a dish that is already unavailable; there is no way to verify the "freshness" objectively. | Define the data source/caching rule, the maximum staleness, the behaviour on the add action for a dish that became unavailable, and loading/error states. |
| R17 | Missing | Missing requirement | Medium | No requirements for: empty menu, loading and error states, retry, pagination/lazy loading of a long menu, search, dish details (description, nutrition), behaviour on click on the card. | Screens in these states will be implemented differently or not at all. | Add the states and the explicit "out of scope" list. |
| R18 | Missing | Missing requirement | Medium | No non-functional requirements: responsive layout (guests join from a phone by a link), accessibility (keyboard, contrast, labels), performance (image loading), localisation/currency. | Key usage scenario (mobile guest) is not covered by acceptance. | Add at least supported viewports/browsers, accessibility level and a page-load target. |
| R19 | Role / navigation | Missing requirement | High | The story defines the role Guest but not what the Guest can navigate to. The design uses a special "Guest variant Header" (logo and cart only) and a breadcrumb "Main page > Menu", while the implementation shows the full registered-user navigation (Main page, Book a Table, Reservations, account icon). | A guest can reach pages meant for registered users; the design intention is not testable from the story. | Add an AC for the Guest header/navigation and say where "Main page" in the breadcrumb leads for a guest. |
| R20 | Design | Typo / quality | Low | The design contains a typo in the tab name ("Main Cources"), shows prices without decimals and one fixed date format, while the story gives no format rules. The design is not linked from the story and the story is marked [Draft] without version, author, date or priority. | Typos may be copied into the product; unfinished document status makes the review baseline unclear. | Fix the design text, link the design in the story and move the story out of Draft only after the open questions are resolved. |

## 2. Test cases and 3. Test results

Format follows the course template (ID, Title, Pre-conditions, Steps, Expected result, Status). Coverage: AC1 - TC9..TC14, AC2 - TC15..TC22, AC3 - TC23..TC27, AC4 - TC28..TC30, AC5 - TC31..TC35; pre-conditions, header and breadcrumb - TC1..TC8; non-functional - TC36, TC37.

### ID: 1 - Verify that Guest opens the Menu after joining the Group session when Reservation = Reserved

**Status: Passed** (Menu with the reservation strip is shown on the join link (screenshot).)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"

**Steps:**
1. Guest is redirected by the shared link.
2. Enter a valid name in the "Enter your name" field.
3. Click [Browse menu].

**Expected result:**
1. The Menu page is opened.
2. The reservation strip and the dish list are displayed.

### ID: 2 - Verify that Guest is redirected to the static page when Reservation = Cancelled

**Status: Not executed** (Requires a live environment with a cancelled reservation.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Cancelled"

**Steps:**
1. Guest is redirected by the shared link.

**Expected result:**
1. Static page with the message "This pre-order session has expired or is no longer active." is opened.
2. The Menu is not available.

### ID: 3 - Verify that Guest can not open the Menu when the group pre-order is already submitted

**Status: Not executed** (Requires a live environment.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Group pre-order is submitted by the Owner

**Steps:**
1. Guest is redirected by the shared link.

**Expected result:**
1. Static page with the message about the expired/inactive session is opened (final text is not defined in the story - see R5).
2. The Menu is not available.

### ID: 4 - Verify that an invalid or malformed invite link does not show the Menu

**Status: Not executed** (Requires a live environment.)

**Pre-conditions:**
- None

**Steps:**
1. Open https://d28jftogiwtein.cloudfront.net/join/invalid-token.

**Expected result:**
1. An error/static page is shown; no dish list and no technical error text are displayed.

### ID: 5 - Verify that Guest can not reach the Menu without entering the name

**Status: Not executed** (Pre-condition US_G10; requires a live environment.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"

**Steps:**
1. Guest is redirected by the shared link.
2. Leave the "Enter your name" field empty.
3. Try to click [Browse menu].

**Expected result:**
1. [Browse menu] is disabled.
2. The Menu page is not opened.

### ID: 6 - Verify that the Guest header contains only the logo and the cart (Guest variant header)

**Status: Failed** (Defect 1)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)

**Steps:**
1. Open the Menu page as a Guest.
2. Look at the header.

**Expected result:**
1. Header shows the logo and the cart icon only (Figma "Guest variant Header").
2. "Main page", "Book a Table", "Reservations" and the account icon are not shown.

### ID: 7 - Verify that the reservation strip shows the address, table, date and time of the reservation

**Status: Failed** (Defect 2)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)

**Steps:**
1. Open the Menu page as a Guest.
2. Look at the green reservation strip under the header.

**Expected result:**
1. Strip text: "You are making a pre-order for the reservation <address>, Table <n>, <date>, <time from - to>".
2. Date is present (Figma: "Oct 17, 2026, 12:00 - 13:30").

### ID: 8 - Verify that the breadcrumb "Main page > Menu" is displayed

**Status: Passed** (Shown on the screenshot.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)

**Steps:**
1. Open the Menu page as a Guest.
2. Look at the area under the reservation strip.

**Expected result:**
1. Breadcrumb "Main page > Menu" is shown with "Menu" as the current page.

### ID: 9 - Verify that the Menu is grouped by the categories from the design (Appetizers, Main Courses, Desserts)

**Status: Failed** (Defect 3)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)

**Steps:**
1. Open the Menu page as a Guest.
2. Look at the category tabs above the dish list.

**Expected result:**
1. Tabs "Appetizers", "Main Courses" and "Desserts" are displayed.
2. No additional tabs are displayed.

### ID: 10 - Verify that the first category (Appetizers) is selected by default

**Status: Failed** (Defect 3 ("All dishes" is selected by default))

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)

**Steps:**
1. Open the Menu page as a Guest.
2. Pay attention to the selected tab.

**Expected result:**
1. "Appetizers" tab is selected and underlined.
2. Only appetizers are displayed (Figma).

### ID: 11 - Verify that switching a category tab shows only the dishes of that category

**Status: Not executed** (Only one state is visible on the screenshot.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)

**Steps:**
1. Open the Menu page as a Guest.
2. Click the "Main Courses" tab.
3. Click the "Appetizers" tab.

**Expected result:**
1. Only the dishes of the selected category are displayed after each click.
2. The selected tab is highlighted.

### ID: 12 - Verify the behaviour for a category without dishes

**Status: Not executed** (Expected result is not defined in the story.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- The category "Desserts" has no dishes

**Steps:**
1. Open the Menu page as a Guest.
2. Click the "Desserts" tab.

**Expected result:**
1. An empty-state message is shown, or the tab is not shown (expected result must be clarified, see R7, R17).

### ID: 13 - Verify that the sorting control has the options from the design

**Status: Failed** (Defect 7)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)

**Steps:**
1. Open the Menu page as a Guest.
2. Look at the "Sort by" control.
3. Open the dropdown.

**Expected result:**
1. Default value is "Popular First".
2. Options: Popular First, Newest First, Price: Low to High, Price: High to Low.

### ID: 14 - Verify the sorting by price from low to high

**Status: Not executed** (Dropdown options are not visible on the screenshot.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- At least 3 dishes with different prices are in the selected category

**Steps:**
1. Open the Menu page as a Guest.
2. Select "Price: Low to High" in "Sort by".

**Expected result:**
1. Dishes are ordered by price ascending inside the selected category.

### ID: 15 - Verify that every dish card shows the name, price, weight in grams and image

**Status: Passed** (All four elements are present on every visible card.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)

**Steps:**
1. Open the Menu page as a Guest.
2. Check each dish card.

**Expected result:**
1. Each card contains: dish image, name, price with the currency, weight in grams.

### ID: 16 - Verify that the dish image corresponds to the dish

**Status: Failed** (Defect 5)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- Several dishes with different names exist

**Steps:**
1. Open the Menu page as a Guest.
2. Compare the images of "Fresh Avocado Toast", "Truffle Mushroom Risotto" and "Margherita Pizza".

**Expected result:**
1. Each dish has its own image that matches the dish.

### ID: 17 - Verify the price format of the dish cards

**Status: Passed** ("$12.00", "$22.50", "$14.99" are consistent. Format is not defined in the story (R9).)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)

**Steps:**
1. Open the Menu page as a Guest.
2. Check the price on each card.

**Expected result:**
1. Price is displayed with the currency symbol and a consistent number format (e.g. $12.00, $14.99).

### ID: 18 - Verify that the weight is displayed in grams in one consistent format

**Status: Failed** (Defect 6)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)

**Steps:**
1. Open the Menu page as a Guest.
2. Check the weight on each card.

**Expected result:**
1. Weight is displayed in the same format on all cards (e.g. "450 g").

### ID: 19 - Verify the placeholder for a dish without image

**Status: Not executed** (Expected result is not defined in the story.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- A dish without an image exists

**Steps:**
1. Open the Menu page as a Guest.
2. Find the dish without an image.

**Expected result:**
1. A placeholder or the first letter is displayed; no broken-image icon (expected result must be clarified, see R9).

### ID: 20 - Verify that a very long dish name is displayed correctly

**Status: Not executed** (Truncation rule is not defined (R9).)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- A dish with a 100-character name exists

**Steps:**
1. Open the Menu page as a Guest.
2. Find the dish with the long name.

**Expected result:**
1. The name is wrapped or truncated; the card layout (price, weight, button) is not broken.

### ID: 21 - Verify the label of the status for an unavailable dish

**Status: Failed** (Defect 4)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- A dish with the status "On Stop" exists

**Steps:**
1. Open the Menu page as a Guest.
2. Find the unavailable dish.
3. Look at the badge in the right corner of the card.

**Expected result:**
1. A badge with the agreed label is displayed (Figma: "Sold Out").

### ID: 22 - Verify that an available dish has no "unavailable" badge

**Status: Passed** (Shown on the screenshot.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- An available dish exists

**Steps:**
1. Open the Menu page as a Guest.
2. Find the available dish "Margherita Pizza".

**Expected result:**
1. No status badge is displayed.
2. Name and price are not greyed out.

### ID: 23 - Verify that an available dish has an active action button

**Status: Passed** (Green enabled button on "Margherita Pizza".)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- An available dish exists

**Steps:**
1. Open the Menu page as a Guest.
2. Find the available dish.

**Expected result:**
1. A button [Pre-Order] is displayed on the card and is enabled.

### ID: 24 - Verify that the Guest can add an available dish to the personal cart

**Status: Not executed** (Requires a live environment (the cart content is not visible on the screenshot).)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- The personal cart is empty
- An available dish exists

**Steps:**
1. Open the Menu page as a Guest.
2. Click [Pre-Order] on an available dish.
3. Open the cart.

**Expected result:**
1. The cart counter shows 1.
2. The dish is in the cart with quantity 1 and the correct price.

### ID: 25 - Verify that adding the same dish twice increases the quantity

**Status: Not executed** (Behaviour is not defined in the story (R12).)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- The personal cart is empty

**Steps:**
1. Open the Menu page as a Guest.
2. Click [Pre-Order] on the same dish twice.
3. Open the cart.

**Expected result:**
1. The dish is in the cart once with quantity 2 (or the expected behaviour defined in R12).

### ID: 26 - Verify that several different dishes can be added to the cart

**Status: Not executed** (Requires a live environment.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- The personal cart is empty

**Steps:**
1. Open the Menu page as a Guest.
2. Add three different available dishes.
3. Open the cart.

**Expected result:**
1. All three dishes are in the cart with the quantity 1 and the correct total.

### ID: 27 - Verify that the cart of a Guest is personal

**Status: Not executed** (Requires two guest sessions.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- Two guests joined the same group session

**Steps:**
1. Guest A adds a dish to the cart.
2. Open the Menu page as Guest B and open the cart.

**Expected result:**
1. The cart of Guest B does not contain the dish of Guest A.

### ID: 28 - Verify that an "On Stop" dish is clearly indicated as unavailable

**Status: Passed** (Greyed cards with a badge on the screenshot (wording of the badge - see TC21).)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- Dishes with the status "On Stop" exist

**Steps:**
1. Open the Menu page as a Guest.
2. Look at the unavailable dishes.

**Expected result:**
1. The card has an unavailable badge and the name, price and image are greyed out.

### ID: 29 - Verify that an unavailable dish has no [Pre-Order] button (Sold Out card in the design)

**Status: Failed** (Defect 8 (a disabled [Pre-Order] button is displayed; it is not clickable, so AC4 is met).)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- A dish with the status "On Stop" exists

**Steps:**
1. Open the Menu page as a Guest.
2. Look at the bottom of the card of the unavailable dish.

**Expected result:**
1. The card has no [Pre-Order] button (Figma, "Sold Out" card). If a button is kept, it must be disabled (AC4).

### ID: 30 - Verify that an unavailable dish can not be added to the cart by click or keyboard

**Status: Not executed** (Requires a live environment.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- A dish with the status "On Stop" exists

**Steps:**
1. Open the Menu page as a Guest.
2. Click the disabled button.
3. Focus the button with Tab and press Enter/Space.
4. Open the cart.

**Expected result:**
1. Nothing happens; the dish is not added to the cart; the cart counter is unchanged.

### ID: 31 - Verify that the Menu shows current data when the Guest opens the page

**Status: Not executed** (Requires a live environment and admin access.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- The price of a dish was changed by the administrator after the previous visit

**Steps:**
1. Open the Menu page as a Guest.
2. Find the changed dish.

**Expected result:**
1. The new price is displayed.

### ID: 32 - Verify that a refresh updates the availability of a dish

**Status: Not executed** (Requires a live environment and admin access.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- The Menu page is opened
- A dish is switched to "On Stop" by the administrator

**Steps:**
1. Refresh the page.

**Expected result:**
1. The dish is displayed as unavailable and can not be added.

### ID: 33 - Verify the add action for a dish that became unavailable while the Menu was open

**Status: Not executed** (Expected result is not defined in the story.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- The Menu page is opened
- A dish is switched to "On Stop" by the administrator

**Steps:**
1. Without refreshing click [Pre-Order] on that dish.

**Expected result:**
1. The dish is not added; a clear message is shown and the card is updated (expected result must be clarified, see R16).

### ID: 34 - Verify the behaviour when the Menu can not be loaded

**Status: Not executed** (Expected result is not defined in the story.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- The menu service is unavailable

**Steps:**
1. Open the Menu page as a Guest.

**Expected result:**
1. An error message with a retry action is displayed; no empty page and no technical details (expected result must be clarified, see R17).

### ID: 35 - Verify the behaviour when the location has no dishes

**Status: Not executed** (Expected result is not defined in the story.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- The location of the reservation has no dishes

**Steps:**
1. Open the Menu page as a Guest.

**Expected result:**
1. An empty-state message is displayed (expected result must be clarified, see R17).

### ID: 36 - Verify that the Menu layout is usable on a phone (375 px)

**Status: Not executed** (Only a desktop screenshot is available.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)
- Viewport width is 375 px

**Steps:**
1. Open the Menu page as a Guest.
2. Scroll through the dish list.
3. Switch the category tabs.

**Expected result:**
1. No horizontal scroll; cards, tabs and buttons are readable and tappable.

### ID: 37 - Verify the keyboard navigation of the Menu

**Status: Not executed** (Requires a live environment.)

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest has joined the session (entered the name)

**Steps:**
1. Open the Menu page as a Guest.
2. Navigate only with Tab / Shift+Tab / Enter.

**Expected result:**
1. The focus order is logical and visible; tabs, sorting and [Pre-Order] buttons are reachable; disabled buttons are skipped or announced as disabled.

## 4. Defect reports

Format follows the course template (ID, Summary, Pre-conditions, Steps, Actual result, Expected result, Env, Priority, Severity, Attachments).

### ID: 1 - The Guest sees the full registered-user header (Main page, Book a Table, Reservations, account icon) instead of the Guest header

Env: P_PRD | Priority: Medium | Severity: Major | Found by: TC6

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- Guest is not signed in

**Steps:**
1. Guest is redirected by the invited link and joins the session.
2. Open the Menu page.
3. Pay attention to the header.

**Actual result:** The header contains "Main page", "Book a Table", "Reservations" and the account icon. The cart icon is placed at the right edge of the green reservation strip, not in the header.

**Expected result:** Guest variant header (Figma): only the logo and the cart icon are shown in the header.

**Attachments:** Screenshot, area: the header and the right end of the green strip. (file: `implemented-menu-screenshot.webp`)

### ID: 2 - The reservation strip does not show the reservation date

Env: P_PRD | Priority: Medium | Severity: Minor | Found by: TC7

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"

**Steps:**
1. Guest is redirected by the invited link and joins the session.
2. Open the Menu page.
3. Read the green reservation strip.

**Actual result:** "You are making a pre-order for the reservation 48 Rustaveli Avenue, Table 1, 15:30 - 17:00" - the date is missing.

**Expected result:** "You are making a pre-order for the reservation 48 Rustaveli Avenue, Table 1, Oct 17, 2026, 12:00 - 13:30" - the date is shown before the time (Figma).

**Attachments:** Screenshot, area: the green reservation strip. (file: `implemented-menu-screenshot.webp`)

### ID: 3 - The category tabs differ from the design: an extra "All dishes" tab is selected by default and the "Desserts" tab is missing

Env: P_PRD | Priority: Medium | Severity: Major | Found by: TC9, TC10

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"

**Steps:**
1. Guest is redirected by the invited link and joins the session.
2. Open the Menu page.
3. Pay attention to the category tabs above the dish list.

**Actual result:** Tabs: "All dishes" (selected by default), "Appetizers", "Main Courses". There is no "Desserts" tab.

**Expected result:** Tabs: "Appetizers" (selected by default), "Main Courses", "Desserts" (Figma, AC1). There is no "All dishes" tab.

**Attachments:** Screenshot, area: the category tabs. Note: if the test data has no desserts, the expected behaviour for an empty category is not defined (R7, R17). (file: `implemented-menu-screenshot.webp`)

### ID: 4 - The badge of an unavailable dish says "Out Of Stock" instead of the label from the design

Env: P_PRD | Priority: Low | Severity: Minor | Found by: TC21

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- A dish with the status "On Stop" exists

**Steps:**
1. Guest is redirected by the invited link and joins the session.
2. Open the Menu page.
3. Find an unavailable dish (e.g. "Fresh Avocado Toast").
4. Pay attention to the badge in the right corner of the card.

**Actual result:** Badge "Out Of Stock".

**Expected result:** Badge "Sold Out" (Figma). The label must be aligned with AC4 ("On Stop") - see R14.

**Attachments:** Screenshot, area: the badges on the first two cards. (file: `implemented-menu-screenshot.webp`)

### ID: 5 - Different dishes are displayed with the same image

Env: P_PRD | Priority: Medium | Severity: Minor | Found by: TC16

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"

**Steps:**
1. Guest is redirected by the invited link and joins the session.
2. Open the Menu page.
3. Compare the images of "Fresh Avocado Toast", "Truffle Mushroom Risotto" and "Margherita Pizza".

**Actual result:** All three dishes show the same photo of a salad bowl.

**Expected result:** Each dish shows its own image that corresponds to the dish (AC2). If an image is missing, a placeholder defined by the design is shown.

**Attachments:** Screenshot, area: the three dish images. Can be test data; to be confirmed with the product team. (file: `implemented-menu-screenshot.webp`)

### ID: 6 - The serving size is displayed in different formats ("200g", "350g", "450 g")

Env: P_PRD | Priority: Low | Severity: Trivial | Found by: TC18

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"

**Steps:**
1. Guest is redirected by the invited link and joins the session.
2. Open the Menu page.
3. Compare the weight under the price on the three dish cards.

**Actual result:** "200g" and "350g" are written without a space; "450 g" is written with a space.

**Expected result:** The weight is displayed in one format on all cards, as in the design: a number, a space and "g" (e.g. "450 g").

**Attachments:** Screenshot, area: the weight under the price on the three cards. (file: `implemented-menu-screenshot.webp`)

### ID: 7 - The sorting control shows "Recommended" instead of the default "Popular First"

Env: P_PRD | Priority: Low | Severity: Minor | Found by: TC13

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"

**Steps:**
1. Guest is redirected by the invited link and joins the session.
2. Open the Menu page.
3. Look at the "Sort by" control.

**Actual result:** The default value is "Recommended".

**Expected result:** The default value is "Popular First"; options are Popular First, Newest First, Price: Low to High, Price: High to Low (Figma).

**Attachments:** Screenshot, area: the "Sort by" control. The dropdown options are not visible on the screenshot and still have to be checked. (file: `implemented-menu-screenshot.webp`)

### ID: 8 - A disabled [Pre-Order] button is displayed on the cards of unavailable dishes, the design shows no button

Env: P_PRD | Priority: Low | Severity: Minor | Found by: TC29

**Pre-conditions:**
- The Owner has generated and shared a valid link
- Reservation status is "Reserved"
- A dish with the status "On Stop" exists

**Steps:**
1. Guest is redirected by the invited link and joins the session.
2. Open the Menu page.
3. Compare the cards "Fresh Avocado Toast" and "Truffle Mushroom Risotto" with the Sold Out card in the design.

**Actual result:** Grey [Pre-Order] buttons are displayed under both unavailable dishes.

**Expected result:** The Sold Out card has no [Pre-Order] button (Figma: "Green Asparagus Salad"). If the product decides to keep it, it must stay disabled and not focusable (AC4).

**Attachments:** Screenshot, area: the buttons of the first two cards. (file: `implemented-menu-screenshot.webp`)
