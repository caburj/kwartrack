CREATE MIGRATION m1nqxx4esvwguzxrrzbytpnk3qkho2nqrzv4vl2rdoz77luha3bo6q
    ONTO m1d2mbzzht5bfojtz5gh7tkgzlhgh73qkrmw66ismnmdqzjxpi7rca
{
  ALTER TYPE default::ETransaction {
      CREATE LINK destination_transaction: default::ETransaction {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE PROPERTY is_transfer := ((.destination_transaction != <default::ETransaction>{}));
  };
};
