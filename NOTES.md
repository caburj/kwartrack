- A transfer should always be represented by 2 transactions, one for the send
  transaction and one for the receipt transaction.
  - This is important because it's possible that one of the transactions comes
    from a private partition.
- Transactions with private category and public partition is not allowed.
  - A public category with public partition transactions can't be changed to a
    private category.
  - A private partition with private category transactions can't be changed to a
    public partition.

# TODO

* [ ] A way to reinitialize the database.
  - During dev, we want to start from scratch.
  - When starting from scratch, the micro migration steps should be ignored.
    - There is no point in running the migration steps, it can just be
      initialized with the latest schema.

* [ ] Migration.
  - Looks like piecewise migrations are needed when developing new features.

* [ ] Prepare a script to migrate all db in a given edgedb instance.

* [ ] Prettier display for the number-of-items-per-page input.

* [ ] Properly handle "undefined" result from rpc, also error.

* [ ] Simpler way to declare invalidated queries.

* [ ] Allow editing the accounts, partitions, and categories.
  - Always edit mode in the sidebar?

* [ ] Allow hiding emptied accounts.
  - Maybe show the delete button, but instead of completely deleting the
    account, only archive it.
    - And archived accounts should be hidden.

* [ ] User registration.
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

* [ ] Prettify the date section.

* [ ] fix: Resetting the transaction form doesn't work when making a transfer.
  - It's the same problem in the Partition dialog form, that's why it's many
    visible input elements at the moment.


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
