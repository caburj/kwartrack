CREATE MIGRATION m1r3y4oal36v3kkj7jq62mzagtjrd6ie6qo3pgvyke2sbnh63f7xmq
    ONTO m1sejfi4fcii6ujena3fpz5nlcuexy7rg5rh37p3mtn6yhq35cb72a
{
  ALTER TYPE default::ExpensifAccount {
      CREATE MULTI LINK owners: default::ExpensifUser;
  };
  ALTER TYPE default::ExpensifUser {
      ALTER LINK accounts {
          USING (.<owners[IS default::ExpensifAccount]);
      };
  };
  ALTER TYPE default::ExpensifAccount {
      DROP LINK owner;
  };
};
