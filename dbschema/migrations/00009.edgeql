CREATE MIGRATION m1tzlh5icqr25ajp5okdzgamwqrjjissccjt3sm6cozgwx3dzrexqa
    ONTO m1urvtoqtnyqlrxxrymlzu7aij3fbatzr4qs2y3d74z7dz7267ixta
{
  ALTER TYPE default::ExpensifPartition {
      CREATE PROPERTY balance := (std::sum(.transactions.value));
  };
  ALTER TYPE default::ExpensifAccount {
      CREATE PROPERTY balance := (std::sum(.partitions.balance));
  };
  ALTER TYPE default::ExpensifCategory {
      CREATE PROPERTY balance := (std::sum(.transactions.value));
  };
};
