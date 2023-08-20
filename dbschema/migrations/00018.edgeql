CREATE MIGRATION m145o6y4z6auz5vkrtnxlhgna3slfuejxnxqxv3rxta6gw555dr4fq
    ONTO m1sbvpiitjuw27ftjx3z34jqmwo3akayiaqsioy6gr5qs2m3if42yq
{
  ALTER TYPE default::EUser {
      CREATE PROPERTY balance := (std::sum(.accounts.balance));
  };
};
