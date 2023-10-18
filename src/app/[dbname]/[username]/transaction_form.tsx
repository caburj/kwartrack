import { rpc } from "@/app/rpc_client";
import {
  CATEGORY_COLOR,
  Categories,
  Category,
  DateInput,
  PARTITION_COLOR,
  Partitions,
  Unpacked,
  getCategoryOptionName,
  getPartitionType,
  invalidateMany,
  parseValue,
  useGroupedPartitions,
} from "@/utils/common";
import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ForwardedRef,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { number, object, optional, string } from "valibot";
import { Flex, Table, IconButton } from "@radix-ui/themes";
import { Combobox, ComboboxTrigger } from "./combobox";
import { ChevronRightIcon, PaperPlaneIcon } from "@radix-ui/react-icons";
import { css } from "../../../../styled-system/css";
import { UserPageStoreContext } from "./store";
import { toast } from "sonner";
import DatePicker from "react-datepicker";

type PartitionOption = Unpacked<
  Awaited<ReturnType<typeof rpc.post.getPartitionOptions>>
>;
type UserCategories = Awaited<ReturnType<typeof rpc.post.getUserCategories>>;

const CategoryComboBox = forwardRef(function CategoryComboBox(
  props: { categories: Categories },
  ref: ForwardedRef<HTMLButtonElement>
) {
  const { categories } = props;

  const [store, dispatch] = useContext(UserPageStoreContext);

  const selectedCategoryId = store.selectedCategoryId;

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
  const variant = selectedCategory?.is_private ? "outline" : "soft";

  return (
    <Combobox
      groupedItems={props.categories}
      getGroupHeading={(key) => key}
      getItemColor={(item, key) => {
        return CATEGORY_COLOR[key];
      }}
      getItemValue={(c, k) => `${k} ${getCategoryOptionName(c)}`}
      getItemDisplay={(c) => getCategoryOptionName(c)}
      onSelectItem={(c) => {
        dispatch({ type: "SET_SELECTED_CATEGORY_ID", payload: c.id });
      }}
    >
      <ComboboxTrigger ref={ref} color={color} variant={variant}>
        {categoryName}
      </ComboboxTrigger>
    </Combobox>
  );
});

const PartitionCombobox = forwardRef(function PartitionCombobox(
  props: {
    partitions: Partitions;
    user: { id: string; dbname: string };
    selectedCategory: Category | undefined;
    selectedPartitionId: string;
    command: "SET_SELECTED_SOURCE_ID" | "SET_SELECTED_DESTINATION_ID";
    placeholder: string;
  },
  ref: ForwardedRef<HTMLButtonElement>
) {
  const { partitions, user, selectedPartitionId, command, selectedCategory } =
    props;

  const selectedPartition = useMemo(() => {
    return partitions.find((p) => p.id === selectedPartitionId);
  }, [partitions, selectedPartitionId]);

  const [store, dispatch] = useContext(UserPageStoreContext);

  const groupedPartitions = useGroupedPartitions(partitions, user.id);

  const partitionName = selectedPartition
    ? `${selectedPartition.account.label} - ${selectedPartition.name}`
    : props.placeholder;

  const color =
    selectedPartition &&
    PARTITION_COLOR[getPartitionType(selectedPartition, user.id)];

  const variant = selectedPartition?.is_private ? "outline" : "soft";

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
      onSelectItem={(p) => {
        dispatch({ type: command, payload: p.id });
      }}
    >
      <ComboboxTrigger ref={ref} color={color} variant={variant}>
        {partitionName}
      </ComboboxTrigger>
    </Combobox>
  );
});

