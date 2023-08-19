CREATE MIGRATION m1urvtoqtnyqlrxxrymlzu7aij3fbatzr4qs2y3d74z7dz7267ixta
    ONTO m1r3y4oal36v3kkj7jq62mzagtjrd6ie6qo3pgvyke2sbnh63f7xmq
{
  ALTER TYPE default::ExpensifTransaction {
      ALTER PROPERTY date {
          SET default := (std::datetime_of_statement());
          SET readonly := true;
      };
  };
};
