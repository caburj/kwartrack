CREATE MIGRATION m1d7yijbdlwban76jur57debzptrl66ahmyozt5j46cziptrguyn6a
    ONTO m1n3rgciivi4h7jkdl34pdpraqu7lo6d6i7c67gxskbiifpwm5e3fq
{
  ALTER TYPE default::ETransaction {
      CREATE PROPERTY description: std::str;
  };
};
