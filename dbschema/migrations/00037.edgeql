CREATE MIGRATION m13kv6pmirq2l5udljzhuaz65sdvxfpdugkeq5wxplpgb36gib4jda
    ONTO m1lmemg5tizwq2xpeu5lol7ga5sdfs55bmyh4zqlzeeogbrcvl4ohq
{
  ALTER GLOBAL default::tse_date SET REQUIRED;
  ALTER GLOBAL default::tss_date SET REQUIRED;
  ALTER TYPE default::ETransaction {
      ALTER ACCESS POLICY current_user_owned USING ((((NOT (.source_partition.is_private) OR std::any((.owners.id = GLOBAL default::current_user_id))) AND (.date >= GLOBAL default::tss_date)) AND (.date <= GLOBAL default::tse_date)));
  };
};
