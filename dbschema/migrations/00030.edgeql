CREATE MIGRATION m1fpomjaw6wa4wmdwan4i6pe6l73c3pm5geue7jazvabowp6w7rjfq
    ONTO m1zbqdgwuhlx6hmgl4rmf77vdaqz3i4huddnkjmhcvvvpispehxf7q
{
  ALTER TYPE masterdb::EInvitation {
      CREATE LINK db: masterdb::EDatabase {
          ON TARGET DELETE DELETE SOURCE;
          CREATE ANNOTATION std::description := 'This database is already created exlusively for this new user.';
          CREATE CONSTRAINT std::exclusive;
      };
      DROP PROPERTY allow_new_db;
  };
};
