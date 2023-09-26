import { css } from "../../../../styled-system/css";
import { rpc } from "@/app/rpc_client";
import {
  CATEGORY_COLOR,
  Categories,
  Category,
  PARTITION_COLOR,
  Partitions,
  QueryResult,
  getCategoryOptionName,
  getPartitionType,
  invalidateMany,
  useGroupedPartitions,
} from "@/utils/common";
import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { number, object, optional, string } from "valibot";
import { Flex, TextField, Text } from "@radix-ui/themes";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { atom, useAtom } from "jotai";
import { Combobox, ComboboxTrigger } from "./combobox";

const selectedCategoryIdAtom = atom("");
const selectedSourcePartitionIdAtom = atom("");
const selectedDestinationPartitionIdAtom = atom("");

function CategoryComboBox(props: { categories: Categories }) {
  const { categories } = props;
  const [selectedCategoryId, setSelectedCategoryId] = useAtom(
    selectedCategoryIdAtom
  );

  const selectedCategory = useMemo(() => {
    if (categories) {
      return [
        ...categories.Income,
        ...categories.Expense,
        ...categories.Transfer,
      ].find((c) => c.id === selectedCategoryId);
    }
  }, [categories, selectedCategoryId]);

  const categoryName = selectedCategory
    ? getCategoryOptionName(selectedCategory)
    : "Select Category";

  const color = selectedCategory && CATEGORY_COLOR[selectedCategory.kind];

  return (
    <Combobox
      groupedItems={props.categories}
      getGroupHeading={(key) => key}
      getItemColor={(item, key) => {
        return CATEGORY_COLOR[key];
      }}
      getItemValue={(c, k) => `${k} ${getCategoryOptionName(c)}`}
      getItemDisplay={(c) => getCategoryOptionName(c)}
      onSelectItem={(c) => setSelectedCategoryId(c.id)}
    >
      <ComboboxTrigger color={color}>{categoryName}</ComboboxTrigger>
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

  const groupedPartitions = useGroupedPartitions(partitions, user.id);

  const selectedPartition = useMemo(() => {
    return partitions.find((p) => p.id === selectedPartitionId);
  }, [partitions, selectedPartitionId]);

  const partitionName = selectedPartition
    ? `${selectedPartition.name} (${selectedPartition.account.label})`
    : "Select Partition";

  const color =
    selectedPartition &&
    PARTITION_COLOR[getPartitionType(selectedPartition, user.id)];

  return (
    <Combobox
      groupedItems={groupedPartitions}
      getGroupHeading={(key, items) => items[0].account.label}
      getItemColor={(item) => {
        const _type = getPartitionType(item, user.id);
        return PARTITION_COLOR[_type];
      }}
      isItemIncluded={(p) => !selectedCategory?.is_private || p.is_private}
      getItemValue={(p) =>
        `${getPartitionType(p, user.id)} ${p.account.label} ${p.name}`
      }
      getItemDisplay={(p) => p.name}
      onSelectItem={(p) => setSelectedPartitionId(p.id)}
    >
      <ComboboxTrigger color={color}>{partitionName}</ComboboxTrigger>
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
        ...categories.data.Expense,
        ...categories.data.Income,
        ...categories.data.Transfer,
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
    const queryKeys: QueryKey[] = [];
    if (transaction) {
      setInputValue("");
      queryKeys.push(
        ["transactions"],
        ["categoryBalance", { categoryId: parsedData.categoryId }],
        ["categoryCanBeDeleted", { categoryId: parsedData.categoryId }],
        ["partitionBalance", { partitionId: parsedData.sourcePartitionId }],
        [
          "partitionCanBeDeleted",
          { partitionId: parsedData.sourcePartitionId },
        ],
        [
          "accountCanBeDeleted",
          { accountId: transaction.source_partition.account.id },
        ],
        [
          "accountBalance",
          { accountId: transaction.source_partition.account.id },
        ],
        ["categoryKindBalance", transaction.category.kind]
      );
    }
    if (counterpart) {
      queryKeys.push(
        [
          "partitionBalance",
          { partitionId: parsedData.destinationPartitionId },
        ],
        [
          "partitionCanBeDeleted",
          { partitionId: counterpart.source_partition.id },
        ],
        [
          "accountCanBeDeleted",
          { accountId: counterpart.source_partition.account.id },
        ],
        [
          "accountBalance",
          { accountId: counterpart.source_partition.account.id },
        ],
        ["categoryKindBalance", counterpart.category.kind]
      );
      invalidateMany(queryClient, queryKeys);
    }
    invalidateMany(queryClient, queryKeys);
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
