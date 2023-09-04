CREATE MIGRATION m14bhijbkmt2zwuezn4mwfy3qu3f4llylgwkc6kkvtdzmez6lsezna
    ONTO m1rrnjotkxixdyfpzximbwaffvmenbhunzzs33kgwxx7cohle47poa
{
  ALTER TYPE default::EUser {
      DROP LINK transactions;
      DROP PROPERTY balance;
      DROP LINK categories;
  };
  ALTER TYPE default::EAccount {
      DROP LINK transactions;
      DROP PROPERTY balance;
  };
  ALTER TYPE default::EPartition {
      DROP PROPERTY balance;
      DROP LINK transactions;
  };
};
