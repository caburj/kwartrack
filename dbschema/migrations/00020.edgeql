CREATE MIGRATION m1fydukwbbo5inuttkqzu7tknwn3nbn4yol32f7j72h5zkvvnj2bpq
    ONTO m15o7ifrj5h5summhndfbznzngmrsge3kw4jyirb4fkfknpxxlttka
{
  ALTER TYPE default::EPartition {
      CREATE REQUIRED PROPERTY is_private: std::bool {
          SET default := false;
      };
  };
};
