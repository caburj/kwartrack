import { center } from "../../../../styled-system/patterns";
import { UserPageStoreContext } from "./store";
import { Box, Flex, Grid, Text } from "@radix-ui/themes";
import { useContext, useState } from "react";
import { Doughnut, Chart } from "react-chartjs-2";
import { useQuery } from "@tanstack/react-query";
import { rpc } from "@/app/rpc_client";
import { QueryResult, formatValue } from "@/utils/common";
import { GroupedTransactionsReturns } from "../../../../dbschema/queries/grouped-transactions.query";
import { GroupedTransactionsByDateReturns } from "../../../../dbschema/queries/grouped-transactions-by-date.query";

type Summary = "income" | "expense" | "balance";

export function Dashboard(props: { user: { id: string; dbname: string } }) {
  const [store] = useContext(UserPageStoreContext);
  const [isExpense, setIsExpense] = useState<Summary>("expense");

  const groupedTransactions = useQuery(
    [
      "groupedTransactions",
      store.loanIds,
      store.categoryIds,
      store.partitionIds,
      store.tssDate,
      store.tseDate,
      store.showOverallBalance,
    ],
    async () => {
      return await rpc.post.getGroupedTransactions({
        loanIds: store.loanIds,
        partitionIds: store.partitionIds,
        categoryIds: store.categoryIds,
        tssDate: store.tssDate?.toISOString(),
        tseDate: store.tseDate?.toISOString(),
        ownerId: props.user.id,
        dbname: props.user.dbname,
        isOverall: store.showOverallBalance,
      });
    }
  );

  const totalPerDate = useQuery(["totalPerDate", store], async () => {
    return rpc.post.getTotalPerDate({
      partitionIds: store.partitionIds,
      categoryIds: store.categoryIds,
      tssDate: store.tssDate?.toISOString(),
      tseDate: store.tseDate?.toISOString(),
      ownerId: props.user.id,
      dbname: props.user.dbname,
      isOverall: store.showOverallBalance,
    });
  });

  return (
    <QueryResult query={groupedTransactions}>
      {([gp, gpByDate]) => {
        const pieChartData = getPieChartData(gp, isExpense);

        const negativeTotal = gp
          .filter((x) => !x.key.is_positive)
          .reduce((t, gt) => t + parseFloat(gt.total), 0);

        const positiveTotal = gp
          .filter((x) => x.key.is_positive)
          .reduce((t, gt) => t + parseFloat(gt.total), 0);

        const total = positiveTotal + negativeTotal;

        const accumulatedTotal = totalPerDate.data?.reduce((acc, cur) => {
          const {
            key: { date_str },
            total,
          } = cur;
          const last = acc[acc.length - 1];
          if (!last) {
            return [{ date_str, total: parseFloat(total) }];
          } else {
            return [
              ...acc,
              { date_str, total: parseFloat(total) + last.total },
            ];
          }
        }, [] as { date_str: string; total: number }[]);

        return (
          <Flex direction="column" m="4">
            <Grid columns="3" gap="3" width="auto">
              <CursoredBox onClick={() => setIsExpense("income")}>
                <CategoryKindCard
                  title="TOTAL INCOME"
                  total={positiveTotal}
                  color="green"
                  isActive={isExpense == "income"}
                />
              </CursoredBox>
              <CursoredBox onClick={() => setIsExpense("expense")}>
                <CategoryKindCard
                  title="TOTAL EXPENSE"
                  total={Math.abs(negativeTotal)}
                  color="red"
                  isActive={isExpense == "expense"}
                />
              </CursoredBox>
              <CursoredBox onClick={() => setIsExpense("balance")}>
                <CategoryKindCard
                  title="BALANCE"
                  total={total}
                  color="blue"
                  isActive={isExpense == "balance"}
                />
              </CursoredBox>
            </Grid>
            <Grid columns="300px 1fr" gap="3" m="4">
              <Box>
                <Doughnut
                  options={{
                    plugins: {
                      legend: { display: true },
                      autocolors: {
                        mode: "data",
                        offset: 15,
                      },
                    },
                    spacing: 1,
                    radius: "90%",
                  }}
                  data={pieChartData}
                />
              </Box>
              <Box>
                <Chart
                  type="bar"
                  options={{
                    plugins: {
                      legend: { display: true },
                    },
                    scales: {
                      x: {
                        stacked: true,
                      },
                      y: {
                        stacked: true,
                        position: "left",
                        title: {
                          display: true,
                          text: "Expense/Income"
                        }
                      },
                      ...(isExpense == "balance"
                        ? ({
                            y1: {
                              type: "linear",
                              display: true,
                              position: "right",
                              title: {
                                display: true,
                                text: "Balance"
                              },
                              // grid line settings
                              grid: {
                                drawOnChartArea: false, // only want the grid lines for one axis to show up
                              },
                            },
                          } as const)
                        : ({} as const)),
                    },
                  }}
                  data={getBarChartData(gpByDate, isExpense, accumulatedTotal)}
                />
              </Box>
            </Grid>
          </Flex>
        );
      }}
    </QueryResult>
  );
}

