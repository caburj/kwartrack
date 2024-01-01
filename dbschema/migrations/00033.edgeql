CREATE MIGRATION m1ayutao2ggu6j6y2qp6qkibnzozj2bk2lstw5m2ypczy4aaqhxs4a
    ONTO m1qh7x5xdwnrfq2bur7shmnkle5x7f2u6bhqyr25pzsblqricbqaoq
{
  CREATE TYPE default::EBudgetProfile {
      CREATE MULTI LINK owners: default::EUser {
          CREATE ANNOTATION std::description := 'Users that can see this budget profile. If empty, all users can see it.';
      };
      CREATE MULTI LINK partitions: default::EPartition {
          CREATE ANNOTATION std::description := 'Partitions covered by this budget profile.';
      };
      CREATE REQUIRED PROPERTY name: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
  };
  CREATE TYPE default::EBudget {
      CREATE REQUIRED LINK category: default::ECategory;
      CREATE REQUIRED LINK profile: default::EBudgetProfile;
      CREATE REQUIRED PROPERTY amount: std::decimal;
  };
};
