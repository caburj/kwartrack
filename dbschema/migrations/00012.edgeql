CREATE MIGRATION m16jlmxzquyni6ef2gwwhbbww3cxr3vhte2yppsipajioiesexwjzq
    ONTO m173u24oqludcoypxyf7bwyi2xjcsbnbzhzwmwe6l76ww77s44ncbq
{
  ALTER TYPE default::ExpensifPartition RENAME TO default::EPartition;
};
