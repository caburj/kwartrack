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

* [ ] Delete button should only be visible to the owner of the transaction.

* [ ] Prettier display for the number-of-items-per-page input.

# DONE

* [X] It's annoying when the columns change width when the content changes.
  Width of the columns should be fixed.
  * Done by setting the width and min-width of the sidebar to be equal.
