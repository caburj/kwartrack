CREATE MIGRATION m1j5ftkhxkmdu3euorf7dggyt2icy6z5bcjy6iec4hvaru3ldk5fxa
    ONTO m1qer2koevdbklw77a4zabcv7pz7yqy6yrxl73ylmxr3sukszmozsa
{
  ALTER TYPE default::ExpensifUser {
      CREATE REQUIRED PROPERTY username: std::str {
          SET REQUIRED USING (.name);
          CREATE CONSTRAINT std::exclusive;
      };
  };
};
