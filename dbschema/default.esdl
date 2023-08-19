module default {
  type EUser {
    required email: str {
      constraint exclusive;
    }
    required username: str {
      constraint exclusive;
    }
    required name: str;
    multi link accounts := .<owners[is EAccount];
  }

  # Represents a bank account.
  type EAccount {
    required name: str;
    multi owners: EUser;
    multi link partitions := .<account[is EPartition];
    property balance := sum(.partitions.balance);
  }

  # Represents a partition of an account.
  # A partition is a subset of an account that is used for a specific purpose.
  # An example is a savings partition, and a spending partition.
  type EPartition {
    required name: str;
    required account: EAccount;
    multi link transactions := .<source_partition[is ETransaction];
    property balance := sum(.transactions.value);
  }

  type ECategory {
    required name: str {
      constraint exclusive;
    }
    multi link transactions := .<category[is ETransaction];
    property balance := sum(.transactions.value);
  }

  # Represents a transaction.
  type ETransaction {
    required date: datetime {
      readonly := true;
      default := datetime_of_statement();
    }
    required source_partition: EPartition;
    required category: ECategory;
    required value: decimal;
  }
}