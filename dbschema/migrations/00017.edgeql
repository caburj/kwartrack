CREATE MIGRATION m1qbc7tc5bnibe4ivnlq4xidunwqnt4zstqbraefccetcljc5nsoha
    ONTO m12fk565sjq3mhuxutm3kfhnzy453ajqc3on2zsi6bm7hirsyckvuq
{
  ALTER TYPE default::ELoan {
      ALTER LINK transaction {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE default::EPayment {
      ALTER LINK transaction {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
};
