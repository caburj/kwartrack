CREATE MIGRATION m1ga73m3qldz5twpnyug5ykzv7voavwtyl6zbgkhfii4eziweuqt5q
    ONTO m1qbc7tc5bnibe4ivnlq4xidunwqnt4zstqbraefccetcljc5nsoha
{
  ALTER TYPE default::ETransaction {
      ALTER LINK counterpart {
          ON SOURCE DELETE DELETE TARGET;
          ON TARGET DELETE DELETE SOURCE;
      };
  };
};
