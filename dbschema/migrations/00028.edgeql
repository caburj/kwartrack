CREATE MIGRATION m13i4r6i3onkzdnbihtc7kra7r4ssdr576mxaib74hk6cfkeppyhqa
    ONTO m1hq2z4qx23cxt44gpmmefvro7gqjqxwj56i6nlk44uemrja5lyksa
{
  ALTER GLOBAL default::transaction_search_start_date RENAME TO default::tss_date;
};
