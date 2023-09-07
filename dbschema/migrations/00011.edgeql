CREATE MIGRATION m1m7jfhxtgc5solx5kkcpdnavc3l2ge3yvbggxgynn3gc6lxnqil5q
    ONTO m1waplvjuijvmpxqfc7vjv2nx2brornhy5egtbutlkmp4hl46nlfaa
{
  ALTER TYPE default::EPartition {
      DROP PROPERTY label;
  };
  ALTER TYPE default::EAccount {
      DROP PROPERTY label;
      DROP LINK logged_owner;
  };
};
