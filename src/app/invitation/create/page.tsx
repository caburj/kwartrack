import { Card, Flex, Text, TextFieldInput } from '@radix-ui/themes';
import { minLength, object, string, parse } from 'valibot';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createInvitation } from '@/procedures/server_functions';
import { Centered, TwoColumnInput } from '@/utils/common';
import { css } from '../../../../styled-system/css';
import { SubmitButton } from '../submit_button';

const createInvitationAction = async (data: FormData) => {
  'use server';

  const user = await currentUser();
  if (!user) {
    throw new Error('Not logged in');
  }
  const primaryEmailAddress = user.emailAddresses.find(
    em => em.id === user.primaryEmailAddressId,
  );
  if (!primaryEmailAddress) {
    throw new Error('Email not found');
  }

  const formData = Object.fromEntries(data.entries());
  const schema = object({
    email: string([minLength(3)]),
    code: string([minLength(3)]),
  });
  const parsedData = parse(schema, {
    ...formData,
  });

  const result = await createInvitation({
    email: parsedData.email,
    code: parsedData.code,
    inviterEmail: primaryEmailAddress.emailAddress,
  });

  if (!result) {
    throw new Error('Failed to create invitation');
  }
  if ('error' in result) {
    throw new Error(result.error);
  }
  return redirect('/invitation/list');
};

export default function CreateInvitationPage() {
  return (
    <Centered>
      <Card>
        <Flex direction="column" gap="2" asChild>
          <form
            action={createInvitationAction}
            className={css({ width: '350px' })}
          >
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Email
              </Text>
              <TextFieldInput
                name="email"
                placeholder="Enter email"
                type="email"
              />
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Code
              </Text>
              <TextFieldInput
                name="code"
                placeholder="Enter code"
                type="text"
              />
            </TwoColumnInput>
            <SubmitButton>Create Invitation</SubmitButton>
          </form>
        </Flex>
      </Card>
    </Centered>
  );
}
