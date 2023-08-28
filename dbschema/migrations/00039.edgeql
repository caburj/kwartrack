CREATE MIGRATION m1urrgo2bu6szhcwpe7qkaeriz4wwl7p5ipkapb62mhjzci4g6vqyq
    ONTO m12uqy6y5zu4ik4xlknq4eqipuffybk7if7y4cgllu7jqul6ryt5ia
{
  ALTER TYPE default::ETransaction {
      ALTER ACCESS POLICY current_user_owned USING ((((NOT (.source_partition.is_private) OR std::any((.owners.id = GLOBAL default::current_user_id))) AND (.date >= GLOBAL default::tss_date)) AND (.date < (GLOBAL default::tse_date + <std::duration>'24 hours'))));
  };
  DROP GLOBAL default::tse_date_1_more_day;
};
