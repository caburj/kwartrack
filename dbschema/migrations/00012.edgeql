CREATE MIGRATION m1swgkx6gfg56yp7pcyv2474mhkvpyxs5ykp25hdxtb5l73kjpg3ha
    ONTO m1m7jfhxtgc5solx5kkcpdnavc3l2ge3yvbggxgynn3gc6lxnqil5q
{
  CREATE MODULE masterdb IF NOT EXISTS;
  CREATE TYPE masterdb::EUser {
      CREATE REQUIRED PROPERTY email: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY name: std::str;
      CREATE REQUIRED PROPERTY username: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
  };
  CREATE TYPE masterdb::EDatabase {
      CREATE MULTI LINK users: masterdb::EUser;
      CREATE REQUIRED PROPERTY name: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
  };
};
