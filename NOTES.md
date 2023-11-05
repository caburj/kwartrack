# TO REMEMBER

- A transfer should always be represented by 2 transactions, one for the send
  transaction and one for the receipt transaction.
  - This is important because it's possible that one of the transactions comes
    from a private partition.
- Transactions with private category and public partition is not allowed.
  - A public category with public partition transactions can't be changed to a
    private category.
  - A private partition with private category transactions can't be changed to a
    public partition.
- Badge variant convention
  - Owned Private -> outline
  - Owned visible -> soft
  - Not editable -> surface
  - Not owned private -> outline


# TODO

* [ ] Animated new transaction record and also animated deletion of transaction.

* [ ] Allow changing the color of each partition and category.

* [ ] Allow assigning different owners if there are multiple users in the db
  when...
  * [ ] editing account
  * [ ] editing category

* [ ] Transactions page loading screen.

* [ ] Fix: The skeleton component is very bright in dark mode.

* [ ] A better way to invalidate queries when making mutations.
  - Can we find a declarative way?

* [ ] Migration.
  - Looks like piecewise migrations are needed when developing new features.

* [ ] Divine recommendations
  * [ ] Link categories to partitions.
    * Idea: We should allow default partitions when selecting certain
      categories. E.g. Travel Expense should by default be an expense from
      Travel Partition.
  * [ ] Allow restricting a partition to make manual transaction like expenses.
    The idea is that when you create a "Savings" partition, you normally don't
    want to touch it. It should be moved to a different partition first, in
    order to use.
    * We should allow loan from it.

* [ ] Make the invitation of users accessible.

* [ ] Upgrade edgedb to 4.

* [ ] Switch to edgedb auth after switching to edgedb 4.

* [ ] Switch to nextjs 14.

* [ ] Native mobile app for recording. Or just an endpoint that shows a mobile
  view?
  * `ua-parser` might help.


# IDEA / NICE TO HAVE (MAYBE)

* [ ] Each transaction row should be a different query.
  - One query to ask for the ids of the transactions to display.
    - Each id will correspond to a transaction row and data in each row will be
      fetched by a query.
  - With this, when editing a transaction, we don't need to fetch the whole
    table.
  - As a result, initial page load is slow, but modification is fast.
  - ! Looks like it's not a good idea because it's rare to make modifications in
      the records.

* [ ] Undo/Redo
  - This is probably very difficult.

* [ ] Allow navigating in the table cells using arrow keys and also editing.
  - Highlight focused cell.

* [ ] Show paid loans.

* [ ] When an account contains one partition:
  - When selecting a partition, the account should be one of the options.
    Selecting it will select the single linked partition.
  - [ ] When creating an account, the form should ask if the user wants to have
    partitions.
    - If user chooses to have partitions, then the form should ask for the
      partition names.
    - Otherwise, a default partition will be created.
  - The idea is to hide the notion of partitions until the user needs it.
  - E.g.
    - Given the following accounts and partitions:
      - Account: "Cash"
        - Partition: "Default"
      - Account: "Bank"
        - Partition: "Budget"
        - Partition: "Personal"
        - Partition: "Savings"

    - The partition selection should be:
      - option: Cash
      - optgroup: Bank
        - option: Budget
        - option: Personal
        - option: Savings

    - And the account section in the sidebar should look like:
      - Cash:        $100
      - Bank:        $100
        - Budget:     $50
        - Personal:   $30
        - Savings:    $20


# DONE

* [X] It's annoying when the columns change width when the content changes.
  Width of the columns should be fixed.
  * Done by setting the width and min-width of the sidebar to be equal.

* [X] Delete button should only be visible to the owner of the transaction.

* [X] Recording a transaction may take time. Show a spinner and deactivate the
  onSubmit when it's in progress.
  - Also, maybe disable the form fields when in progress?
  - [DONE] No spinner, instead disabled submit button. Also the inputs are
    disabled.

* [X] Rearrange the accounts.
  - Personally owned accounts at the top.
  - Common accounts in the middle.
  - Other accounts at the bottom.

* [X] imp: Allow deleting accounts, partitions and categories.
  - Only delete them if no linked transactions.
  - Only delete account if no linked partitions.

* [X] Should be able to see counterpart of transactions with private sources.
  - It should look like: Private Partition -> Owned Partition

* [X] Horizontal scroll for the transactions table.

* [X] fix: Resetting the transaction form doesn't work when making a transfer.
  - It's the same problem in the Partition dialog form, that's why it's many
    visible input elements at the moment.

* [X] Bordered sidebar with darker (or different) background.

