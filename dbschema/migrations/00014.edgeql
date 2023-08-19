CREATE MIGRATION m1b3meerzjz4pxz6tzfitbia5xu3jcaaedcsm6tnuukiauupg2whxa
    ONTO m1c5eus5bsl7pejzvkmp5bedurxpojlb76jykkam2qjburuattrqga
{
  ALTER TYPE default::ExpensifTransaction RENAME TO default::ETransaction;
};
