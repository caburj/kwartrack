CREATE MIGRATION m1xkuvng26tsy2liqt4onflt6hg7dn2upv6uegv4y2mflzhlolqxxa
    ONTO m13w5kr3gnyxcf3ha4drw2yicy476hpdk4fj4f2ceulquzbvtcvaoa
{
  ALTER TYPE default::ECategory {
      ALTER PROPERTY is_owned {
          USING ((std::any((.owners = GLOBAL default::current_user)) OR NOT (EXISTS (.owners))));
      };
  };
};
