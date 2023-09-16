"use client";

import {
  MouseEventHandler,
  ReactHTML,
  ReactNode,
  useContext,
  useState,
} from "react";
import { css } from "../../../../styled-system/css";
import { rpc } from "../../rpc_client";
import {
  type UseQueryResult,
  useQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import {
  boolean,
  minLength,
  number,
  object,
  optional,
  string,
  type Input,
} from "valibot";
import { UserPageStoreProvider, UserPageStoreContext } from "./store";
import { Unpacked, formatValue, groupBy } from "@/utils/common";
import { HiPlus } from "react-icons/hi";
import { RxCross2 } from "react-icons/rx";
import { DialogProvider, useDialog } from "@/utils/useDialog";

export default function Main(props: {
  params: { username: string; dbname: string };
}) {
  const { username, dbname } = props.params;
  return (
    <UserPageStoreProvider>
      <UserPage username={username} dbname={dbname} />
    </UserPageStoreProvider>
  );
}

export function UserPage({
  username,
  dbname,
}: {
  username: string;
  dbname: string;
}) {
  const user = useQuery(["user", username], () => {
    return rpc.post.findUser({ username, dbname });
  });
  return (
    <QueryResult
      query={user}
      onLoading={<>Loading {`${username}'s accounts`}...</>}
      onUndefined={<>{`${username}'s data`} not found</>}
    >
      {(user) => (
        <div className={css({ display: "flex", height: "100%" })}>
          <DialogProvider>
            <SideBar user={user} />
          </DialogProvider>
          <div
            className={css({
              height: "100%",
              display: "flex",
              backgroundColor: "#f5f5f5",
              flexDirection: "column",
              flexGrow: 1,
            })}
          >
            <TransactionForm user={user} />
            <Transactions user={user} />
          </div>
        </div>
      )}
    </QueryResult>
  );
}

type FindUserResult = NonNullable<
  Unpacked<Awaited<ReturnType<typeof rpc.post.findUser>>>
>;

function SectionLabel(props: {
  children: React.ReactNode;
  onClickPlus?: () => void;
}) {
  return (
    <h1
      className={css({
        fontWeight: "bold",
        textAlign: "center",
        fontSize: "1.1rem",
        display: "flex",
        mt: "2",
      })}
    >
      <span
        className={css({
          me: "4",
        })}
      >
        {props.children}
      </span>
      <span
        className={css({
          height: "1px",
          alignSelf: "center",
          flexGrow: 1,
          borderBottom: "0.5px solid black",
        })}
      ></span>
      <span
        className={css({
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          fontSize: "1.5rem",
          ms: 4,
        })}
        onClick={(event) => {
          event.stopPropagation();
          if (props.onClickPlus) {
            return props.onClickPlus();
          }
        }}
      >
        <HiPlus />
      </span>
    </h1>
  );
}

const DialogLayout = (props: { children: ReactNode }) => {
  return (
    <div
      className={css({
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      })}
    >
      <div
        className={css({
          maxWidth: "500px",
          width: "40%",
          background: "#f5f5f5",
          borderRadius: "0.5rem",
          p: "4",
        })}
      >
        {props.children}
      </div>
    </div>
  );
};

const dialogFormClass = css({
  display: "grid",
  gridTemplateColumns: "1fr 3fr",
  gridGap: "0.5rem",
  "& *": {
    padding: "0.25rem 0.50rem",
    borderRadius: "0.25rem",
  },
  "& *:focus": {
    outline: "1px solid blue",
  },
  "& label": {
    ps: 0,
    fontSize: "0.8rem",
    fontWeight: "medium",
  },
  "& select": {
    appearance: "none",
    // TODO: Check the security of this background image.
    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
    backgroundRepeat: "no-repeat, repeat",
    backgroundPosition: "right .7em top 50%, 0 0",
    backgroundSize: ".65em auto, 100%",
  },
  "& input[type=checkbox]": {
    appearance: "none",
    width: "1.25rem",
    height: "1.25rem",
    border: "1px solid gray",
    borderRadius: "0.25rem",
    position: "relative",
    cursor: "pointer",
    display: "inline-block",
    ms: "1",
    "&:checked": {
      backgroundColor: "black",
      "&::before": {
        content: "",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "0.75rem",
        height: "0.75rem",
        borderRadius: "0.5rem",
      },
    },
  },
});

const dialogButtonsClass = css({
  display: "flex",
  flexDirection: "row-reverse",
  justifyContent: "flex-start",
  width: "100%",
  mt: "4",
  backgroundColor: "#f5f5f5",
  "& button": {
    cursor: "pointer",
    px: "2",
    py: "1",
    ms: "2",
    borderRadius: "0.25rem",
    outline: "1px solid black",
    "&:hover": {
      backgroundColor: "#e5e5e5",
      outline: "1px solid blue",
      color: "blue",
    },
    "&:focus": {
      outline: "1px solid blue",
      color: "blue",
    },
  },
});

const newPartitionSchema = object({
  name: string([minLength(1)]),
  isPrivate: boolean(),
  accountId: string(),
  accountName: optional(string()),
  isSharedAccount: boolean(),
});

function PartitionForm(props: {
  close: () => void;
  confirm: (data: Input<typeof newPartitionSchema>) => void;
  user: FindUserResult;
}) {
  const { user, close, confirm } = props;
  const ownedAccounts = user.accounts.filter((a) =>
    a.owners.map((o) => o.id).includes(user.id)
  );
  const [accountId, setAccountId] = useState(
    ownedAccounts[0]?.id || "for-new-account"
  );
  return (
    <DialogLayout>
      <form
        id="partition-form"
        onSubmit={(e) => {
          e.preventDefault();
          const formdata = new FormData(e.target as HTMLFormElement);
          const parsedData = newPartitionSchema.parse({
            ...Object.fromEntries(formdata.entries()),
            isPrivate: formdata.get("isPrivate") === "on",
            isSharedAccount: formdata.get("isSharedAccount") === "on",
          });
          confirm(parsedData);
        }}
        className={dialogFormClass}
      >
        <label htmlFor="name">Partition Name</label>
        <input type="text" name="name" placeholder="E.g. Savings" />
        <label htmlFor="isPrivate">Private</label>
        <input type="checkbox" name="isPrivate" />
        <label htmlFor="accountId">Account</label>
        <select
          name="accountId"
          onChange={(e) => {
            setAccountId(e.target.value);
          }}
          defaultValue={accountId}
        >
          <option value="for-new-account">Create New Account</option>
          <optgroup label="My Accounts">
            {ownedAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </optgroup>
        </select>
        {accountId === "for-new-account" && (
          <>
            <label htmlFor="accountName">Account Name</label>
            <input
              type="text"
              name="accountName"
              placeholder="E.g. InterBank"
            />
            <label htmlFor="isSharedAccount">Shared Account</label>
            <input type="checkbox" name="isSharedAccount" />
          </>
        )}
      </form>
      <div className={dialogButtonsClass}>
        <button type="submit" form="partition-form">
          Confirm
        </button>
        <button onClick={close}>Cancel</button>
      </div>
    </DialogLayout>
  );
}

const newCategorySchema = object({
  name: string([minLength(1)]),
  kind: string(),
  isPrivate: boolean(),
});

function CategoryModal(props: {
  close: () => void;
  confirm: (data: Input<typeof newCategorySchema>) => void;
}) {
  const { close, confirm } = props;
  return (
    <DialogLayout>
      <form
        id="category-form"
        onSubmit={(e) => {
          e.preventDefault();
          const formdata = new FormData(e.target as HTMLFormElement);
          const parsedData = newCategorySchema.parse({
            ...Object.fromEntries(formdata.entries()),
            isPrivate: formdata.get("isPrivate") === "on",
          });
          confirm(parsedData);
        }}
        className={dialogFormClass}
      >
        <label htmlFor="name">Name</label>
        <input type="text" name="name" placeholder="E.g. Salary" />
        <label htmlFor="kind">Kind</label>
        <select name="kind" defaultValue="Expense">
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
          <option value="Transfer">Transfer</option>
        </select>
        <label htmlFor="isPrivate">Private</label>
        <input type="checkbox" name="isPrivate" />
      </form>
      <div className={dialogButtonsClass}>
        <button type="submit" form="category-form">
          Confirm
        </button>
        <button onClick={close}>Cancel</button>
      </div>
    </DialogLayout>
  );
}

function SideBar({ user }: { user: FindUserResult }) {
  const queryClient = useQueryClient();
  const showCategoryDialog = useDialog(CategoryModal);
  const showPartitionDialog = useDialog(PartitionForm, { user });

  return (
    <div
      className={css({
        width: "25%",
        minWidth: "25%",
        height: "100%",
        display: "flex",
        backgroundColor: "#f5f5f5",
        flexDirection: "column",
        justifyContent: "space-between",
      })}
    >
      <div
        className={css({
          flexGrow: 1,
          overflowY: "scroll",
          padding: "1rem 0.75rem 1rem 1rem",
          "&::-webkit-scrollbar": {
            width: "0.25rem",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "lightgray",
          },
        })}
      >
        <SectionLabel
          onClickPlus={async () => {
            const response = await showPartitionDialog(true);
            if (!response) return;

            const { name, isPrivate, accountId, accountName, isSharedAccount } =
              response;
            let forNewAccount = false;
            if (accountId === "for-new-account") {
              forNewAccount = true;
              if (!accountName?.trim()) {
                throw new Error("Account name is required");
              }
            }
            await rpc.post.createPartition({
              userId: user.id,
              dbname: user.dbname,
              name,
              isPrivate,
              forNewAccount,
              accountId,
              isSharedAccount,
              newAccountName: accountName,
            });
            queryClient.invalidateQueries({
              queryKey: ["accounts", user.id],
            });
            queryClient.invalidateQueries({
              queryKey: ["partitions", user.id],
            });
          }}
        >
          Accounts
        </SectionLabel>
        <Accounts user={user} />
        <SectionLabel
          onClickPlus={async () => {
            const userAction = await showCategoryDialog();
            if (userAction) {
              const { name, kind, isPrivate } = userAction;
              await rpc.post.createCategory({
                userId: user.id,
                dbname: user.dbname,
                name,
                kind,
                isPrivate,
              });
              queryClient.invalidateQueries({
                queryKey: ["categories", user.id],
              });
            }
          }}
        >
          Categories
        </SectionLabel>
        <Categories user={user} />
      </div>
      <DateRange user={user} />
    </div>
  );
}

type Account = Unpacked<
  NonNullable<Awaited<ReturnType<typeof rpc.post.getAccounts>>>
>;

function AccountLI({
  account,
  user,
}: {
  account: Account;
  user: { id: string; dbname: string };
}) {
  const queryClient = useQueryClient();
  const canBeDeleted = useQuery(
    ["accountCanBeDeleted", { accountId: account.id }],
    () => {
      return rpc.post.accountCanBeDeleted({
        accountId: account.id,
        dbname: user.dbname,
        userId: user.id,
      });
    }
  );
  const deleteAccount = useMutation(
    () => {
      return rpc.post.deleteAccount({
        accountId: account.id,
        dbname: user.dbname,
        userId: user.id,
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["accounts", user.id] });
      },
    }
  );
  const [store, dispatch] = useContext(UserPageStoreContext);
  return (
    <li
      key={account.id}
      className={css({
        marginBottom: "0.5rem",
        cursor: "pointer",
        fontWeight: "bold",
      })}
      onClick={() => {
        dispatch({
          type: "TOGGLE_ACCOUNT",
          payload: account.partitions.map((p) => p.id),
        });
      }}
    >
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
        })}
      >
        <span>
          <span
            className={css({
              verticalAlign: "middle",
            })}
          >
            {account.label}
          </span>
          {canBeDeleted.data && (
            <DeleteButton
              onClick={async (e) => {
                e.stopPropagation();
                await deleteAccount.mutateAsync();
              }}
            />
          )}
        </span>
        <LoadingValue
          queryKey={[
            "accountBalance",
            {
              accountId: account.id,
            },
          ]}
          valueLoader={() =>
            rpc.post.getAccountBalance({
              accountId: account.id,
              userId: user.id,
              dbname: user.dbname,
            })
          }
        />
      </div>
      <Partitions accountId={account.id} user={user} />
    </li>
  );
}

