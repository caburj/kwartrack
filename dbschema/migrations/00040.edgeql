CREATE MIGRATION m1xezpklq54c5xqdrwlja72wqlt4zqd4b77racgkdcjlodesofwmyq
    ONTO m1urrgo2bu6szhcwpe7qkaeriz4wwl7p5ipkapb62mhjzci4g6vqyq
{
  ALTER GLOBAL default::tse_date {
      ALTER ANNOTATION std::description := '\n      The end date of the transaction search range.\n      24 hours is added to this in the access policy to ensure that transactions on the end date are included.\n    ';
  };
};
