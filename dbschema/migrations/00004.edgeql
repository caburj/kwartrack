CREATE MIGRATION m1qer2koevdbklw77a4zabcv7pz7yqy6yrxl73ylmxr3sukszmozsa
    ONTO m1fk4ttdzmglzyelanwqwng72xzxfw4vuvbj6ojbcvkd4lyllrrbtq
{
  ALTER TYPE default::ExpensifAccount {
      CREATE MULTI LINK partitions := (.<account[IS default::ExpensifPartition]);
  };
  ALTER TYPE default::ExpensifCategory {
      CREATE MULTI LINK transactions := (.<category[IS default::ExpensifTransaction]);
  };
  ALTER TYPE default::ExpensifPartition {
      CREATE MULTI LINK transactions := (.<source_partition[IS default::ExpensifTransaction]);
  };
};
