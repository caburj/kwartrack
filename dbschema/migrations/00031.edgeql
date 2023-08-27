CREATE MIGRATION m1sykqwyoi5apiewmoqywd7wgku7ic3rq3lkzpu4bo3lrlckntqliq
    ONTO m1p4t74e6dvi3s4vfcqdugb3yprclqwfuwrh4tt5x3nwo5wbtgcktq
{
  ALTER TYPE default::ETransaction {
      CREATE LINK counterpart: default::ETransaction {
          CREATE ANNOTATION std::description := 'The counterpart transaction if this is a transfer.';
          CREATE CONSTRAINT std::exclusive;
      };
      ALTER PROPERTY is_transfer {
          USING ((.counterpart != <default::ETransaction>{}));
      };
      DROP LINK destination_transaction;
  };
};
