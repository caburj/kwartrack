module default {
  global current_user_id: uuid;

  scalar type ECategoryKind extending enum<Income, Expense, Transfer>;

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
    required current_balance: decimal {
      default := 0;
    }

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
    required current_balance: decimal {
      default := 0;
    }

    multi link transactions := .<source_partition[is ETransaction];
    property balance := sum(.transactions.value);
    multi link owners := .account.owners;
  }

  type ECategory {
    required name: str {
      constraint exclusive;
    }
    required kind: ECategoryKind;
    required current_balance: decimal {
      default := 0;
    }

    multi link transactions := .<category[is ETransaction];
    property balance := sum(.transactions.value);
  }

  # Represents a transaction.
  type ETransaction {
    required date: datetime {
      default := datetime_of_statement();
      readonly := true;
    }
    required source_partition: EPartition;
    required category: ECategory;
    required value: decimal;
    description: str;
    counterpart: ETransaction {
      constraint exclusive;
      annotation description := "The counterpart transaction if this is a transfer.";
    }

    property is_counterpart := exists .<counterpart[is ETransaction];
    multi link owners := .source_partition.owners;
  }
}
