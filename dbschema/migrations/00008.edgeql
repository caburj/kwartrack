CREATE MIGRATION m1hndvvwh7gdgg3sofvyyk5qi65kv7d5kl4de3pkw3qbsuvkrfmmoq
    ONTO m1vzigws3dou5r6xdyphaga6qdsia6ikfl2rguwwykaxsjtneziwnq
{
  ALTER TYPE default::EAccount {
      ALTER PROPERTY label {
          USING ((((.logged_owner.name ++ "'s ") ++ .name) IF EXISTS (.logged_owner) ELSE .name));
      };
  };
};
