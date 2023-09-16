CREATE MIGRATION m1xhjc7sorxbxfluqignykspekbxhyuyfgvjg4f2hqm6ueg7mr2enq
    ONTO m1qgueuatrc5jscpcqjzqxzqmntqp6piovck72wccbd3qub7yt3juq
{
  ALTER TYPE default::EPartition {
      CREATE PROPERTY is_empty := (NOT (EXISTS (.<source_partition[IS default::ETransaction])));
  };
  ALTER TYPE default::EAccount {
      CREATE PROPERTY is_empty := (std::all(.partitions.is_empty));
  };
  ALTER TYPE default::ECategory {
      CREATE PROPERTY is_empty := (NOT (EXISTS (.<category[IS default::ETransaction])));
  };
};
