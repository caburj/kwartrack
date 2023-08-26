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
    multi link transactions := .accounts.transactions;
    property balance := sum(.accounts.balance);
    multi link categories := (select ECategory);
  }

  # Represents a bank account.
  type EAccount {
    required name: str;
    multi owners: EUser;

    multi link partitions := .<account[is EPartition];
    property balance := sum(.partitions.balance);
    multi link transactions := .partitions.transactions;
  }

  # Represents a partition of an account.
  # A partition is a subset of an account that is used for a specific purpose.
  # An example is a savings partition, and a spending partition.
  type EPartition {
    required name: str;
    required account: EAccount;
    required property is_private: bool {
      default := false;
    }

    multi link transactions := .<source_partition[is ETransaction];
    property balance := sum(.transactions.value);
    multi link owners := .account.owners;
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
    description: str;

    multi link owners := .source_partition.owners;
  }
}
