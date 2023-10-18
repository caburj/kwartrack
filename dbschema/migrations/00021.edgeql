CREATE MIGRATION m1otq4ael3fwcq22dipa53ilkiftpkhbbp5rhmljv4ehtyscfwfftq
    ONTO m1xkuvng26tsy2liqt4onflt6hg7dn2upv6uegv4y2mflzhlolqxxa
{
  ALTER TYPE default::ETransaction {
      ALTER PROPERTY date {
          RESET readonly;
      };
  };
};
