CREATE MIGRATION m1hao3ds5sx35gbj6lrfweu3wnx4pwzwcmtzbpophole62kpx4lkka
    ONTO m1fpomjaw6wa4wmdwan4i6pe6l73c3pm5geue7jazvabowp6w7rjfq
{
  ALTER TYPE default::ECategory {
      CREATE LINK default_partition: default::EPartition {
          CREATE ANNOTATION std::description := 'Automatically select this partition when creating a new transaction with this category.';
      };
  };
};
