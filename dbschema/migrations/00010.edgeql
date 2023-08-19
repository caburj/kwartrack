CREATE MIGRATION m1fehbncnhrvrk7akvgnrm7i3f67qgsvo2sc7jddqgvo6eu5kmqpiq
    ONTO m1tzlh5icqr25ajp5okdzgamwqrjjissccjt3sm6cozgwx3dzrexqa
{
  ALTER TYPE default::ExpensifUser RENAME TO default::EUser;
};
