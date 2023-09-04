CREATE MIGRATION m1rrnjotkxixdyfpzximbwaffvmenbhunzzs33kgwxx7cohle47poa
    ONTO m13y4rysne4kc7zhduhzyerotyydbqthbmpsr4lmmaohjwdpbzqpza
{
  ALTER TYPE default::EUser {
      CREATE REQUIRED PROPERTY is_admin: std::bool {
          SET default := false;
      };
  };
  CREATE GLOBAL default::current_user := (SELECT
      default::EUser
  FILTER
      (.id = GLOBAL default::current_user_id)
  );
  ALTER TYPE default::EPartition {
      CREATE PROPERTY is_visible := (((NOT (.is_private) OR (GLOBAL default::current_user).is_admin) OR std::any((.owners.id = GLOBAL default::current_user_id))));
  };
  ALTER TYPE default::ETransaction {
      CREATE PROPERTY is_visible := (.source_partition.is_visible);
  };
};
