CREATE MIGRATION m1n3rgciivi4h7jkdl34pdpraqu7lo6d6i7c67gxskbiifpwm5e3fq
    ONTO m1b3meerzjz4pxz6tzfitbia5xu3jcaaedcsm6tnuukiauupg2whxa
{
  ALTER TYPE default::EAccount {
      CREATE MULTI LINK transactions := (.partitions.transactions);
  };
  ALTER TYPE default::EUser {
      CREATE MULTI LINK transactions := (.accounts.transactions);
  };
};