const getAccountGroup = (
  account: Account,
  userId: string
): "owned" | "common" | "others" => {
  if (account.owners.length === 1 && account.owners[0].id === userId) {
    return "owned";
  } else if (
    account.owners.length > 1 &&
    account.owners.map((o) => o.id).includes(userId)
  ) {
    return "common";
  } else {
    return "others";
  }
};

function GroupedAccounts(props: {
  title: string;
  accounts: Account[];
  user: { id: string; dbname: string };
}) {
  const { title, accounts, user } = props;
  return (
    <>
      <h1
        className={css({
          textAlign: "center",
          fontWeight: "bold",
        })}
      >
        - {title} -
      </h1>
      <ul className={css({ p: "2" })}>
        {accounts.map((account) => (
          <AccountLI account={account} user={user} key={account.id} />
        ))}
      </ul>
    </>
  );
}

function Accounts({ user }: { user: { id: string; dbname: string } }) {
  const accounts = useQuery(["accounts", user.id], () => {
    return rpc.post.getAccounts({ userId: user.id, dbname: user.dbname });
  });
  return (
    <QueryResult
      query={accounts}
      onLoading={<>Loading accounts...</>}
      onUndefined={<>No accounts found</>}
    >
      {(accounts) => {
        const groupedAccounts = groupBy(accounts, (account) => {
          return getAccountGroup(account, user.id);
        });
        return (
          <>
            <GroupedAccounts
              title="Owned"
              accounts={groupedAccounts.owned || []}
              user={user}
            />
            <GroupedAccounts
              title="Common"
              accounts={groupedAccounts.common || []}
              user={user}
            />
            <GroupedAccounts
              title="Others"
              accounts={groupedAccounts.others || []}
              user={user}
            />
          </>
        );
      }}
    </QueryResult>
  );
}

