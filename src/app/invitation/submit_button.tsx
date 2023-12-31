"use client";

import { Button, Text } from "@radix-ui/themes";
import { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export const SubmitButton = (props: { children: ReactNode }) => {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Text>Submitting...</Text>
      ) : (
        <Text size="2" weight="bold">
          {props.children}
        </Text>
      )}
    </Button>
  );
};
