CREATE MIGRATION m1lmemg5tizwq2xpeu5lol7ga5sdfs55bmyh4zqlzeeogbrcvl4ohq
    ONTO m167mbatn2w7plslgvngp7uzkh4o7kcakds7odjc4br24s7tkkqlyq
{
  ALTER TYPE default::ETransaction {
      ALTER ACCESS POLICY current_user_owned USING ((((NOT (.source_partition.is_private) OR std::any((.owners.id = GLOBAL default::current_user_id))) AND std::all((.date >= GLOBAL default::tss_date))) AND std::all((.date <= GLOBAL default::tse_date))));
  };
};
