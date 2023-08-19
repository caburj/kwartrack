CREATE MIGRATION m1sbvpiitjuw27ftjx3z34jqmwo3akayiaqsioy6gr5qs2m3if42yq
    ONTO m1d7yijbdlwban76jur57debzptrl66ahmyozt5j46cziptrguyn6a
{
  ALTER TYPE default::EUser {
      CREATE MULTI LINK categories := (SELECT
          default::ECategory
      );
  };
};
