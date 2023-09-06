- A transfer should always be represented by 2 transactions, one for the send
  transaction and one for the receipt transaction.
  - This is important because it's possible that one of the transactions comes
    from a private partition.
- Transactions with private category and public partition is not allowed.
  - A public category with public partition transactions can't be changed to a
    private category.
  - A private partition with private category transactions can't be changed to a
    public partition.
