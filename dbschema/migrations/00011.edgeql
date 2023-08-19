CREATE MIGRATION m173u24oqludcoypxyf7bwyi2xjcsbnbzhzwmwe6l76ww77s44ncbq
    ONTO m1fehbncnhrvrk7akvgnrm7i3f67qgsvo2sc7jddqgvo6eu5kmqpiq
{
  ALTER TYPE default::ExpensifAccount RENAME TO default::EAccount;
};
