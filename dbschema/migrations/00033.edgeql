CREATE MIGRATION m1dpaen7fxufy2qgmwpmxxco2ieopjf55hsolskw3smnf3fg5jtlnq
    ONTO m1or4dh6akvknszms7ihc5wckaj3ekt5k67quzfmjsmkbmajywsm4a
{
  ALTER TYPE default::ETransaction {
      ALTER PROPERTY is_transfer {
          RENAME TO is_counterpart;
      };
  };
  ALTER TYPE default::ETransaction {
      ALTER PROPERTY is_counterpart {
          USING ((.<counterpart[IS default::ETransaction] != <default::ETransaction>{}));
      };
  };
};
