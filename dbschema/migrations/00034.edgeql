CREATE MIGRATION m1kmk7nmoo3icujmred4lejble5dcn4urt6rv7h4zgngnpfm3nfpia
    ONTO m1dpaen7fxufy2qgmwpmxxco2ieopjf55hsolskw3smnf3fg5jtlnq
{
  ALTER TYPE default::ETransaction {
      ALTER PROPERTY is_counterpart {
          USING (<std::bool>(.<counterpart[IS default::ETransaction] != <default::ETransaction>{}));
      };
  };
};
