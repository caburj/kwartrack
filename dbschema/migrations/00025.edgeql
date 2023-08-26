CREATE MIGRATION m1g2z3kaplmrxfska56jyiapvhdo4qady5h65ilhyegjyiik7e7zaa
    ONTO m1nqxx4esvwguzxrrzbytpnk3qkho2nqrzv4vl2rdoz77luha3bo6q
{
  CREATE GLOBAL default::transaction_search_end_date -> std::datetime {
      SET default := (<std::datetime>'9999-12-31T23:59:59+00');
  };
  CREATE GLOBAL default::transaction_search_start_date -> std::datetime {
      SET default := (<std::datetime>'0001-01-01T00:00:00+00');
  };
  ALTER TYPE default::ETransaction {
      ALTER ACCESS POLICY current_user_owned USING (((std::all((.date >= GLOBAL default::transaction_search_start_date)) AND std::all((.date <= GLOBAL default::transaction_search_end_date))) AND ((.source_partition.is_private = false) OR std::any((.owners.id = GLOBAL default::current_user_id)))));
  };
};
