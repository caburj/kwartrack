CREATE MIGRATION m15o7ifrj5h5summhndfbznzngmrsge3kw4jyirb4fkfknpxxlttka
    ONTO m145o6y4z6auz5vkrtnxlhgna3slfuejxnxqxv3rxta6gw555dr4fq
{
  ALTER TYPE default::EPartition {
      CREATE MULTI LINK owners := (.account.owners);
  };
  ALTER TYPE default::ETransaction {
      CREATE MULTI LINK owners := (.source_partition.owners);
  };
};
