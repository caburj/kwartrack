import {
  Badge,
  Button,
  Dialog,
  Flex,
  Separator,
  Text,
  TextField,
} from '@radix-ui/themes';
import { createDisturber } from 'disturb';
import { object, optional, parse, string, transform } from 'valibot';
import { TwoColumnInput } from '@/utils/common';
import { BadgeColor, BadgeVariant } from '@/utils/derived_types';

type BadgeInfo = {
  name: string;
  color: BadgeColor;
  variant: BadgeVariant;
};

export const getPaymentInput = createDisturber<
  { amount: number; description?: string },
  {
    loanId: string;
    defaultAmount: string;
    borrower: BadgeInfo;
    lender: BadgeInfo;
    category: BadgeInfo;
  }
>(function GetPaymentInputDialog({
  loanId,
  defaultAmount,
  borrower,
  lender,
  category,
  confirmWith,
  cancel,
  open,
}) {
  const paymentFormId = `form-${loanId}`;
  return (
    <Dialog.Root open={open} onOpenChange={open => !open && cancel()}>
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>Make a Payment</Dialog.Title>
        <Separator size="4" mb="4" />
        <Flex direction="column" gap="3" asChild>
          <form
            id={paymentFormId}
            onSubmit={async e => {
              e.preventDefault();
              const form = document.getElementById(paymentFormId);
              const formdata = new FormData(form as HTMLFormElement);
              const schema = object({
                amount: transform(string(), v => parseFloat(v)),
                description: optional(string()),
              });
              const toParse = { ...Object.fromEntries(formdata.entries()) };
              const parsedData = parse(schema, toParse);
              confirmWith(parsedData);
            }}
          >
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Source
              </Text>
              <Flex>
                <Badge color={borrower.color} variant={borrower.variant}>
                  <Text>{borrower.name}</Text>
                </Badge>
              </Flex>
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Destination
              </Text>
              <Flex>
                <Badge color={lender.color} variant={lender.variant}>
                  <Text>{lender.name}</Text>
                </Badge>
              </Flex>
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Category
              </Text>
              <Flex>
                <Badge color={category.color} variant={category.variant}>
                  <Text>{category.name}</Text>
                </Badge>
              </Flex>
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Amount
              </Text>
              <TextField.Input
                name="amount"
                placeholder="Payment amount"
                type="numeric"
                defaultValue={defaultAmount}
              />
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Description
              </Text>
              <TextField.Input name="description" placeholder="Description" />
            </TwoColumnInput>
          </form>
        </Flex>
        <Separator size="4" mt="4" />
        <Flex gap="3" mt="4" justify="start" direction="row-reverse">
          <Button type="submit" form={paymentFormId}>
            Save Payment
          </Button>
          <Button variant="soft" color="gray" onClick={cancel}>
            Discard
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
});