function DeleteButton(props: {
  onClick: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      className={css({
        cursor: "pointer",
        verticalAlign: "middle",
        color: "red",
        ms: "1",
      })}
      onClick={props.onClick}
    >
      <RxCross2 />
    </button>
  );
}

type Partition = Unpacked<
  NonNullable<Awaited<ReturnType<typeof rpc.post.getPartitions>>>
>;

function PartitionLI({
  partition,
  user,
}: {
  partition: Partition;
  user: { id: string; dbname: string };
}) {
  const queryClient = useQueryClient();
  const [store, dispatch] = useContext(UserPageStoreContext);
  const deletePartition = useMutation(
    () => {
      return rpc.post.deletePartition({
        partitionId: partition.id,
        dbname: user.dbname,
        userId: user.id,
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["partitions", user.id, partition.account.id],
        });
        queryClient.invalidateQueries({
          queryKey: [
            "accountCanBeDeleted",
            { accountId: partition.account.id },
          ],
        });
      },
    }
  );
  const canBeDeleted = useQuery(
    ["partitionCanBeDeleted", { partitionId: partition.id }],
    () => {
      return rpc.post.partitionCanBeDeleted({
        partitionId: partition.id,
        dbname: user.dbname,
        userId: user.id,
      });
    }
  );
  return (
    <li
      className={css({
        cursor: canBeDeleted.data ? "default" : "pointer",
        display: "flex",
        justifyContent: "space-between",
        fontWeight: "medium",
        color: store.partitionIds.includes(partition.id) ? "blue" : "inherit",
      })}
      onClick={(event) => {
        event.stopPropagation();
        if (canBeDeleted.data) return;
        dispatch({
          type: "TOGGLE_PARTITIONS",
          payload: [partition.id],
        });
      }}
    >
      <span>
        <span
          className={css({
            verticalAlign: "middle",
          })}
        >
          {partition.name}
        </span>
        {canBeDeleted.data && (
          <DeleteButton
            onClick={async (e) => {
              e.stopPropagation();
              await deletePartition.mutateAsync();
            }}
          />
        )}
      </span>
      <LoadingValue
        queryKey={[
          "partitionBalance",
          {
            partitionId: partition.id,
          },
        ]}
        valueLoader={() =>
          rpc.post.getPartitionBalance({
            partitionId: partition.id,
            userId: user.id,
            dbname: user.dbname,
          })
        }
      />
    </li>
  );
}

