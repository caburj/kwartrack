import {
  acceptInvitation,
  getMyInvitation,
} from "@/procedures/server_functions";
import { Centered, TwoColumnInput } from "@/utils/common";
import { currentUser } from "@clerk/nextjs";
import {
  Card,
  Flex,
  Switch,
  Text,
  TextFieldInput,
} from "@radix-ui/themes";
import Link from "next/link";
import { css } from "../../../styled-system/css";
import { boolean, minLength, object, string } from "valibot";
import { redirect } from "next/navigation";
import { SubmitButton } from "../welcome-first-user/submit_button";

const acceptInvitationAction = async (data: FormData) => {
  "use server";
  const formData = Object.fromEntries(data.entries());
  const schema = object({
    code: string([minLength(3)]),
    username: string([minLength(3)]),
    fullName: string([minLength(3)]),
    invitationId: string([minLength(3)]),
    startNewDb: boolean(),
  });
  const parsedData = schema.parse({
    ...formData,
    startNewDb: formData.startNewDb === "on",
  });
  const result = await acceptInvitation({
    code: parsedData.code,
    username: parsedData.username,
    fullName: parsedData.fullName,
    invitationId: parsedData.invitationId,
    startNewDb: parsedData.startNewDb,
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
    throw new Error("Not logged in");
  }
  const primaryEmail = user.emailAddresses.find(
    (em) => em.id === user.primaryEmailAddressId
  );
  if (!primaryEmail) {
    throw new Error("Email not found");
  }
  const code = searchParams?.code as string | undefined;
  const myInvitation = await getMyInvitation({
    email: primaryEmail.emailAddress,
    code,
  });
  if (!myInvitation) {
    return (
      <div>
        <p>You are not invited</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }
  return (
    <Centered>
      <Card>
        <Flex direction="column" gap="2" asChild>
          <form
            action={acceptInvitationAction}
            className={css({ width: "350px" })}
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
                defaultValue={myInvitation.code}
                readOnly={myInvitation.correctCode}
              />
            </TwoColumnInput>
            {myInvitation.allow_new_db && (
              <TwoColumnInput>
                <Text as="div" size="2" mb="1" weight="bold">
                  Start New DB?
                </Text>
                <Switch name="startNewDb" />
              </TwoColumnInput>
            )}
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
              <input type="text" name="invitationId" value={myInvitation.id} readOnly />
            </span>
            <SubmitButton disabled={false}>Accept Invitation</SubmitButton>
          </form>
        </Flex>
      </Card>
    </Centered>
  );
}
