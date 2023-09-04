module default {
  global current_user_id: uuid;
  global current_user := (select EUser filter .id = global current_user_id);

  scalar type ECategoryKind extending enum<Income, Expense, Transfer>;

  type EUser {
    required email: str {
      constraint exclusive;
    }
    required username: str {
      constraint exclusive;
    }
    required is_admin: bool {
      default := false;
    }
    required name: str;

    multi link accounts := .<owners[is EAccount];
  }

  # Represents a bank account.
  type EAccount {
    required name: str;
    multi owners: EUser;

    multi link partitions := .<account[is EPartition];
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

    multi link owners := .account.owners;
    property is_visible := not .is_private or global current_user.is_admin or any(.owners.id = global current_user_id)
  }

  type ECategory {
    required name: str {
      constraint exclusive;
    }
    required kind: ECategoryKind;

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
    property is_visible := .source_partition.is_visible;
  }
}