function Partitions(props: {
  accountId: string;
  user: { id: string; dbname: string };
}) {
  const { accountId, user } = props;
  const partitions = useQuery(["partitions", user.id, accountId], () => {
    return rpc.post.getPartitions({
      accountId,
      userId: user.id,
      dbname: user.dbname,
    });
  });
  return (
    <QueryResult
      query={partitions}
      onLoading={<>Loading partitions...</>}
      onUndefined={<>No partitions found</>}
    >
      {(partitions) => (
        <ul className={css({ paddingStart: "0.5rem" })}>
          {partitions.map((partition) => (
            <PartitionLI partition={partition} user={user} key={partition.id} />
          ))}
        </ul>
      )}
    </QueryResult>
  );
}

function Categories({ user }: { user: { id: string; dbname: string } }) {
  const queryClient = useQueryClient();
  const categories = useQuery(["categories", user.id], () => {
    return rpc.post.getUserCategories({ userId: user.id, dbname: user.dbname });
  });
  const [store, dispatch] = useContext(UserPageStoreContext);
  const categoryLabelClass = css({
    display: "flex",
    justifyContent: "space-between",
    fontWeight: "bold",
    cursor: "pointer",
  });
  const categoryListClass = css({
    pb: "2",
  });
  const selectCategories = (kind: string) => {
    if (kind === "Income") {
      if (categories?.data?.income) {
        dispatch({
          type: "TOGGLE_CATEGORY_KIND",
          payload: categories.data.income.map((c) => c.id),
        });
      }
    } else if (kind === "Expense") {
      if (categories?.data?.expense) {
        dispatch({
          type: "TOGGLE_CATEGORY_KIND",
          payload: categories.data.expense.map((c) => c.id),
        });
      }
    } else if (kind === "Transfer") {
      if (categories?.data?.transfer) {
        dispatch({
          type: "TOGGLE_CATEGORY_KIND",
          payload: categories.data.transfer.map((c) => c.id),
        });
      }
    }
  };
  return (
    <>
      <QueryResult
        query={categories}
        onLoading={<>Loading categories...</>}
        onUndefined={<>No categories found</>}
      >
        {(categories) => (
          <div className={css({ p: "2" })}>
            <div
              onClick={() => selectCategories("Income")}
              className={categoryLabelClass}
            >
              <span>Income</span>
              <LoadingValue
                queryKey={["categoryKindBalance", "Income"]}
                valueLoader={() =>
                  rpc.post.getCategoryKindBalance({
                    kind: "Income",
                    userId: user.id,
                    dbname: user.dbname,
                  })
                }
              />
            </div>
            <ul className={categoryListClass}>
              {categories.income.map((category) => (
                <Category key={category.id} category={category} user={user} />
              ))}
            </ul>
            <div
              onClick={() => selectCategories("Expense")}
              className={categoryLabelClass}
            >
              <span>Expense</span>
              <LoadingValue
                queryKey={["categoryKindBalance", "Expense"]}
                valueLoader={() =>
                  rpc.post.getCategoryKindBalance({
                    kind: "Expense",
                    userId: user.id,
                    dbname: user.dbname,
                  })
                }
              />
            </div>
            <ul className={categoryListClass}>
              {categories.expense.map((category) => (
                <Category key={category.id} category={category} user={user} />
              ))}
            </ul>
            <div
              onClick={() => selectCategories("Transfer")}
              className={categoryLabelClass}
            >
              <span>Transfer</span>
              <LoadingValue
                queryKey={["categoryKindBalance", "Transfer"]}
                valueLoader={() =>
                  rpc.post.getCategoryKindBalance({
                    kind: "Transfer",
                    userId: user.id,
                    dbname: user.dbname,
                  })
                }
              />
            </div>
            <ul className={categoryListClass}>
              {categories.transfer.map((category) => (
                <Category key={category.id} category={category} user={user} />
              ))}
            </ul>
          </div>
        )}
      </QueryResult>
    </>
  );
}

