import { currentUser } from '@clerk/nextjs';
import { Card, Flex, Table, Text } from '@radix-ui/themes';
import { getActiveInvitations } from '@/procedures/server_functions';
import { Centered } from '@/utils/common';
import { css } from '../../../../styled-system/css';
import { CopyClipboardButton } from './copy_clipboard_button';

export default async function InvitationsPage() {
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
  const invitations = await getActiveInvitations({
    inviterEmail: primaryEmail.emailAddress,
  });

  return (
    <Centered>
      <Card asChild>
        <div className={css({ minWidth: '400px', maxWidth: '800px' })}>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>URL</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {invitations.length === 0 ? (
                <Table.Row>
                  <Table.Cell>No invitations</Table.Cell>
                  <Table.Cell></Table.Cell>
                </Table.Row>
              ) : (
                invitations.map(invitation => {
                  const url = `${process.env.NEXT_PUBLIC_HOST}${invitation.url}`;
                  return (
                    <Table.Row key={invitation.id}>
                      <Table.Cell>{invitation.email}</Table.Cell>
                      <Table.Cell>
                        <Flex gap="2">
                          <Text>{url}</Text>
                          <CopyClipboardButton url={url} />
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  );
                })
              )}
            </Table.Body>
          </Table.Root>
        </div>
      </Card>
    </Centered>
  );
}
