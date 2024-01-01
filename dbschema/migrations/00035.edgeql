CREATE MIGRATION m1jff3pcym4af6y6zb4kyrq6xz6wvcandso5fdn5ryf4clwfdxuita
    ONTO m1vghrqzihkxsw3a4p3dwhbc2p6n6nqihewgalejfsmydfvfwvolja
{
  ALTER TYPE default::EBudgetProfile {
      CREATE PROPERTY is_owned := ((std::any((.owners = GLOBAL default::current_user)) OR NOT (EXISTS (.owners))));
  };
};
