CREATE MIGRATION m1p4t74e6dvi3s4vfcqdugb3yprclqwfuwrh4tt5x3nwo5wbtgcktq
    ONTO m1huvdehozz46w765sidn3oq4putcs5i64i7cjvyl5y645qlmhygda
{
  ALTER GLOBAL default::tse_date {
      CREATE ANNOTATION std::description := 'The end date of the transaction search range.';
  };
  ALTER GLOBAL default::tss_date {
      CREATE ANNOTATION std::description := 'The start date of the transaction search range.';
  };
};
