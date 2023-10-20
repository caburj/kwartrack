CREATE MIGRATION m15z4o7t66yfo4lkwkssz3ypfdcazzn3z5dlfg262kxgok26hdmala
    ONTO m12yohqlcohdywv6hpojqrrxipdjf6hqqviai6qvisvutzoo3kpema
{
  ALTER TYPE masterdb::EUser {
      CREATE LINK db: masterdb::EDatabase;
  };
};
