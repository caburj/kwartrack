import { css } from "../../../../styled-system/css";
import { rpc } from "@/app/rpc_client";
import {
  Partitions,
  QueryResult,
  Unpacked,
  getPartitionType,
  groupBy,
} from "@/utils/common";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { number, object, optional, string } from "valibot";
import { Flex, TextField, Text } from "@radix-ui/themes";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { atom, useAtom } from "jotai";
import { Combobox, ComboboxTrigger } from "./combobox";

type Categories = Awaited<ReturnType<typeof rpc.post.getUserCategories>>;
type Category = Unpacked<Categories["expense"]>;

const selectedCategoryIdAtom = atom("");
const selectedSourcePartitionIdAtom = atom("");
const selectedDestinationPartitionIdAtom = atom("");

const getCategoryOptionName = (category: Category) => {
  if (category.is_private) {
    return `${category.name} (Private)`;
  } else {
    return category.name;
  }
};

function CategoryComboBox(props: { categories: Categories }) {
  const { categories } = props;
  const [selectedCategoryId, setSelectedCategoryId] = useAtom(
    selectedCategoryIdAtom
  );

  const categoryName = useMemo(() => {
    if (categories) {
      const selectedCategory = [
        ...categories.income,
        ...categories.expense,
        ...categories.transfer,
      ].find((c) => c.id === selectedCategoryId);
      if (selectedCategory) {
        return getCategoryOptionName(selectedCategory);
      }
    }
    return "Select Category";
  }, [categories, selectedCategoryId]);

  return (
    <Combobox
      groupedItems={props.categories}
      getGroupHeading={(key) => key[0].toUpperCase() + key.slice(1)}
      getItemValue={(c, k) => `${k} ${getCategoryOptionName(c)}`}
      getItemDisplay={(c) => getCategoryOptionName(c)}
      onSelectItem={(c) => setSelectedCategoryId(c.id)}
    >
      <ComboboxTrigger>{categoryName}</ComboboxTrigger>
    </Combobox>
  );
}

function PartitionCombobox(props: {
  partitions: Partitions;
  user: { id: string; dbname: string };
  selectedCategory: Category | undefined;
  selectedPartitionId: string;
  setSelectedPartitionId: (id: string) => void;
}) {
  const {
    partitions,
    user,
    selectedPartitionId,
    setSelectedPartitionId,
    selectedCategory,
  } = props;

  useEffect(() => {
    // Always reset selected partition when category changes
    if (selectedCategory) {
      setSelectedPartitionId("");
    }
  }, [selectedCategory, setSelectedPartitionId]);

  const sortedPartitions = useMemo(() => {
    const partitionsByType = groupBy(partitions, (p) =>
      getPartitionType(p, user.id)
    );
    return [
      ...(partitionsByType.owned || []),
      ...(partitionsByType.common || []),
      ...(partitionsByType.others || []),
    ];
  }, [partitions, user.id]);

  const selectedPartition = useMemo(() => {
    return partitions.find((p) => p.id === selectedPartitionId);
  }, [partitions, selectedPartitionId]);

  const partitionName = selectedPartition
    ? `${selectedPartition.name} (${selectedPartition.account.label})`
    : "Select Partition";

  return (
    <Combobox
      groupedItems={groupBy(sortedPartitions, (p) => p.account.id)}
      getGroupHeading={(key, items) => items[0].account.label}
      isItemIncluded={(p) => !selectedCategory?.is_private || p.is_private}
      getItemValue={(p) =>
        `${getPartitionType(p, user.id)} ${p.account.label} ${p.name}`
      }
      getItemDisplay={(p) => p.name}
      onSelectItem={(p) => setSelectedPartitionId(p.id)}
    >
      <ComboboxTrigger>{partitionName}</ComboboxTrigger>
    </Combobox>
  );
}

