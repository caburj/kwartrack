"use client";

import { UserPageStoreContext, UserPageStoreProvider } from "./store";
import {
  Box,
  Flex,
  ScrollArea,
  Table,
  TableBody,
  TableHeader,
  TableRowHeaderCell,
  Text,
} from "@radix-ui/themes";
import { TransactionsTable } from "./transactions_table";
import { SideBar } from "./side_bar";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { css } from "../../../../styled-system/css";
import * as Accordion from "@radix-ui/react-accordion";
import { AnimatedAccordionContent } from "./accordion";
import "react-datepicker/dist/react-datepicker.css";
import "react-loading-skeleton/dist/skeleton.css";
import { ChevronUpIcon } from "@radix-ui/react-icons";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useQuery } from "@tanstack/react-query";
import { rpc } from "@/app/rpc_client";
import { QueryResult, formatValue } from "@/utils/common";
import { GroupedTransactionsReturns } from "../../../../dbschema/queries/grouped-transactions.query";
import { Colors } from "chart.js";
import autocolors from "chartjs-plugin-autocolors";

import { useClickAway } from "@uidotdev/usehooks";

ChartJS.register(ArcElement, Tooltip, Legend, Colors, autocolors);

export function UserPage(props: { id: string; dbname: string }) {
  const [width, setWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isDragging) {
      const onMouseMove = (e: MouseEvent) => {
        if (e.clientX < 300 || e.clientX > 600) return;
        setWidth(e.clientX);
      };
      const onMouseUp = () => {
        setIsDragging(false);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <UserPageStoreProvider>
      <Flex gap="3">
        <SideBar user={props} width={width} />
        <div
          className={css({
            position: "fixed",
            top: "0",
            bottom: "0",
            width: "4px",
            backgroundColor: isDragging ? "var(--accent-a9)" : undefined,
            transition: "background-color 0.3s ease",
            "&:hover": {
              cursor: "col-resize",
              backgroundColor: "var(--accent-a9)",
            },
            zIndex: 100,
          })}
          style={{
            left: `${width - 2}px`,
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
        ></div>
        <Box
          position="fixed"
          top="0"
          right="0"
          bottom="0"
          style={{
            left: `${width}px`,
          }}
        >
          <Flex direction="column" p="2" height="100%" justify="between">
            <TransactionsTable user={props} />
            <ChartContainer user={props} />
          </Flex>
        </Box>
      </Flex>
    </UserPageStoreProvider>
  );
}

/**
 * This box should take the bottom and has a control to hide or show it. Also, height should be half of height of the page.
 */
function ChartContainer(props: { user: { id: string; dbname: string } }) {
  const triggerRef = useRef<HTMLDivElement>(null);

  const closeChart = useCallback(() => {
    if (triggerRef.current && triggerRef.current.dataset.state === "open") {
      triggerRef.current.click();
    }
  }, [triggerRef]);

  const ref = useClickAway<HTMLDivElement>(closeChart);

  return (
    <Flex direction="column" ref={ref}>
      <Accordion.Root type="multiple">
        <Accordion.Item value="only-item">
          <Accordion.Header asChild>
            <Accordion.Trigger asChild>
              <Flex
                ref={triggerRef}
                justify="center"
                align="center"
                className={css({
                  "&[data-state=open]": {
                    "& svg": {
                      transform: "rotate(180deg)",
                    },
                    borderTopLeftRadius: "5px",
                    borderTopRightRadius: "5px",
                  },
                  "&[data-state=closed]": {
                    borderBottomLeftRadius: "5px",
                    borderBottomRightRadius: "5px",
                    borderTopLeftRadius: "5px",
                    borderTopRightRadius: "5px",
                  },
                  cursor: "pointer",
                  backgroundColor: "var(--gray-5)",
                })}
              >
                <ChevronUpIcon />
              </Flex>
            </Accordion.Trigger>
          </Accordion.Header>
          <AnimatedAccordionContent>
            <ChartBox user={props.user} />
          </AnimatedAccordionContent>
        </Accordion.Item>
      </Accordion.Root>
    </Flex>
  );
}

function ChartBox(props: { user: { id: string; dbname: string } }) {
  const [store] = useContext(UserPageStoreContext);

  const groupedTransactions = useQuery(
    [
      "groupedTransactions",
      store.loanIds,
      store.categoryIds,
      store.partitionIds,
      store.tssDate,
      store.tseDate,
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

  return (
    <QueryResult query={groupedTransactions}>
      {(result) => {
        const { incomes, expenses, summary } = getPieChartData(result);

        if (incomes.labels.length === 0 && expenses.labels.length === 0) {
          return (
            <Flex
              align="center"
              justify="center"
              className={css({
                width: "100%",
                minHeight: "300px",
                maxHeight: "400px",
                borderBottomLeftRadius: "5px",
                borderBottomRightRadius: "5px",
                border: "1px solid var(--gray-5)",
              })}
            >
              <Text align="center">No charts to show</Text>
            </Flex>
          );
        }

        const negativeTotal = result
          .filter((x) => !x.key.is_positive)
          .reduce((t, gt) => t + parseFloat(gt.total), 0);

        const positiveTotal = result
          .filter((x) => x.key.is_positive)
          .reduce((t, gt) => t + parseFloat(gt.total), 0);

        const total = positiveTotal + negativeTotal;

        return (
          <ScrollArea>
            <Flex
              className={css({
                width: "100%",
                minHeight: "300px",
                maxHeight: "400px",
                borderBottomLeftRadius: "5px",
                borderBottomRightRadius: "5px",
                border: "1px solid var(--gray-5)",
              })}
            >
              <Flex direction="column" p="3">
                <Table.Root>
                  <TableHeader>
                    <TableRowHeaderCell>
                      <Text weight="bold">Summary</Text>
                    </TableRowHeaderCell>
                    <TableRowHeaderCell align="right">
                      <Text weight="bold">Amount</Text>
                    </TableRowHeaderCell>
                  </TableHeader>
                  <TableBody>
                    <Table.Row>
                      <Table.Cell>Income</Table.Cell>
                      <Table.Cell align="right">
                        {formatValue(positiveTotal)}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Expenses</Table.Cell>
                      <Table.Cell align="right">
                        {formatValue(negativeTotal)}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Balance</Table.Cell>
                      <Table.Cell align="right">
                        {formatValue(total)}
                      </Table.Cell>
                    </Table.Row>
                  </TableBody>
                </Table.Root>
              </Flex>
              {incomes.labels.length > 0 ? (
                <Flex direction="column" p="3">
                  <Text align="center">Incomes</Text>
                  <Doughnut
                    style={{ height: "100%" }}
                    data={incomes}
                    options={{
                      plugins: {
                        autocolors: {
                          mode: "data",
                          offset: 15,
                        },
                      },
                    }}
                  />
                </Flex>
              ) : null}
              {expenses.labels.length > 0 ? (
                <Flex direction="column" p="3">
                  <Text align="center">Expenses</Text>
                  <Doughnut
                    data={expenses}
                    options={{
                      plugins: {
                        autocolors: {
                          mode: "data",
                        },
                      },
                    }}
                  />
                </Flex>
              ) : null}
              {expenses.labels.length > 0 && incomes.labels.length > 0 ? (
                <Flex direction="column" p="3">
                  <Text align="center">Summary</Text>
                  <Doughnut
                    data={summary}
                    options={{
                      plugins: {
                        autocolors: {
                          mode: "data",
                          offset: 20,
                        },
                      },
                    }}
                  />
                </Flex>
              ) : null}
            </Flex>
          </ScrollArea>
        );
      }}
    </QueryResult>
  );
}

function getPieChartData(groupedTransactions: GroupedTransactionsReturns) {
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

  return {
    incomes: {
      labels: incomeVals.map((x) => x.key.category.name),
      datasets: [{ data: incomeVals.map((x) => parseFloat(x.total)) }],
    },
    expenses: {
      labels: expenseVals.map((x) => x.key.category.name),
      datasets: [{ data: expenseVals.map((x) => parseFloat(x.total)) }],
    },
    summary: {
      labels: ["Income", "Expenses"],
      datasets: [{ data: [positiveTotal, negativeTotal] }],
    },
  };
}
