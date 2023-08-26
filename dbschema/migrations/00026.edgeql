CREATE MIGRATION m1fizqfvaddki5ru2tys2e4alwjhwblrupwx3ubfaoolzisoamug4a
    ONTO m1g2z3kaplmrxfska56jyiapvhdo4qady5h65ilhyegjyiik7e7zaa
{
  ALTER TYPE default::ETransaction {
      ALTER PROPERTY date {
          RESET readonly;
      };
  };
};
