'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Disturbers } from 'disturb';

export default function UserLayout(props: { children: React.ReactNode }) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: {
              refetchOnWindowFocus: false,
            },
          },
        })
      }
    >
      {props.children}
      <Disturbers />
    </QueryClientProvider>
  );
}
