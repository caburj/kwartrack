CREATE MIGRATION m1qh7x5xdwnrfq2bur7shmnkle5x7f2u6bhqyr25pzsblqricbqaoq
    ONTO m1hao3ds5sx35gbj6lrfweu3wnx4pwzwcmtzbpophole62kpx4lkka
{
  ALTER TYPE default::ECategory {
      ALTER LINK default_partition {
          ALTER ANNOTATION std::description := 'This partition is automatically selected when creating a new transaction with this category.';
      };
  };
};