export function TransactionForm(props: {
  user: { id: string; dbname: string };
}) {
  const { user } = props;
  const queryClient = useQueryClient();
  const partitions = useQuery(["partitions", user.id], () => {
    return rpc.post.getPartitionOptions({
      userId: user.id,
      dbname: user.dbname,
    });
  });
  const categories = useQuery(["categories", user.id], () => {
    return rpc.post.getUserCategories({ userId: user.id, dbname: user.dbname });
  });
  const createTransaction = useMutation(rpc.post.createTransaction);

  const [selectedCategoryId, setSelectedCategoryId] = useAtom(
    selectedCategoryIdAtom
  );
  const [selectedSourcePartitionId, setSelectedSourceCategoryId] = useAtom(
    selectedSourcePartitionIdAtom
  );
  const [selectedDestinationPartitionId, setSelectedDestinationCategoryId] =
    useAtom(selectedDestinationPartitionIdAtom);
  const [inputValue, setInputValue] = useState("");

  const selectedCategory = useMemo(() => {
    if (categories.data) {
      return [
        ...categories.data.expense,
        ...categories.data.income,
        ...categories.data.transfer,
      ].find((c) => c.id === selectedCategoryId);
    }
  }, [categories, selectedCategoryId]);

  const inputCategoryKind = useMemo(() => {
    return selectedCategory ? selectedCategory.kind : "";
  }, [selectedCategory]);

  let value: number | undefined = undefined;
  try {
    value = parseFloat(inputValue);
  } catch (_error) {}

  const shouldDisableSubmit = () => {
    return !value || value <= 0 || isNaN(value) || createTransaction.isLoading;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = event.target as HTMLFormElement;
    const formdata = new FormData(target as HTMLFormElement);
    const formObj = Object.fromEntries(formdata.entries());
    const dataSchema = object({
      sourcePartitionId: string(),
      destinationPartitionId: optional(string()),
      categoryId: string(),
      value: number(),
      description: optional(string()),
      userId: string(),
    });
    const parsedData = dataSchema.parse({
      ...formObj,
      categoryId: selectedCategoryId,
      sourcePartitionId: selectedSourcePartitionId,
      destinationPartitionId: selectedDestinationPartitionId,
      userId: user.id,
      value,
    });
    const { transaction, counterpart } = await createTransaction.mutateAsync({
      ...parsedData,
      dbname: user.dbname,
    });
    target.reset();
    setSelectedSourceCategoryId("");
    setSelectedDestinationCategoryId("");
    setSelectedCategoryId("");
    if (transaction) {
      setInputValue("");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({
        queryKey: ["categoryBalance", { categoryId: parsedData.categoryId }],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "categoryCanBeDeleted",
          { categoryId: parsedData.categoryId },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "partitionBalance",
          { partitionId: parsedData.sourcePartitionId },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "partitionCanBeDeleted",
          { partitionId: parsedData.sourcePartitionId },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "accountCanBeDeleted",
          { accountId: transaction.source_partition.account.id },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "accountBalance",
          { accountId: transaction.source_partition.account.id },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["categoryKindBalance", transaction.category.kind],
      });
    }
    if (counterpart) {
      queryClient.invalidateQueries({
        queryKey: [
          "partitionBalance",
          { partitionId: parsedData.destinationPartitionId },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "partitionCanBeDeleted",
          { partitionId: counterpart.source_partition.id },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "accountCanBeDeleted",
          { accountId: counterpart.source_partition.account.id },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "accountBalance",
          { accountId: counterpart.source_partition.account.id },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["categoryKindBalance", counterpart.category.kind],
      });
    }
  };

  return (
    <Flex gap="4" pb="4" asChild>
      <form onSubmit={onSubmit}>
        <label>
          <Text as="div" size="1" mb="1" ml="2">
            Category
          </Text>
          <QueryResult query={categories}>
            {(categories) => <CategoryComboBox categories={categories} />}
          </QueryResult>
        </label>
        <QueryResult query={partitions}>
          {(partitions) => (
            <label>
              <Text as="div" size="1" mb="1" ml="2">
                Partition
              </Text>
              <PartitionCombobox
                partitions={partitions.filter((p) => p.account.is_owned)}
                user={user}
                selectedCategory={selectedCategory}
                selectedPartitionId={selectedSourcePartitionId}
                setSelectedPartitionId={setSelectedSourceCategoryId}
              />
              {inputCategoryKind == "Transfer" ? (
                <>
                  <ArrowRightIcon
                    width="18"
                    height="18"
                    className={css({
                      display: "inline-block",
                      verticalAlign: "middle",
                      margin: "0 4px",
                    })}
                  />
                  <PartitionCombobox
                    partitions={partitions}
                    user={user}
                    selectedCategory={selectedCategory}
                    selectedPartitionId={selectedDestinationPartitionId}
                    setSelectedPartitionId={setSelectedDestinationCategoryId}
                  />
                </>
              ) : null}
            </label>
          )}
        </QueryResult>
        <label>
          <Text as="div" size="1" mb="1" ml="2">
            Amount
          </Text>
          <TextField.Input
            placeholder="Enter amount"
            name="value"
            type="numeric"
            value={inputValue}
            onInput={(event) => {
              setInputValue((event.target as HTMLInputElement).value);
            }}
            autoComplete="off"
            disabled={createTransaction.isLoading}
          />
        </label>
        <label>
          <Text as="div" size="1" mb="1" ml="2">
            Description
          </Text>
          <TextField.Input
            placeholder="E.g. from colruyt"
            name="description"
            disabled={createTransaction.isLoading}
            autoComplete="off"
          />
        </label>
        <button type="submit" disabled={shouldDisableSubmit()} hidden>
          Submit
        </button>
      </form>
    </Flex>
  );
}
