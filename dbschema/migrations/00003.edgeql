CREATE MIGRATION m1fk4ttdzmglzyelanwqwng72xzxfw4vuvbj6ojbcvkd4lyllrrbtq
    ONTO m1ewgpolpcrmaa7dg5wzepf6hl4mdwih3ppfk5audfqxefcps7fgna
{
  ALTER TYPE default::User RENAME TO default::ExpensifUser;
  CREATE TYPE default::ExpensifAccount {
      CREATE REQUIRED LINK owner: default::ExpensifUser;
      CREATE REQUIRED PROPERTY name: std::str;
  };
  CREATE TYPE default::ExpensifPartition {
      CREATE REQUIRED LINK account: default::ExpensifAccount;
      CREATE REQUIRED PROPERTY name: std::str;
  };
  CREATE TYPE default::ExpensifCategory {
      CREATE REQUIRED PROPERTY name: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
  };
  CREATE TYPE default::ExpensifTransaction {
      CREATE REQUIRED LINK category: default::ExpensifCategory;
      CREATE REQUIRED LINK source_partition: default::ExpensifPartition;
      CREATE REQUIRED PROPERTY date: std::datetime;
      CREATE REQUIRED PROPERTY value: std::decimal;
  };
};
