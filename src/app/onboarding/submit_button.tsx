import { Button, Text } from "@radix-ui/themes";
import { experimental_useFormStatus as useFormStatus } from "react-dom";

export const SubmitButton = (props: { disabled: boolean }) => {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={props.disabled || pending}>
      {pending ? (
        <Text>Submitting...</Text>
      ) : (
        <Text size="2" weight="bold">
          Register
        </Text>
      )}
    </Button>
  );
};
