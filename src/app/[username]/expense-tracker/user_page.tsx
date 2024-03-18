'use client';

import { UserPageStoreContext, UserPageStoreProvider } from './store';
import {
  Box,
  Button,
  Flex,
  IconButton,
  Link,
  ScrollArea,
  Switch,
  Tabs,
  Text,
} from '@radix-ui/themes';
import { TransactionsTable } from './transactions_table';
import { SideBar } from './side_bar';
import {
  ForwardedRef,
  forwardRef,
  useContext,
  useEffect,
  useState,
} from 'react';
import { css } from '../../../../styled-system/css';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TriangleRightIcon,
} from '@radix-ui/react-icons';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Colors,
  PointElement,
  LineElement,
  LineController,
  BarController,
} from 'chart.js';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateMany } from '@/utils/common';
import autocolors from 'chartjs-plugin-autocolors';
import DatePicker from 'react-datepicker';

import { useTransactions } from './use_transactions';
import { Dashboard } from './dashboard';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Colors,
  PointElement,
  LineElement,
  LineController,
  BarController,
  autocolors,
);

ChartJS.defaults.plugins.legend.display = false;

const CustomDatePickerButton = forwardRef(function CustomInput(
  { value, onClick }: any,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  return (
    <Button onClick={onClick} ref={ref} variant="outline">
      {value}
    </Button>
  );
});

const TableControls = (props: {
  isTableLoading: boolean;
  hasNextPage: boolean;
}) => {
  const queryClient = useQueryClient();

  const [store, dispatch] = useContext(UserPageStoreContext);

  const currentPage = store.currentPage;

  const incrementPage = () => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: currentPage + 1 });
  };

  const decrementPage = () => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: currentPage - 1 });
  };

  const balanceLabel = store.showOverallBalance ? 'Overall' : 'Selected Date';

  return (
    <Flex justify="between" m="2">
      {store.showOverallBalance ? (
        <span>{/* empty span */}</span>
      ) : (
        <Flex mt="0" align="center">
          <IconButton
            mr="2"
            variant="surface"
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              dispatch({ type: 'SET_PREV_MONTH' });
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <DatePicker
            selected={store.tssDate}
            onChange={date => {
              dispatch({
                type: 'SET_TSS_DATE',
                payload: date,
              });
              if (!store.showOverallBalance) {
                invalidateMany(queryClient, [
                  ['partitionBalance'],
                  ['categoryBalance'],
                  ['categoryKindBalance'],
                ]);
              }
            }}
            customInput={<CustomDatePickerButton />}
          />
          <TriangleRightIcon />
          <DatePicker
            selected={store.tseDate}
            onChange={date => {
              dispatch({
                type: 'SET_TSE_DATE',
                payload: date,
              });
              if (!store.showOverallBalance) {
                invalidateMany(queryClient, [
                  ['partitionBalance'],
                  ['categoryBalance'],
                  ['categoryKindBalance'],
                ]);
              }
            }}
            customInput={<CustomDatePickerButton />}
          />
          <IconButton
            ml="2"
            variant="surface"
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              dispatch({ type: 'SET_NEXT_MONTH' });
            }}
          >
            <ChevronRightIcon />
          </IconButton>
          <Link
            ml="2"
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              dispatch({ type: 'SET_THIS_MONTH' });
            }}
          >
            This Month
          </Link>
        </Flex>
      )}
      <Flex mt="0" gap="3" align="center">
        <Text weight="medium">
          <Flex gap="2" align="center">
            Show <strong>{balanceLabel}</strong> balance
            <Switch
              checked={store.showOverallBalance}
              onClick={() => {
                dispatch({ type: 'TOGGLE_BALANCE_TO_DISPLAY' });
                invalidateMany(queryClient, [
                  ['transactions'],
                  ['groupedTransactions'],
                  ['partitionBalance'],
                  ['categoryBalance'],
                  ['categoryKindBalance'],
                ]);
              }}
            />
          </Flex>
        </Text>

        <Flex gap="3" align="center">
          <IconButton
            onClick={decrementPage}
            disabled={props.isTableLoading || currentPage === 1}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Text>{currentPage}</Text>
          <IconButton
            onClick={incrementPage}
            disabled={props.isTableLoading || !props.hasNextPage}
          >
            <ChevronRightIcon />
          </IconButton>
        </Flex>
      </Flex>
    </Flex>
  );
};

export function UserPage(props: { id: string; dbname: string }) {
  const [width, setWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const transactions = useTransactions(props);

  useEffect(() => {
    if (isDragging) {
      const onMouseMove = (e: MouseEvent) => {
        if (e.clientX < 300 || e.clientX > 600) return;
        setWidth(e.clientX);
      };
      const onMouseUp = () => {
        setIsDragging(false);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <UserPageStoreProvider>
      <Flex gap="3">
        <SideBar user={props} width={width} />
        <div
          className={css({
            position: 'fixed',
            top: '0',
            bottom: '0',
            width: '4px',
            backgroundColor: isDragging ? 'var(--accent-a9)' : undefined,
            transition: 'background-color 0.3s ease',
            '&:hover': {
              cursor: 'col-resize',
              backgroundColor: 'var(--accent-a9)',
            },
            zIndex: 100,
          })}
          style={{
            left: `${width - 2}px`,
          }}
          onMouseDown={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onMouseUp={e => {
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
          asChild
        >
          <Flex direction="column" justify="between">
            <TableControls
              isTableLoading={transactions.isLoading}
              hasNextPage={transactions.data?.[1] ?? false}
            />
            <Tabs.Root defaultValue="transactions" asChild>
              <Flex direction="column" grow="1" style={{ overflow: 'hidden' }}>
                <Tabs.List>
                  <Tabs.Trigger value="transactions">Transactions</Tabs.Trigger>
                  <Tabs.Trigger value="charts">Charts</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="transactions" asChild>
                  <ScrollArea>
                    <TransactionsTable user={props} />
                  </ScrollArea>
                </Tabs.Content>
                <Tabs.Content value="charts" asChild>
                  <ScrollArea>
                    <Dashboard user={props} />
                  </ScrollArea>
                </Tabs.Content>
              </Flex>
            </Tabs.Root>
          </Flex>
        </Box>
      </Flex>
    </UserPageStoreProvider>
  );
}
