CREATE MIGRATION m12yohqlcohdywv6hpojqrrxipdjf6hqqviai6qvisvutzoo3kpema
    ONTO m13azfvlun62gxqivtkxehftfhhyvmd3r6d2ayvxtmguynlt7k3f2a
{
  ALTER TYPE masterdb::EDatabase {
      ALTER LINK users {
          CREATE CONSTRAINT std::exclusive;
      };
  };
};
