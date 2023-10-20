"use client";

import { Button, Text } from "@radix-ui/themes";
import { ReactNode } from "react";
import { experimental_useFormStatus as useFormStatus } from "react-dom";

export const SubmitButton = (props: { disabled: boolean; children: ReactNode }) => {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={props.disabled || pending}>
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
