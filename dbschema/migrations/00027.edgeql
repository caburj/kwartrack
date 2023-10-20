CREATE MIGRATION m1ymhyccfvly5d456v22n4kplqhszh3smehb4tngidiwmua5y2rjsa
    ONTO m1wdmykqraqd3rv435wjykejyo7x2q7lma5eudectut2cx4b43qh5a
{
  ALTER TYPE masterdb::EDatabase {
      ALTER LINK users {
          ON TARGET DELETE ALLOW;
      };
  };
};
