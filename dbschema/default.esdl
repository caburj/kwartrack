module default {
  type ExpensifUser {
    required email: str {
      constraint exclusive;
    }
    required username: str {
      constraint exclusive;
    }
    required name: str;
    multi link accounts := .<owners[is ExpensifAccount];
  }

  # Represents a bank account.
  type ExpensifAccount {
    required name: str;
    multi owners: ExpensifUser;
    multi link partitions := .<account[is ExpensifPartition];
  }

  # Represents a partition of an account.
  # A partition is a subset of an account that is used for a specific purpose.
  # An example is a savings partition, and a spending partition.
  type ExpensifPartition {
    required name: str;
    required account: ExpensifAccount;
    multi link transactions := .<source_partition[is ExpensifTransaction];
  }

  type ExpensifCategory {
    required name: str {
      constraint exclusive;
    }
    multi link transactions := .<category[is ExpensifTransaction];
  }

  # Represents a transaction.
  type ExpensifTransaction {
    required date: datetime;
    required source_partition: ExpensifPartition;
    required category: ExpensifCategory;
    required value: decimal;
  }
}