function Category({
  category,
  user,
}: {
  category: { id: string; name: string };
  user: { id: string; dbname: string };
}) {
  const queryClient = useQueryClient();
  const [store, dispatch] = useContext(UserPageStoreContext);
  const [name, setName] = useState(category.name);
  const canBeDeleted = useQuery(
    ["categoryCanBeDeleted", { categoryId: category.id }],
    () => {
      return rpc.post.categoryCanBeDeleted({
        categoryId: category.id,
        dbname: user.dbname,
        userId: user.id,
      });
    }
  );
  const deleteCategory = useMutation(
    () => {
      return rpc.post.deleteCategory({
        categoryId: category.id,
        dbname: user.dbname,
        userId: user.id,
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["categories", user.id] });
      },
    }
  );
  const updateCategory = useMutation((name: string) => {
    return rpc.post.updateCategory({
      categoryId: category.id,
      dbname: user.dbname,
      userId: user.id,
      name,
    });
  });
  const color = store.categoryIds.includes(category.id) ? "blue" : "inherit";
  return (
    <li
      key={category.id}
      className={css({
        color,
        fontWeight: "medium",
        display: "flex",
        justifyContent: "space-between",
        verticalAlign: "middle",
      })}
    >
      <span>
        <input
          className={css({
            verticalAlign: "middle",
          })}
          type="checkbox"
          onClick={() => {
            dispatch({ type: "TOGGLE_CATEGORIES", payload: [category.id] });
          }}
          checked={store.categoryIds.includes(category.id)}
        />
        {canBeDeleted.data && (
          <DeleteButton
            onClick={async (e) => {
              e.stopPropagation();
              await deleteCategory.mutateAsync();
            }}
          />
        )}
        <input
          className={css({
            color,
            backgroundColor: "#f5f5f5",
            verticalAlign: "middle",
            ms: "1",
            "&:focus": {
              outline: "none",
            },
          })}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          onBlur={(e) => {
            updateCategory.mutate(name);
          }}
          onKeyUp={async (e) => {
            if (e.key === "Enter") {
              updateCategory.mutate(name);
            }
          }}
        />
      </span>
      <LoadingValue
        queryKey={[
          "categoryBalance",
          {
            categoryId: category.id,
          },
        ]}
        valueLoader={() =>
          rpc.post.getCategoryBalance({
            userId: user.id,
            categoryId: category.id,
            dbname: user.dbname,
          })
        }
      />
    </li>
  );
}

