"use client";

import { Centered } from "@/utils/common";
import { Card, Text } from "@radix-ui/themes";

export default function ErrorPage({ error }: { error: Error }) {
  return (
    <Centered>
      <Card>
        <Text>{error.message}</Text>
      </Card>
    </Centered>
  );
}