function CategoryKindCard(props: {
  title: string;
  total: number;
  color: string;
  isActive: boolean;
}) {
  return (
    <Flex
      direction="column"
      p="2"
      className={center({ h: "full" })}
      style={{
        border: `solid 1px var(--${props.color}-7)`,
        borderRadius: "8px",
        backgroundColor: `var(--${props.color}-${props.isActive ? "9" : "2"})`,
        color: `var(--${props.color}-${props.isActive ? "1" : "9"})`,
      }}
    >
      <Text size="2" my="2">
        {props.title}
      </Text>
      <Text size="6" weight="bold" my="2">
        {formatValue(props.total)}
      </Text>
    </Flex>
  );
}

function CursoredBox(props: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return <Box style={{ cursor: "pointer" }} {...props} />;
}

function getPieChartData(
  groupedTransactions: GroupedTransactionsReturns,
  summary: Summary
) {
  const incomeVals = groupedTransactions.filter((x) => x.key.is_positive);
  const expenseVals = groupedTransactions.filter((x) => !x.key.is_positive);

  incomeVals.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
  expenseVals.sort((a, b) => parseFloat(a.total) - parseFloat(b.total));

  const positiveTotal = incomeVals.reduce(
    (acc, cur) => acc + parseFloat(cur.total),
    0
  );

  const negativeTotal = expenseVals.reduce(
    (acc, cur) => acc + parseFloat(cur.total),
    0
  );

  switch (summary) {
    case "income":
      return {
        labels: incomeVals.map((x) => x.key.category.name),
        datasets: [
          {
            data: incomeVals.map((x) => parseFloat(x.total)),
          },
        ],
      };
    case "expense":
      return {
        labels: expenseVals.map((x) => x.key.category.name),
        datasets: [
          {
            data: expenseVals.map((x) => Math.abs(parseFloat(x.total))),
          },
        ],
      };
    case "balance":
      return {
        labels: ["Income", "Expense"],
        datasets: [
          {
            data: [positiveTotal, negativeTotal],
          },
        ],
      };
  }
}

function getBarChartData(
  gpByDate: GroupedTransactionsByDateReturns,
  summary: Summary,
  accumulatedTotal?: { date_str: string; total: number }[]
) {
  const style = getComputedStyle(document.body);
  const red3 = style.getPropertyValue("--red-3");
  const green3 = style.getPropertyValue("--green-3");
  const red7 = style.getPropertyValue("--red-7");
  const green7 = style.getPropertyValue("--green-7");
  const red9 = style.getPropertyValue("--red-9");
  const green9 = style.getPropertyValue("--green-9");
  const blue9 = style.getPropertyValue("--blue-9");
  const blue3 = style.getPropertyValue("--blue-3");

  const dates = [...new Set(gpByDate.map((x) => x.key.date_str))].sort(
    (a, b) => {
      const aDate = new Date(a);
      const bDate = new Date(b);
      return aDate.getTime() - bDate.getTime();
    }
  );
  const incomeMap = new Map<string, number>();
  const expenseMap = new Map<string, number>();
  for (const gt of gpByDate) {
    if (gt.key.is_positive) {
      incomeMap.set(gt.key.date_str, parseFloat(gt.total));
    } else {
      expenseMap.set(gt.key.date_str, parseFloat(gt.total));
    }
  }
  const incomeVals = dates.map((date) => incomeMap.get(date) ?? 0);
  const expenseVals = dates.map((date) => expenseMap.get(date) ?? 0);

  const balanceLine =
    accumulatedTotal && summary == "balance"
      ? [
          {
            type: "line" as const,
            label: "Balance",
            data: accumulatedTotal.map((x) => x.total),
            borderColor: blue9,
            borderWidth: 2,
            fill: false,
            pointRadius: 4,
            pointBorderColor: blue9,
            pointBackgroundColor: blue3,
            yAxisID: "y1",
          },
        ]
      : [];

  return {
    labels: dates,
    datasets: [
      ...balanceLine,
      {
        type: "bar" as const,
        label: "Income",
        data: incomeVals,
        backgroundColor:
          summary == "expense"
            ? green3
            : summary == "balance"
            ? green7
            : green9,
        borderColor: summary == "expense" ? green7 : green9,
        borderWidth: 1,
      },
      {
        type: "bar" as const,
        label: "Expense",
        data: expenseVals,
        backgroundColor:
          summary == "income" ? red3 : summary == "balance" ? red7 : red9,
        borderColor: summary == "income" ? red7 : red9,
        borderWidth: 1,
      },
    ],
  };
}