function Transactions({ user }: { user: { id: string; dbname: string } }) {
  const queryClient = useQueryClient();
  const [store, dispatch] = useContext(UserPageStoreContext);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const incrementPage = () => {
    setCurrentPage((currentPage) => currentPage + 1);
  };

  const decrementPage = () => {
    setCurrentPage((currentPage) => currentPage - 1);
  };

  const transactions = useQuery(["transactions", store, currentPage], () => {
    return rpc.post.findTransactions({
      currentPage,
      nPerPage: store.nPerPage,
      partitionIds: store.partitionIds,
      categoryIds: store.categoryIds,
      ownerId: user.id,
      dbname: user.dbname,
      tssDate: store.tssDate?.toISOString(),
      tseDate: store.tseDate?.toISOString(),
    });
  });

  type Transaction = Unpacked<NonNullable<typeof transactions.data>[0]>;

  const getPartitionColumn = (transaction: Transaction) => {
    if (transaction.kind === "Transfer") {
      if (transaction.counterpart) {
        return `${transaction.source_partition.label} -> ${transaction.counterpart.source_partition.label}`;
      } else {
        return `${transaction.source_partition.label} -> private partition`;
      }
    } else {
      return transaction.source_partition.label;
    }
  };

  const shouldHideDelete = (transaction: Transaction) => {
    const partitions = [transaction.source_partition];
    if (transaction.counterpart) {
      partitions.push(transaction.counterpart.source_partition);
    }
    return !partitions.some((p) =>
      p.account.owners.map((o) => o.id).includes(user.id)
    );
  };

  return (
    <>
      <div
        className={css({
          display: "flex",
          justifyContent: "flex-end",
          padding: "0.5rem",
          "& button": {
            cursor: "pointer",
            padding: "0 0.50rem",
          },
        })}
      >
        <span>Items per page</span>
        <input
          type="number"
          min="1"
          max="100"
          value={store.nPerPage}
          onChange={(event) => {
            const value = parseInt(event.target.value);
            if (isNaN(value)) return;
            dispatch({ type: "SET_N_PER_PAGE", payload: value });
          }}
        />
        <button
          onClick={decrementPage}
          disabled={transactions.isLoading || currentPage === 1}
        >
          Prev
        </button>
        <span>{currentPage}</span>
        <button
          onClick={incrementPage}
          disabled={transactions.isLoading || !transactions.data?.[1]}
        >
          Next
        </button>
      </div>
      <div className={css({ margin: "0.5rem", overflowY: "scroll" })}>
        <table
          className={css({
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "0",
            "& td": {
              px: "2",
              py: "1",
              verticalAlign: "top",
            },
            "& th": {
              px: "2",
              py: "1",
              verticalAlign: "top",
              whiteSpace: "nowrap",
              borderTop: "1px solid black",
              borderBottom: "3px double black",
            },
            "& thead tr": {
              fontWeight: "bold",
            },
            "& tbody tr:nth-child(odd)": {
              backgroundColor: "#e5e5e5",
            },
          })}
        >
          <thead
            className={css({
              position: "sticky",
              top: 0,
              backgroundColor: "#f5f5f5",
            })}
          >
            <tr>
              <th
                className={css({
                  textAlign: "left",
                  width: "7.5%",
                })}
              >
                Date
              </th>
              <th
                className={css({
                  textAlign: "left",
                  width: "18%",
                })}
              >
                Category
              </th>
              <th
                className={css({
                  textAlign: "left",
                  width: "22%",
                })}
              >
                Partition
              </th>
              <th
                className={css({
                  textAlign: "right",
                  width: "10%",
                })}
              >
                Value
              </th>
              <th
                className={css({
                  textAlign: "left",
                  width: "40%",
                })}
              >
                Description
              </th>
              <th
                className={css({
                  width: "2.5%",
                })}
              ></th>
            </tr>
          </thead>
          <QueryResult query={transactions}>
            {([transactions]) => (
              <tbody>
                {transactions.map((transaction) => {
                  return (
                    <tr key={transaction.id}>
                      <td
                        className={css({
                          textAlign: "left",
                          width: "7.5%",
                        })}
                      >
                        {transaction.str_date.slice(5)}
                      </td>
                      <td
                        className={css({
                          textAlign: "left",
                          width: "18%",
                        })}
                      >
                        <span
                          className={css({
                            display: "flex",
                            width: "100%",
                          })}
                        >
                          <span>{transaction.category.name}</span>
                        </span>
                      </td>
                      <td
                        className={css({
                          textAlign: "left",
                          width: "22%",
                        })}
                      >
                        {getPartitionColumn(transaction)}
                      </td>
                      <td
                        className={css({
                          textAlign: "right",
                          width: "10%",
                        })}
                      >
                        {formatValue(parseFloat(transaction.value))}
                      </td>
                      <td
                        className={css({
                          textAlign: "left",
                          width: "40%",
                        })}
                      >
                        {transaction.description}
                      </td>
                      <td
                        className={css({
                          width: "2.5%",
                        })}
                      >
                        <button
                          hidden={shouldHideDelete(transaction)}
                          className={css({
                            cursor: "pointer",
                            padding: "0 0.25rem",
                            color: "red",
                          })}
                          onClick={async () => {
                            setIsDeleting(true);
                            await rpc.post.deleteTransaction({
                              transactionId: transaction.id,
                              userId: user.id,
                              dbname: user.dbname,
                            });
                            queryClient.invalidateQueries({
                              queryKey: ["transactions"],
                            });
                            queryClient.invalidateQueries({
                              queryKey: ["user", user.id],
                            });
                            queryClient.invalidateQueries({
                              queryKey: [
                                "partitionBalance",
                                {
                                  partitionId: transaction.source_partition.id,
                                },
                              ],
                            });
                            queryClient.invalidateQueries({
                              queryKey: [
                                "partitionCanBeDeleted",
                                {
                                  partitionId: transaction.source_partition.id,
                                },
                              ],
                            });
                            queryClient.invalidateQueries({
                              queryKey: [
                                "accountCanBeDeleted",
                                {
                                  accountId:
                                    transaction.source_partition.account.id,
                                },
                              ],
                            });
                            queryClient.invalidateQueries({
                              queryKey: [
                                "accountBalance",
                                {
                                  accountId:
                                    transaction.source_partition.account.id,
                                },
                              ],
                            });
                            queryClient.invalidateQueries({
                              queryKey: [
                                "categoryCanBeDeleted",
                                { categoryId: transaction.category.id },
                              ],
                            });
                            queryClient.invalidateQueries({
                              queryKey: [
                                "categoryBalance",
                                {
                                  categoryId: transaction.category.id,
                                },
                              ],
                            });
                            queryClient.invalidateQueries({
                              queryKey: [
                                "categoryKindBalance",
                                transaction.category.kind,
                              ],
                            });
                            if (transaction.counterpart) {
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "partitionBalance",
                                  {
                                    partitionId:
                                      transaction.counterpart.source_partition
                                        .id,
                                  },
                                ],
                              });

                              queryClient.invalidateQueries({
                                queryKey: [
                                  "partitionCanBeDeleted",
                                  {
                                    partitionId:
                                      transaction.counterpart.source_partition
                                        .id,
                                  },
                                ],
                              });

                              queryClient.invalidateQueries({
                                queryKey: [
                                  "accountCanBeDeleted",
                                  {
                                    accountId:
                                      transaction.counterpart.source_partition
                                        .account.id,
                                  },
                                ],
                              });
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "accountBalance",
                                  {
                                    accountId:
                                      transaction.counterpart.source_partition
                                        .account.id,
                                  },
                                ],
                              });
                            }
                            setIsDeleting(false);
                          }}
                          disabled={isDeleting}
                        >
                          <RxCross2 />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </QueryResult>
        </table>
      </div>
    </>
  );
}

