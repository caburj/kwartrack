import { currentUser } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import { Card, Flex, Separator, Text, TextFieldInput } from "@radix-ui/themes";
import { TwoColumnInput } from "@/utils/common";
import { signup } from "./signup";
import { SubmitButton } from "./submit_button";
import { areThereAnyUsers } from "@/procedures/server_functions";

export default async function WelcomeFirstUser() {
  const alreadyHasUser = await areThereAnyUsers();

  if (alreadyHasUser) {
    return notFound();
  }

  const user = await currentUser();

  if (user === null) {
    return notFound();
  }

  const primaryEmail = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

  if (primaryEmail === undefined) {
    return notFound();
  }

  return <RegisterForm user={user} email={primaryEmail} />;
}

const RegisterForm = ({
  user,
  email,
}: {
  user: NonNullable<Awaited<ReturnType<typeof currentUser>>>;
  email: string;
}) => {
  const name = `${user.firstName ? `${user.firstName} ` : ""}${
    user.lastName ?? ""
  }`;

  return (
    <Flex
      position="fixed"
      top="0"
      left="0"
      bottom="0"
      right="0"
      direction="column"
      justify="center"
      align="center"
    >
      <Card style={{ maxWidth: 400 }}>
        <Flex direction="column" gap="2">
          <Text size="4">Hello {name || "Adventurer"}!</Text>
          <Separator size="4" />
          <Flex asChild direction="column" gap="3">
            <form action={signup}>
              <TwoColumnInput>
                <Text as="div" size="2" mb="1" weight="bold">
                  Email
                </Text>
                <Text>{email}</Text>
              </TwoColumnInput>
              <TwoColumnInput>
                <Text as="div" size="2" mb="1" weight="bold">
                  Name
                </Text>
                <TextFieldInput
                  name="name"
                  placeholder="Full Name"
                  defaultValue={name}
                />
              </TwoColumnInput>
              <TwoColumnInput>
                <Text as="div" size="2" mb="1" weight="bold">
                  Username
                </Text>
                <Flex direction="column">
                  <TextFieldInput
                    name="username"
                    placeholder="Username"
                    required
                  />
                </Flex>
              </TwoColumnInput>
              <SubmitButton disabled={false}>Create First User</SubmitButton>
            </form>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
};
