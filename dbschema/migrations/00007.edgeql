CREATE MIGRATION m1vzigws3dou5r6xdyphaga6qdsia6ikfl2rguwwykaxsjtneziwnq
    ONTO m1e7bo6m7x4nsv77cezscl7u5wznunq33qotlgpz25cgxuwkvrgm3a
{
  ALTER TYPE default::EAccount {
      CREATE LINK logged_owner := ((.owners INTERSECT GLOBAL default::current_user));
      CREATE PROPERTY label := (((.name ++ ' - ') ++ .logged_owner.name));
  };
  ALTER TYPE default::EPartition {
      CREATE PROPERTY label := ((((.name ++ ' (') ++ .account.label) ++ ')'));
  };
};
