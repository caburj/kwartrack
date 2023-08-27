CREATE MIGRATION m1or4dh6akvknszms7ihc5wckaj3ekt5k67quzfmjsmkbmajywsm4a
    ONTO m1sykqwyoi5apiewmoqywd7wgku7ic3rq3lkzpu4bo3lrlckntqliq
{
  CREATE SCALAR TYPE default::ECategoryKind EXTENDING enum<Income, Expense, Transfer>;
  ALTER TYPE default::ECategory {
      CREATE REQUIRED PROPERTY kind: default::ECategoryKind {
          SET REQUIRED USING (<default::ECategoryKind>'Expense');
      };
  };

  # update transfer categories
  UPDATE default::ECategory
  FILTER .balance = 0.0n
  SET {
      kind := <default::ECategoryKind>'Transfer'
  };

  # update income categories
  UPDATE default::ECategory
  FILTER .balance > 0.0n
  SET {
    kind := <default::ECategoryKind>'Income'
  };

  # update expense categories
  UPDATE default::ECategory
  FILTER .balance < 0.0n
  SET {
    kind := <default::ECategoryKind>'Expense'
  };
};
