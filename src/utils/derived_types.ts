import { badgePropDefs } from '@radix-ui/themes';
import { Unpacked } from '@/utils/common';
import { rpc } from '@/app/rpc_client';

export type UserIDAndDBName = NonNullable<
  Unpacked<Awaited<ReturnType<typeof rpc.post.getUserIdAndDbname>>>
>;

export type Account = Unpacked<
  NonNullable<Awaited<ReturnType<typeof rpc.post.getAccounts>>>
>;

export type Partition = Unpacked<
  NonNullable<Awaited<ReturnType<typeof rpc.post.getPartitions>>>
>;

export type Category = Awaited<
  ReturnType<typeof rpc.post.getUserCategories>
>['Income'][number];

export type BadgeColor = (typeof badgePropDefs)['color']['values'][number];

export type BadgeVariant = (typeof badgePropDefs)['variant']['values'][number];
