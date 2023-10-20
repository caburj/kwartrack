CREATE MIGRATION m13azfvlun62gxqivtkxehftfhhyvmd3r6d2ayvxtmguynlt7k3f2a
    ONTO m1otq4ael3fwcq22dipa53ilkiftpkhbbp5rhmljv4ehtyscfwfftq
{
  CREATE TYPE masterdb::EInvitation {
      CREATE REQUIRED LINK inviter: masterdb::EUser;
      CREATE REQUIRED PROPERTY code: std::str {
          CREATE ANNOTATION std::description := 'The code that the user must enter to accept the invitation.';
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY email: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY is_accepted: std::bool {
          SET default := false;
          CREATE ANNOTATION std::description := 'True if the invitation has been accepted. False if pending.';
      };
      CREATE REQUIRED PROPERTY is_admin: std::bool {
          CREATE ANNOTATION std::description := "\n        True to allow invited user to start his own database.\n        False can only join the inviter's database.\n      ";
      };
  };
};