* [X] When only one partition is selected in the side bar, use that as default
  partition.
  - Do not automatically clear partition when selecting a category.

* [X] Loans
  * [X] Allow making payments.
  * [X] Filter loans. When clicking a loan, show the linked transactions (which
    includes the payments).
  * [X] Show "Private" as name if private. Also, show prefixed account name.

* [X] Allow editing loan transactions
  * [X] Show an indicator that a transaction is a loan or payment.
  * [X] Do not allow deleting/editing a loan if it already has a payment.
  * [X] Do not allow deleting/editing a payment.

* [X] Show description in tooltip for unpaid loans.

* [X] Better controls at the top of the transactions table.
  * [X] Prettify the date section.

* [X] Properly handle "undefined" result from rpc, also error.
  - Use toast notification. https://sonner.emilkowal.ski

* [X] Authentication.

* [X] It's correct to disallow editing a payment transaction. However, user
  should be able to delete a payment.

* [X] Reset the current page whenever the filter is changed.

* [X] Loading of the transactions table.

* [X] Prepare a script to migrate all db in a given edgedb instance.
  - script: `migrate-all`

* [X] Allow hiding emptied accounts -- accounts with transactions but with 0 or
  less balance.
  - Maybe show the delete button, but instead of completely deleting the
    account, only archive it.
    - And archived accounts should be hidden.

* [X] Allow editing amount and description.
  - Amount and description is rendered as input.
    - Update the transaction at onBlur.

* [X] Allow editing the accounts, partitions, and categories.
  * [X] Edit partition.
  * [X] Edit category.
  * [X] Edit account.

* [X] Allow editing date
  - Clicking the date will show the date picker.

* [X] Fix: When setting a date different from today, the time is not considered.

* [X] Fix: When hovering to the date input, it should be cursor pointer.

* [X] User registration.
  * The first user to register has admin access.
  * Existing user can invite other users.
    * An admin can invite another admin or a basic user.
    * Invited admin will be given an option to start his own db or join the
      inviter's db.
  * [X] A newly create db will automatically have one Account with one Partition,
    and a set of categories.
  * [X] Protect `/<dbname>/<username>`. Only the username of the authenticated
    user is allowed to be accessed.
  * [X] When no user in the `edgedb` db, redirect to onboarding of first user.
  * [X] Onboarding page should not be accessible when there are already users.
    * Test this.

* [X] change `/<dbname>/<username>` to `/<username>/expense-tracker`

* [X] Rename repo to "kwartrack".

* [X] Write docs on...
  * [X] How to get started.
  * [X] How to deploy.

* [X] The "show-overall" option should also affect the charts.

* [X] When nothing to display in the charts container, show "No charts the
  display".

* [X] Negative values are red, positive are black. Font weight should just be
  the same.


# CANCELLED

* [ ] A way to reinitialize the database.
  - During dev, we want to start from scratch.
  - When starting from scratch, the micro migration steps should be ignored.
    - There is no point in running the migration steps, it can just be
      initialized with the latest schema.
  - Just use `edgedb database drop <dbname>` and sign-up a new user to create a
    new db.

* [ ] User registration.
  - NOTE: This is cancelled in favor of a simpler specs.
  - 2 cases
    - user will start his own db
    - user will register to an existing db
  * [ ] Case 1: User will start his own db
    * [ ] After registration, show the user a wizard to:
      * [ ] Create accounts and partitions
        - Should contain minimal explanations to introduce the concept of
          accounts and partitions.
        * [ ] This new user is required to create 1 account and 1 partition.
      * [ ] Show list of categories to create.
        - Provide default set of options that can be selected/deselected.
          - Potential options list:
            - Income
              - Initial balance
              - Salary
              - Reimbursements
            - Expense
              - Groceries
              - Restaurant
              - Transportation
              - Entertainment
              - Shopping
              - Health
            - Transfer
              - Transfer
        - Should contain minimal explanations to introduce the concept of
          "Transfer".
      * [ ] Afterwards, the user is redirected to the main UI.

  * [ ] Case 2: User will join an existing db.
    - The owner will invite the new user.
    * [ ] From the main UI, the owner will have a form to invite the new user.
    * [ ] The new user will be shown a page to accept the invitation.
      * [ ] After accepting, the new user will be shown a wizard:
        * [ ] Show the common (or existing visible) accounts and provide minimal
          explanation.
        * [ ] No need to offer creation of new accounts/partitions.
          - He'll have the chance of creating new records in the main UI.
        * [ ] Same with categories, show the existing categories and provide
          simple explanations.
      * [ ] Then redirect to the main UI.

* [ ] Fix: Only existing users can invite.
  - Already the case.