function TransactionFormMain(props: {
  partitions: PartitionOption[];
  groupedCategories: UserCategories;
  user: { id: string; dbname: string };
}) {
  const { partitions, groupedCategories, user } = props;
  const queryClient = useQueryClient();

  const createTransaction = useMutation(rpc.post.createTransaction);

  const [store, dispatch] = useContext(UserPageStoreContext);

  const selectedSourceId = store.selectedSourceId;
  const selectedDestinationId = store.selectedDestinationId;

  const [inputValue, setInputValue] = useState("");
  const [inputDescription, setInputDescription] = useState("");

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const selectedCategoryId = store.selectedCategoryId;

  const categories = useMemo(() => {
    return [
      ...groupedCategories.Expense,
      ...groupedCategories.Income,
      ...groupedCategories.Transfer,
    ];
  }, [groupedCategories]);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  const mainPartitionFilter = useMemo(() => {
    if (store.partitionIds.length === 1) {
      const partitionFilter = partitions.find(
        (p) => p.id === store.partitionIds[0]
      );
      if (partitionFilter) {
        // if category is private, only return if partition is private
        if (selectedCategory?.is_private) {
          if (partitionFilter.is_private) {
            return partitionFilter;
          }
        } else {
          return partitionFilter;
        }
      }
    }
  }, [partitions, store.partitionIds, selectedCategory]);

  const mainCategoryFilter = useMemo(() => {
    if (store.categoryIds.length === 1) {
      const category = categories.find((c) => c.id === store.categoryIds[0]);
      return category;
    }
  }, [categories, store.categoryIds]);

  useEffect(() => {
    if (mainPartitionFilter && !selectedSourceId) {
      dispatch({
        type: "SET_SELECTED_SOURCE_ID",
        payload: mainPartitionFilter.id,
      });
    }
    if (mainCategoryFilter && !selectedCategoryId) {
      dispatch({
        type: "SET_SELECTED_CATEGORY_ID",
        payload: mainCategoryFilter.id,
      });
    }
  }, [
    mainCategoryFilter,
    mainPartitionFilter,
    selectedCategoryId,
    dispatch,
    selectedSourceId,
  ]);

  const inputCategoryKind = useMemo(() => {
    return selectedCategory ? selectedCategory.kind : "";
  }, [selectedCategory]);

  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const partitionButtonRef = useRef<HTMLButtonElement>(null);

  let value: number | undefined = undefined;
  try {
    value = parseValue(inputValue);
  } catch (_error) {}

  const disableSubmit =
    !value || value <= 0 || isNaN(value) || createTransaction.isLoading;

  const onSubmit = async () => {
    if (disableSubmit) return;

    const dataSchema = object({
      sourcePartitionId: string(),
      destinationPartitionId: optional(string()),
      categoryId: string(),
      value: number(),
      description: optional(string()),
      userId: string(),
      date: optional(string()),
    });
    const parsedData = dataSchema.parse({
      description: inputDescription,
      categoryId: selectedCategoryId,
      sourcePartitionId: selectedSourceId,
      destinationPartitionId: selectedDestinationId,
      date: selectedDate?.toISOString(),
      userId: user.id,
      value,
    });
    try {
      const { transaction, counterpart } = await createTransaction.mutateAsync({
        ...parsedData,
        dbname: user.dbname,
      });
      setInputDescription("");
      dispatch({ type: "SET_SELECTED_CATEGORY_ID", payload: "" });
      dispatch({ type: "SET_SELECTED_SOURCE_ID", payload: "" });
      dispatch({ type: "SET_SELECTED_DESTINATION_ID", payload: "" });
      const queryKeys: QueryKey[] = [];
      if (transaction) {
        setInputValue("");
        queryKeys.push(
          ["transactions"],
          ["categoryBalance", { categoryId: parsedData.categoryId }],
          ["categoryCanBeDeleted", { categoryId: parsedData.categoryId }],
          ["partitionBalance", { partitionId: parsedData.sourcePartitionId }],
          [
            "accountCanBeDeleted",
            { accountId: transaction.source_partition.account.id },
          ],
          [
            "accountBalance",
            { accountId: transaction.source_partition.account.id },
          ],
          ["categoryKindBalance", transaction.category.kind],
          ["unpaidLoans", user.id, transaction.source_partition.id]
        );
      }
      if (counterpart) {
        queryKeys.push(
          [
            "partitionBalance",
            { partitionId: parsedData.destinationPartitionId },
          ],
          [
            "accountCanBeDeleted",
            { accountId: counterpart.source_partition.account.id },
          ],
          [
            "accountBalance",
            { accountId: counterpart.source_partition.account.id },
          ]
        );
      }
      invalidateMany(queryClient, queryKeys);

      categoryButtonRef.current?.focus();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Table.Row
      onKeyDown={(event) => {
        if (["Enter"].includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
          return onSubmit();
        }
      }}
      className={css({
        "& td:focus-within": {
          outline: "2px solid var(--accent-a8)",
          outlineOffset: "-2px",
        },
      })}
    >
      <Table.Cell>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => {
            setSelectedDate(date);
          }}
          dateFormat="yyyy-MM-dd"
          customInput={<DateInput />}
        />
      </Table.Cell>
      <Table.Cell>
        <CategoryComboBox
          ref={categoryButtonRef}
          categories={groupedCategories}
        />
      </Table.Cell>
      <Table.Cell>
        <Flex>
          <PartitionCombobox
            partitions={partitions.filter((p) => p.account.is_owned)}
            user={user}
            selectedCategory={selectedCategory}
            selectedPartitionId={selectedSourceId}
            command="SET_SELECTED_SOURCE_ID"
            placeholder={
              inputCategoryKind == "Transfer"
                ? "Source Partition"
                : "Select Partition"
            }
            ref={partitionButtonRef}
          />
          {inputCategoryKind == "Transfer" ? (
            <>
              <Flex align="center">
                <ChevronRightIcon />
              </Flex>
              <PartitionCombobox
                partitions={partitions}
                user={user}
                selectedCategory={selectedCategory}
                selectedPartitionId={selectedDestinationId}
                command="SET_SELECTED_DESTINATION_ID"
                placeholder="Destination Partition"
              />
            </>
          ) : null}
        </Flex>
      </Table.Cell>
      <Table.Cell>
        <input
          placeholder="Enter amount"
          name="value"
          type="numeric"
          value={inputValue}
          onInput={(event) => {
            setInputValue((event.target as HTMLInputElement).value);
          }}
          autoComplete="off"
          disabled={createTransaction.isLoading}
          style={{ textAlign: "right", width: "100%" }}
        />
      </Table.Cell>
      <Table.Cell>
        <Flex>
          <input
            placeholder="E.g. from colruyt"
            name="description"
            disabled={createTransaction.isLoading}
            autoComplete="off"
            style={{ flexGrow: 1 }}
            value={inputDescription}
            onInput={(event) => {
              setInputDescription((event.target as HTMLInputElement).value);
            }}
          />
        </Flex>
      </Table.Cell>
      <Table.Cell>
        <IconButton
          disabled={disableSubmit}
          variant="ghost"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            return onSubmit();
          }}
        >
          <PaperPlaneIcon />
        </IconButton>
      </Table.Cell>
    </Table.Row>
  );
}

export function TransactionForm(props: {
  user: { id: string; dbname: string };
}) {
  const { user } = props;
  const partitions = useQuery(["partitions", user.id], () => {
    return rpc.post.getPartitionOptions({
      userId: user.id,
      dbname: user.dbname,
    });
  });
  const categories = useQuery(["categories", user.id], () => {
    return rpc.post.getUserCategories({ userId: user.id, dbname: user.dbname });
  });

  if (!partitions.data || !categories.data) {
    return null;
  }

  return (
    <TransactionFormMain
      partitions={partitions.data}
      groupedCategories={categories.data}
      user={user}
    />
  );
}