function FormInput(props: {
  children: React.ReactNode;
  flexGrow?: number;
  width: string;
}) {
  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        flexGrow: props.flexGrow,
        width: props.width,
        padding: "0.5rem",
        "& *": {
          padding: "0.25rem 0.50rem",
          borderRadius: "0.25rem",
        },
        "& *:focus": {
          outline: "1px solid blue",
        },
        "& label": {
          fontSize: "0.8rem",
          fontWeight: "medium",
        },
        "& select": {
          appearance: "none",
          // TODO: Check the security of this background image.
          backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
          backgroundRepeat: "no-repeat, repeat",
          backgroundPosition: "right .7em top 50%, 0 0",
          backgroundSize: ".65em auto, 100%",
        },
      })}
    >
      {props.children}
    </div>
  );
}

type PartitionOption = Unpacked<
  NonNullable<Awaited<ReturnType<typeof rpc.post.getPartitionOptions>>>
>;

function PartitionOptGroup(props: {
  groupedPartitions: PartitionOption[];
  label: string;
  onlyPrivate: boolean;
}) {
  const { groupedPartitions, label, onlyPrivate } = props;
  return (
    <optgroup label={label}>
      {Object.entries(groupBy(groupedPartitions, (p) => p.account.id)).map(
        ([accountId, partitions]) => {
          const partitionsToShow = partitions.filter((p) =>
            onlyPrivate ? p.is_private : true
          );
          if (partitionsToShow.length === 0) return null;
          const options = [
            // insert at the beginning the account name
            {
              id: accountId,
              name: partitions[0].account.label,
              isDisabled: true,
            },
            ...partitionsToShow.map((p) => ({
              id: p.id,
              name: p.name,
              isDisabled: false,
            })),
          ];
          return options.map((p) => (
            <option key={p.id} value={p.id} disabled={p.isDisabled}>
              {p.name}
            </option>
          ));
        }
      )}
    </optgroup>
  );
}

function TransactionForm({ user }: { user: { id: string; dbname: string } }) {
  const queryClient = useQueryClient();
  const [store] = useContext(UserPageStoreContext);
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
  const [inputCategoryKind, setInputCategoryKind] = useState("");
  const [inputCategoryIsPrivate, setInputCategoryIsPrivate] = useState(false);
  const [inputValue, setInputValue] = useState("");

  let value: number | undefined = undefined;
  try {
    value = parseFloat(inputValue);
  } catch (_error) {}

  type Partition = NonNullable<Unpacked<typeof partitions.data>>;
  type Category = Unpacked<
    NonNullable<Unpacked<typeof categories.data>>["expense"]
  >;

  const getPartitionOptions = (
    partitions: Partition[],
    userId: string,
    onlyPrivate: boolean
  ) => {
    const groupedPartitions = groupBy(partitions, (p) => {
      if (p.account.owners.length === 1 && p.account.owners[0].id === userId) {
        return "owned";
      } else if (
        p.account.owners.length > 1 &&
        p.account.owners.map((o) => o.id).includes(userId)
      ) {
        return "common";
      } else {
        return "others";
      }
    });

    const ownedPartitions = groupedPartitions.owned || [];
    const commonPartitions = groupedPartitions.common || [];
    const othersPartitions = groupedPartitions.others || [];
    return (
      <>
        <PartitionOptGroup
          label="-- Owned --"
          groupedPartitions={ownedPartitions}
          onlyPrivate={onlyPrivate}
        />
        <PartitionOptGroup
          label="-- Common --"
          groupedPartitions={commonPartitions}
          onlyPrivate={onlyPrivate}
        />
        <PartitionOptGroup
          label="-- Others --"
          groupedPartitions={othersPartitions}
          onlyPrivate={onlyPrivate}
        />
      </>
    );
  };

  const getCategoryOptionName = (category: Category) => {
    if (category.is_private) {
      return `${category.name} (Private)`;
    } else {
      return category.name;
    }
  };

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
      userId: user.id,
      value,
    });
    const { transaction, counterpart } = await createTransaction.mutateAsync({
      ...parsedData,
      dbname: user.dbname,
    });
    target.reset();
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
    <form onSubmit={onSubmit} className={css({ display: "flex" })}>
      <FormInput flexGrow={2} width="20%">
        <label htmlFor="categoryId">Category</label>
        <QueryResult query={categories}>
          {(categories) => (
            <select
              name="categoryId"
              onChange={(event) => {
                const selectedCategory = [
                  ...categories.income,
                  ...categories.expense,
                  ...categories.transfer,
                ].find((c) => c.id === event.target.value);
                if (!selectedCategory) return;
                setInputCategoryKind(selectedCategory.kind);
                setInputCategoryIsPrivate(selectedCategory.is_private);
              }}
              disabled={createTransaction.isLoading}
            >
              <optgroup label="Income">
                {categories.income.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getCategoryOptionName(c)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Expenses">
                {categories.expense.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getCategoryOptionName(c)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Transfers">
                {categories.transfer.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getCategoryOptionName(c)}
                  </option>
                ))}
              </optgroup>
            </select>
          )}
        </QueryResult>
      </FormInput>
      <FormInput flexGrow={2} width="20%">
        <label htmlFor="sourcePartitionId">Source Partition</label>
        <QueryResult query={partitions}>
          {(partitions) => (
            <select
              name="sourcePartitionId"
              disabled={createTransaction.isLoading}
            >
              {getPartitionOptions(partitions, user.id, inputCategoryIsPrivate)}
            </select>
          )}
        </QueryResult>
      </FormInput>

      {inputCategoryKind == "Transfer" ? (
        <FormInput flexGrow={2} width="20%">
          <label htmlFor="destinationPartitionId">Destination Partition</label>
          <QueryResult query={partitions}>
            {(partitions) => (
              <select
                name="destinationPartitionId"
                disabled={createTransaction.isLoading}
              >
                {getPartitionOptions(
                  partitions,
                  user.id,
                  inputCategoryIsPrivate
                )}
              </select>
            )}
          </QueryResult>
        </FormInput>
      ) : null}
      <FormInput flexGrow={1} width="10%">
        <label htmlFor="value">Value</label>
        <input
          className={css({ textAlign: "right" })}
          type="text"
          inputMode="numeric"
          name="value"
          value={inputValue}
          onInput={(event) => {
            setInputValue((event.target as HTMLInputElement).value);
          }}
          disabled={createTransaction.isLoading}
        />
      </FormInput>
      <FormInput flexGrow={4} width="40%">
        <label htmlFor="description">Description</label>
        <input
          type="text"
          name="description"
          disabled={createTransaction.isLoading}
        />
      </FormInput>
      <button
        className={css({
          padding: "0.5rem",
          m: "2",
          borderRadius: "0.25rem",
          cursor: "pointer",
          color: "blue",
          outline: "1px solid blue",
          border: "none",
          "&:focus": {
            outline: "2px solid blue",
            color: "blue",
          },
          "&:disabled": {
            outline: "1px solid lightgray",
            color: "lightgray",
            border: "none",
          },
        })}
        type="submit"
        disabled={shouldDisableSubmit()}
      >
        Submit
      </button>
    </form>
  );
}

