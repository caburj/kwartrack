import {
  acceptInvitation,
  getMyInvitation,
} from '@/procedures/server_functions';
import { Centered, TwoColumnInput } from '@/utils/common';
import { currentUser } from '@clerk/nextjs';
import { Card, Flex, Text, TextFieldInput } from '@radix-ui/themes';
import { css } from '../../../../styled-system/css';
import { minLength, object, string, parse } from 'valibot';
import { notFound, redirect } from 'next/navigation';
import { SubmitButton } from '../submit_button';

const acceptInvitationAction = async (data: FormData) => {
  'use server';
  const formData = Object.fromEntries(data.entries());
  const schema = object({
    code: string([minLength(3)]),
    username: string([minLength(3)]),
    fullName: string([minLength(3)]),
    invitationId: string([minLength(3)]),
  });
  const parsedData = parse(schema, formData);
  const result = await acceptInvitation({
    code: parsedData.code,
    username: parsedData.username,
    fullName: parsedData.fullName,
    invitationId: parsedData.invitationId,
  });
  redirect(`/${result.username}/expense-tracker`);
};

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const user = await currentUser();
  if (!user) {
    throw new Error('Not logged in');
  }
  const primaryEmail = user.emailAddresses.find(
    em => em.id === user.primaryEmailAddressId,
  );
  if (!primaryEmail) {
    throw new Error('Email not found');
  }
  const code = searchParams?.code as string | undefined;
  const myInvitation = await getMyInvitation({
    email: primaryEmail.emailAddress,
    code,
  });
  if (!myInvitation) {
    return notFound();
  }

  const submitButtonText = myInvitation.startOwnDb ? 'Start New DB' : 'Join';

  return (
    <Centered>
      <Card>
        <Flex direction="column" gap="2" asChild>
          <form
            action={acceptInvitationAction}
            className={css({ width: '350px' })}
          >
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Email
              </Text>
              <Text>{myInvitation.email}</Text>
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Inviter
              </Text>
              <Text>{myInvitation.inviterEmail}</Text>
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Code
              </Text>
              <TextFieldInput
                name="code"
                placeholder="Code"
                defaultValue={
                  myInvitation.isCorrectCode ? myInvitation.code : ''
                }
                readOnly={myInvitation.isCorrectCode}
              />
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Username
              </Text>
              <TextFieldInput name="username" placeholder="Username" required />
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Full Name
              </Text>
              <TextFieldInput
                name="fullName"
                placeholder="Full Name"
                required
              />
            </TwoColumnInput>
            <span hidden>
              <input
                type="text"
                name="invitationId"
                value={myInvitation.id}
                readOnly
              />
            </span>
            <SubmitButton>{submitButtonText}</SubmitButton>
          </form>
        </Flex>
      </Card>
    </Centered>
  );
}
