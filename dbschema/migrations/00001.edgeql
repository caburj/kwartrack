CREATE MIGRATION m1uicgfzlfgmbdczsfoeiowdbqttqpegtf4ig7qt26cxvqu7kx63la
    ONTO initial
{
  CREATE GLOBAL default::current_user_id -> std::uuid;
  CREATE REQUIRED GLOBAL default::tse_date -> std::datetime {
      SET default := (<std::datetime>'9999-12-30T23:59:59+00');
      CREATE ANNOTATION std::description := '\n      The end date of the transaction search range.\n      24 hours is added to this in the access policy to ensure that transactions on the end date are included.\n    ';
  };
  CREATE REQUIRED GLOBAL default::tss_date -> std::datetime {
      SET default := (<std::datetime>'0001-01-01T00:00:00+00');
      CREATE ANNOTATION std::description := 'The start date of the transaction search range.';
  };
  CREATE TYPE default::EAccount {
      CREATE REQUIRED PROPERTY current_balance: std::decimal {
          SET default := 0;
      };
      CREATE REQUIRED PROPERTY name: std::str;
  };
  CREATE TYPE default::EUser {
      CREATE REQUIRED PROPERTY email: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY name: std::str;
      CREATE REQUIRED PROPERTY username: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
  };
  ALTER TYPE default::EAccount {
      CREATE MULTI LINK owners: default::EUser;
  };
  ALTER TYPE default::EUser {
      CREATE MULTI LINK accounts := (.<owners[IS default::EAccount]);
  };
  CREATE TYPE default::EPartition {
      CREATE REQUIRED LINK account: default::EAccount;
      CREATE MULTI LINK owners := (.account.owners);
      CREATE REQUIRED PROPERTY current_balance: std::decimal {
          SET default := 0;
      };
      CREATE REQUIRED PROPERTY is_private: std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY name: std::str;
  };
  CREATE TYPE default::ETransaction {
      CREATE REQUIRED LINK source_partition: default::EPartition;
      CREATE MULTI LINK owners := (.source_partition.owners);
      CREATE REQUIRED PROPERTY value: std::decimal;
      CREATE LINK counterpart: default::ETransaction {
          CREATE ANNOTATION std::description := 'The counterpart transaction if this is a transfer.';
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE PROPERTY is_counterpart := (EXISTS (.<counterpart[IS default::ETransaction]));
      CREATE REQUIRED PROPERTY date: std::datetime {
          SET default := (std::datetime_of_statement());
          SET readonly := true;
      };
      CREATE PROPERTY description: std::str;
  };
  ALTER TYPE default::EAccount {
      CREATE MULTI LINK partitions := (.<account[IS default::EPartition]);
  };
  ALTER TYPE default::EPartition {
      CREATE MULTI LINK transactions := (.<source_partition[IS default::ETransaction]);
      CREATE PROPERTY balance := (std::sum(.transactions.value));
  };
  ALTER TYPE default::EAccount {
      CREATE MULTI LINK transactions := (.partitions.transactions);
      CREATE PROPERTY balance := (std::sum(.partitions.balance));
  };
  ALTER TYPE default::EUser {
      CREATE MULTI LINK transactions := (.accounts.transactions);
      CREATE PROPERTY balance := (std::sum(.accounts.balance));
  };
  CREATE SCALAR TYPE default::ECategoryKind EXTENDING enum<Income, Expense, Transfer>;
  CREATE TYPE default::ECategory {
      CREATE REQUIRED PROPERTY current_balance: std::decimal {
          SET default := 0;
      };
      CREATE REQUIRED PROPERTY kind: default::ECategoryKind;
      CREATE REQUIRED PROPERTY name: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
  };
  ALTER TYPE default::ETransaction {
      CREATE REQUIRED LINK category: default::ECategory;
  };
  ALTER TYPE default::ECategory {
      CREATE MULTI LINK transactions := (.<category[IS default::ETransaction]);
      CREATE PROPERTY balance := (std::sum(.transactions.value));
  };
  ALTER TYPE default::EUser {
      CREATE MULTI LINK categories := (SELECT
          default::ECategory
      );
  };
};
