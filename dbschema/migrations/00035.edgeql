CREATE MIGRATION m167mbatn2w7plslgvngp7uzkh4o7kcakds7odjc4br24s7tkkqlyq
    ONTO m1kmk7nmoo3icujmred4lejble5dcn4urt6rv7h4zgngnpfm3nfpia
{
  ALTER TYPE default::ETransaction {
      ALTER PROPERTY is_counterpart {
          USING (EXISTS (.<counterpart[IS default::ETransaction]));
      };
  };
};
