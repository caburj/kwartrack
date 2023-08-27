CREATE MIGRATION m1huvdehozz46w765sidn3oq4putcs5i64i7cjvyl5y645qlmhygda
    ONTO m13i4r6i3onkzdnbihtc7kra7r4ssdr576mxaib74hk6cfkeppyhqa
{
  ALTER GLOBAL default::transaction_search_end_date RENAME TO default::tse_date;
};
