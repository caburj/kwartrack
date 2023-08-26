CREATE MIGRATION m1hq2z4qx23cxt44gpmmefvro7gqjqxwj56i6nlk44uemrja5lyksa
    ONTO m1fizqfvaddki5ru2tys2e4alwjhwblrupwx3ubfaoolzisoamug4a
{
  ALTER TYPE default::ETransaction {
      ALTER ACCESS POLICY current_user_owned USING (((((.source_partition.is_private = false) OR std::any((.owners.id = GLOBAL default::current_user_id))) AND std::all((.date >= GLOBAL default::transaction_search_start_date))) AND std::all((.date <= GLOBAL default::transaction_search_end_date))));
  };
};
