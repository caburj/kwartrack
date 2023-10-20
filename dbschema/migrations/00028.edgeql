CREATE MIGRATION m1romj6r4wpcxfdf2yc5fjqjoeituhqkbwjq4ckjbni3xcdj3hx7da
    ONTO m1ymhyccfvly5d456v22n4kplqhszh3smehb4tngidiwmua5y2rjsa
{
  ALTER TYPE default::EAccount {
      ALTER PROPERTY is_owned {
          USING ((std::any((.owners = GLOBAL default::current_user)) OR NOT (EXISTS (.owners))));
      };
  };
};
