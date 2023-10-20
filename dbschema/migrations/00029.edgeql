CREATE MIGRATION m1zbqdgwuhlx6hmgl4rmf77vdaqz3i4huddnkjmhcvvvpispehxf7q
    ONTO m1romj6r4wpcxfdf2yc5fjqjoeituhqkbwjq4ckjbni3xcdj3hx7da
{
  ALTER TYPE masterdb::EInvitation {
      ALTER PROPERTY is_admin {
          RENAME TO allow_new_db;
      };
  };
};
