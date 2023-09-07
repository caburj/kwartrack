CREATE MIGRATION m1waplvjuijvmpxqfc7vjv2nx2brornhy5egtbutlkmp4hl46nlfaa
    ONTO m1n6iwldxrnsefzud3ployqsx7ypbcm6nxranxunhlx7rdx3pijb2a
{
  ALTER TYPE default::EAccount {
      ALTER PROPERTY label {
          USING ((((.owners.name ++ "'s ") ++ .name) IF (std::count(.owners) = 1) ELSE ((.logged_owner.name ++ "'s ") ++ .name)));
      };
  };
};
