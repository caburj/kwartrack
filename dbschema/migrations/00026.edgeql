CREATE MIGRATION m1wdmykqraqd3rv435wjykejyo7x2q7lma5eudectut2cx4b43qh5a
    ONTO m1n2n4w32brlotbxhg4sioysohtadfjyq2nwtmnrb2mzaceil3st7a
{
  ALTER TYPE masterdb::EUser {
      CREATE LINK db := (.<users[IS masterdb::EDatabase]);
  };
};
