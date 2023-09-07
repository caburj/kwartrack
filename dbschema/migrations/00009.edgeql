CREATE MIGRATION m1n6iwldxrnsefzud3ployqsx7ypbcm6nxranxunhlx7rdx3pijb2a
    ONTO m1hndvvwh7gdgg3sofvyyk5qi65kv7d5kl4de3pkw3qbsuvkrfmmoq
{
  ALTER TYPE default::EAccount {
      ALTER PROPERTY label {
          USING ((((.owners.name ++ "'s ") ++ .name) IF (std::count(.owners) = 1) ELSE .name));
      };
  };
};
