CREATE MIGRATION m13w5kr3gnyxcf3ha4drw2yicy476hpdk4fj4f2ceulquzbvtcvaoa
    ONTO m1ga73m3qldz5twpnyug5ykzv7voavwtyl6zbgkhfii4eziweuqt5q
{
  ALTER TYPE default::EPartition {
      CREATE REQUIRED PROPERTY archived: std::bool {
          SET default := false;
          CREATE ANNOTATION std::description := "Archived partitions are hidden by default. And can't be used for new transactions.";
      };
  };
};
