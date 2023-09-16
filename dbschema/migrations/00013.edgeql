CREATE MIGRATION m1qgueuatrc5jscpcqjzqxzqmntqp6piovck72wccbd3qub7yt3juq
    ONTO m1swgkx6gfg56yp7pcyv2474mhkvpyxs5ykp25hdxtb5l73kjpg3ha
{
  ALTER TYPE default::EAccount {
      CREATE PROPERTY is_owned := (std::any((.owners = GLOBAL default::current_user)));
  };
  ALTER TYPE default::EPartition {
      CREATE PROPERTY is_owned := (.account.is_owned);
      ALTER PROPERTY is_visible {
          USING (((NOT (.is_private) OR (GLOBAL default::current_user).is_admin) OR .is_owned));
      };
  };
  ALTER TYPE default::ETransaction {
      CREATE PROPERTY is_owned := (.source_partition.is_owned);
  };
  ALTER TYPE default::ECategory {
      CREATE PROPERTY is_owned := (std::any((.owners = GLOBAL default::current_user)));
      ALTER PROPERTY is_visible {
          USING (((NOT (.is_private) OR (GLOBAL default::current_user).is_admin) OR .is_owned));
      };
  };
};
