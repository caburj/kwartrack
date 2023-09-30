CREATE MIGRATION m12fk565sjq3mhuxutm3kfhnzy453ajqc3on2zsi6bm7hirsyckvuq
    ONTO m1odp7hgwtpjtqxbqvu5vxkdyzepws26ljylei7qa2dp3lo4omxgpq
{
  CREATE TYPE default::ELoan {
      CREATE REQUIRED PROPERTY amount_to_pay: std::decimal;
      CREATE REQUIRED LINK transaction: default::ETransaction {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE PROPERTY amount := (math::abs(.transaction.value));
  };
  CREATE TYPE default::EPayment {
      CREATE REQUIRED LINK loan: default::ELoan;
      CREATE REQUIRED LINK transaction: default::ETransaction {
          CREATE CONSTRAINT std::exclusive;
      };
  };
  ALTER TYPE default::ELoan {
      CREATE MULTI LINK payments := (.<loan[IS default::EPayment]);
      CREATE PROPERTY amount_paid := (std::sum(math::abs(.payments.transaction.value)));
      CREATE PROPERTY is_paid := ((.amount_paid >= .amount_to_pay));
  };
};
