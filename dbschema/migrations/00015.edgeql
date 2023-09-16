CREATE MIGRATION m1odp7hgwtpjtqxbqvu5vxkdyzepws26ljylei7qa2dp3lo4omxgpq
    ONTO m1xhjc7sorxbxfluqignykspekbxhyuyfgvjg4f2hqm6ueg7mr2enq
{
  ALTER TYPE default::EPartition {
      ALTER LINK account {
          ON TARGET DELETE DELETE SOURCE;
      };
  };
};
