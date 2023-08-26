CREATE MIGRATION m1y3bfh7el44jmggniny6bj2su7vfvrkljvfmr4vvncn7ntko33dpa
    ONTO m17momfy5k3ounsnvxnzovlmsshgqfdsk6yxuodx4rwqbc37ztlr7a
{
  ALTER TYPE default::EPartition {
      CREATE ACCESS POLICY current_user_owned
          ALLOW ALL USING (((.is_private = false) OR std::any((.owners.id = GLOBAL default::current_user_id))));
  };
};
