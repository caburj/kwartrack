'use client';

import { Card, Text } from '@radix-ui/themes';
import { Centered } from '@/utils/common';

export default function ErrorPage({ error }: { error: Error }) {
  return (
    <Centered>
      <Card>
        <Text>{error.message}</Text>
      </Card>
    </Centered>
  );
}