function DateRange({ user }: { user: { id: string; dbname: string } }) {
  const [store, dispatch] = useContext(UserPageStoreContext);
  return (
    <div
      className={css({
        borderTop: "1px solid lightgray",
        padding: "1rem",
      })}
    >
      <div>
        <label htmlFor="startDate">Start Date</label>
        <input
          type="date"
          name="startDate"
          value={store.tssDate?.toISOString().split("T")[0] ?? ""}
          onChange={(event) => {
            dispatch({
              type: "SET_TSS_DATE",
              payload: event.target.value
                ? new Date(event.target.value)
                : undefined,
            });
          }}
        />
      </div>
      <div>
        <label htmlFor="endDate">End Date</label>
        <input
          type="date"
          name="endDate"
          value={store.tseDate?.toISOString().split("T")[0] ?? ""}
          onChange={(event) => {
            dispatch({
              type: "SET_TSE_DATE",
              payload: event.target.value
                ? new Date(event.target.value)
                : undefined,
            });
          }}
        />
      </div>
    </div>
  );
}

function LoadingValue(props: {
  queryKey: [string, ...any];
  valueLoader: () => Promise<string>;
}) {
  return (
    <QueryResult
      query={useQuery(props.queryKey, props.valueLoader)}
      onLoading={<>...</>}
      onUndefined={<>Missing Value</>}
    >
      {(value) => {
        const parsedValue = parseFloat(value);
        let result;
        if (isNaN(parsedValue)) {
          result = value;
        } else {
          result = formatValue(parsedValue);
        }
        return (
          <span
            className={css({
              marginLeft: "0.5rem",
            })}
          >
            {result}
          </span>
        );
      }}
    </QueryResult>
  );
}

function QueryResult<T>(props: {
  as?: keyof ReactHTML;
  className?: string;
  query: UseQueryResult<T>;
  children: (data: NonNullable<T>) => React.ReactNode;
  onLoading?: React.ReactNode;
  onUndefined?: React.ReactNode;
  onError?: (error: Error) => React.ReactNode;
}) {
  const { data, isLoading, isError } = props.query;
  const { as: Tag } = props;
  let node: React.ReactNode;
  if (isLoading) {
    node = props.onLoading;
  } else if (isError) {
    node = props.onError ? props.onError(props.query.error as Error) : null;
  } else if (!data) {
    node = props.onUndefined;
  } else {
    node = props.children(data);
  }
  if (Tag === undefined) return <>{node}</>;
  return <Tag className={props.className}>{node}</Tag>;
}

function isSubset(subset: string[], superset: string[]) {
  return subset.every((item) => superset.includes(item));
}