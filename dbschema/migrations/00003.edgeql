CREATE MIGRATION m13y4rysne4kc7zhduhzyerotyydbqthbmpsr4lmmaohjwdpbzqpza
    ONTO m1jucmubgq7pp55ku7jumzbtbi7nlkcesu2erlvp3mlhxyry5vvsuq
{
  ALTER TYPE default::EAccount {
      DROP PROPERTY current_balance;
  };
  ALTER TYPE default::ECategory {
      DROP PROPERTY current_balance;
  };
  ALTER TYPE default::EPartition {
      DROP PROPERTY current_balance;
  };
};
