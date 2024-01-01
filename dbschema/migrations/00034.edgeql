CREATE MIGRATION m1vghrqzihkxsw3a4p3dwhbc2p6n6nqihewgalejfsmydfvfwvolja
    ONTO m1ayutao2ggu6j6y2qp6qkibnzozj2bk2lstw5m2ypczy4aaqhxs4a
{
  ALTER TYPE default::EBudget {
      CREATE CONSTRAINT std::exclusive ON ((.category, .profile));
  };
};
