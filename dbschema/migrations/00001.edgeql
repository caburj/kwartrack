CREATE MIGRATION m1thhmxt3i4t6mwjg7flnnr7kfdubuem2rbnxbwdlnzpl5e5duipbq
    ONTO initial
{
  CREATE TYPE default::User {
      CREATE REQUIRED PROPERTY email: std::str;
      CREATE REQUIRED PROPERTY name: std::str;
  };
};
