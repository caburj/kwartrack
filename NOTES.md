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

* [ ] Prettier display for the number-of-items-per-page input.

* [ ] Properly handle "undefined" result from rpc, also error.

* [ ] User registration.
  * [ ] Ask if the user wants a new db or join an existing one.
    * [ ] If the user wants a new db, then create a new db.
      * [ ] automatically create a default set of categories.
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
    * [ ] If the user wants to join an existing db, then ask for the db name.
      * [ ] The new user will be added to the db.
  * [ ] Create one default account and a corresponding default partition.
    - Account name: "Default"
    - Partition name: "Default"
    - The account section in the sidebar should be replaced with the balance of
      the default account.
    - Since there is only one partition, use that partition when creating new
      transactions. So no need to show the partition selection if there is only
      one partition.

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
