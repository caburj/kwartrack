CREATE MIGRATION m1e7bo6m7x4nsv77cezscl7u5wznunq33qotlgpz25cgxuwkvrgm3a
    ONTO m14bhijbkmt2zwuezn4mwfy3qu3f4llylgwkc6kkvtdzmez6lsezna
{
  ALTER TYPE default::ECategory {
      CREATE MULTI LINK owners: default::EUser;
  };
  ALTER TYPE default::ECategory {
      CREATE REQUIRED PROPERTY is_private: std::bool {
          SET default := false;
          CREATE ANNOTATION std::description := '\n        Only the owners can see this category. Only transactions\n        with public partition can be linked to this category.\n      ';
      };
  };
  ALTER TYPE default::ECategory {
      CREATE PROPERTY is_visible := (((NOT (.is_private) OR (GLOBAL default::current_user).is_admin) OR std::any((.owners = GLOBAL default::current_user))));
  };
  ALTER TYPE default::ECategory {
      DROP PROPERTY balance;
  };
  ALTER TYPE default::ECategory {
      DROP LINK transactions;
  };
  ALTER TYPE default::EPartition {
      ALTER PROPERTY is_private {
          CREATE ANNOTATION std::description := 'Only the owners can see this partition and its transactions.';
      };
      ALTER PROPERTY is_visible {
          USING (((NOT (.is_private) OR (GLOBAL default::current_user).is_admin) OR std::any((.owners = GLOBAL default::current_user))));
      };
  };
};
