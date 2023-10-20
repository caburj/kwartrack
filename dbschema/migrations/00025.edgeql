CREATE MIGRATION m1n2n4w32brlotbxhg4sioysohtadfjyq2nwtmnrb2mzaceil3st7a
    ONTO m15z4o7t66yfo4lkwkssz3ypfdcazzn3z5dlfg262kxgok26hdmala
{
  ALTER TYPE masterdb::EUser {
      DROP LINK db;
  };
};
