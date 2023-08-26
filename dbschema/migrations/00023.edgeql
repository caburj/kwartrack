CREATE MIGRATION m1d2mbzzht5bfojtz5gh7tkgzlhgh73qkrmw66ismnmdqzjxpi7rca
    ONTO m1y3bfh7el44jmggniny6bj2su7vfvrkljvfmr4vvncn7ntko33dpa
{
  ALTER TYPE default::EPartition {
      DROP ACCESS POLICY current_user_owned;
  };
};
