CREATE MIGRATION m12uqy6y5zu4ik4xlknq4eqipuffybk7if7y4cgllu7jqul6ryt5ia
    ONTO m13kv6pmirq2l5udljzhuaz65sdvxfpdugkeq5wxplpgb36gib4jda
{
  ALTER GLOBAL default::tse_date SET default := (<std::datetime>'9999-12-30T23:59:59+00');
  CREATE GLOBAL default::tse_date_1_more_day := ((GLOBAL default::tse_date + <std::duration>'1 day'));
  ALTER TYPE default::ETransaction {
      ALTER ACCESS POLICY current_user_owned USING ((((NOT (.source_partition.is_private) OR std::any((.owners.id = GLOBAL default::current_user_id))) AND (.date >= GLOBAL default::tss_date)) AND (.date < GLOBAL default::tse_date_1_more_day)));
  };
};
