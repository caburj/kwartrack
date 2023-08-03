CREATE MIGRATION m1ewgpolpcrmaa7dg5wzepf6hl4mdwih3ppfk5audfqxefcps7fgna
    ONTO m1thhmxt3i4t6mwjg7flnnr7kfdubuem2rbnxbwdlnzpl5e5duipbq
{
  ALTER TYPE default::User {
      ALTER PROPERTY email {
          CREATE CONSTRAINT std::exclusive;
      };
  };
};
