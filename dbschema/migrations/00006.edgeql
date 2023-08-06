CREATE MIGRATION m1sejfi4fcii6ujena3fpz5nlcuexy7rg5rh37p3mtn6yhq35cb72a
    ONTO m1j5ftkhxkmdu3euorf7dggyt2icy6z5bcjy6iec4hvaru3ldk5fxa
{
  ALTER TYPE default::ExpensifUser {
      CREATE MULTI LINK accounts := (.<owner[IS default::ExpensifAccount]);
  };
};
