CREATE MIGRATION m17momfy5k3ounsnvxnzovlmsshgqfdsk6yxuodx4rwqbc37ztlr7a
    ONTO m1fydukwbbo5inuttkqzu7tknwn3nbn4yol32f7j72h5zkvvnj2bpq
{
  CREATE GLOBAL default::current_user_id -> std::uuid;
  ALTER TYPE default::ETransaction {
      CREATE ACCESS POLICY current_user_owned
          ALLOW ALL USING (((.source_partition.is_private = false) OR std::any((.owners.id = GLOBAL default::current_user_id))));
  };
};
