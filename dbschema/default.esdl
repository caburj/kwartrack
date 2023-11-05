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
    property is_owned := any(.owners = global current_user) or not exists .owners;
    property is_empty := all(.partitions.is_empty);
  }

  # Represents a partition of an account.
  # A partition is a subset of an account that is used for a specific purpose.
  # An example is a savings partition, and a spending partition.
  type EPartition {
    required name: str;
    required account: EAccount {
      on target delete delete source;
    }
    required property is_private: bool {
      default := false;
      annotation description := "Only the owners can see this partition and its transactions."
    }
    required property archived: bool {
      default := false;
      annotation description := "Archived partitions are hidden by default. And can't be used for new transactions."
    }

    multi link owners := .account.owners;
    property is_owned := .account.is_owned;
    property is_visible := not .is_private or global current_user.is_admin or .is_owned;
    property is_empty := not exists .<source_partition[is ETransaction];
  }

  type ECategory {
    required name: str {
      constraint exclusive;
    }
    required kind: ECategoryKind;
    multi owners: EUser;
    required property is_private: bool {
      default := false;
      annotation description := "
        Only the owners can see this category. Only transactions
        with public partition can be linked to this category.
      "
    }
    default_partition: EPartition {
      annotation description := "This partition is automatically selected when creating a new transaction with this category.";
    }

    property is_owned := any(.owners = global current_user) or not exists .owners;
    property is_visible := not .is_private or global current_user.is_admin or .is_owned;
    property is_empty := not exists .<category[is ETransaction];
  }

  # Represents a transaction.
  type ETransaction {
    required date: datetime {
      default := datetime_of_statement();
    }
    required source_partition: EPartition;
    required category: ECategory;
    required value: decimal;
    description: str;
    counterpart: ETransaction {
      constraint exclusive;
      annotation description := "The counterpart transaction if this is a transfer.";

      # When this transaction or counterpart is deleted, delete the other one.
      on source delete delete target;
      on target delete delete source;
    }

    property is_counterpart := exists .<counterpart[is ETransaction];
    multi link owners := .source_partition.owners;
    property is_owned := .source_partition.is_owned;
    property is_visible := .source_partition.is_visible;
  }

  type ELoan {
    required transaction: ETransaction {
      constraint exclusive;
      on source delete delete target;
    }
    required amount_to_pay: decimal;
    property amount := math::abs(.transaction.value);
    multi link payments := .<loan[is EPayment];
    property amount_paid := sum(math::abs(.payments.transaction.value));
    property is_paid := .amount_paid >= .amount_to_pay;
  }

  type EPayment {
    required loan: ELoan;
    required transaction: ETransaction {
      constraint exclusive;
      on source delete delete target;
    }
  }
}

module masterdb {
  type EUser {
    required email: str {
      constraint exclusive;
    }
    required username: str {
      constraint exclusive;
    }
    required name: str;
    link db := .<users[is EDatabase];
  }

  type EDatabase {
    required name: str {
      constraint exclusive;
    }
    multi users: EUser {
      # one-to-many relationship
      constraint exclusive;
      on target delete allow;
    }
  }

  type EInvitation {
    required email: str {
      constraint exclusive;
    }
    required code: str {
      constraint exclusive;
      annotation description := "The code that the user must enter to accept the invitation.";
    }
    required inviter: EUser;
    # Delete the record if the invitation is rejected.
    required is_accepted: bool {
      default := false;
      annotation description := "True if the invitation has been accepted. False if pending.";
    }
    db: EDatabase {
      constraint exclusive;
      on target delete delete source;
      annotation description := "This database is already created exlusively for this new user."
    }
  }
}
