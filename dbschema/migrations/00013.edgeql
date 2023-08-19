CREATE MIGRATION m1c5eus5bsl7pejzvkmp5bedurxpojlb76jykkam2qjburuattrqga
    ONTO m16jlmxzquyni6ef2gwwhbbww3cxr3vhte2yppsipajioiesexwjzq
{
  ALTER TYPE default::ExpensifCategory RENAME TO default::ECategory;
};
