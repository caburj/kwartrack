"use client";

import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import { Box, Card, Flex, Text, TextFieldInput } from "@radix-ui/themes";
import { TwoColumnInput, debounce } from "@/utils/common";
import { FormEvent, useCallback, useMemo, useState } from "react";
import { rpc } from "../rpc_client";
import { signup } from "./signup";
import { SubmitButton } from "./submit_button";

export default function SignUpPage() {
  const { isLoaded, user } = useUser();
  if (!isLoaded) {
    return null;
  }

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
  user: NonNullable<ReturnType<typeof useUser>["user"]>;
  email: string;
}) => {
  const [disableForm, setDisableForm] = useState(true);

  const debouncedCheckUsername = useMemo(
    () =>
      debounce(async (value: string) => {
        const isAvailable = await rpc.post.checkUsername({ username: value });
        if (isAvailable) {
          setDisableForm(false);
          if (!isAvailable) {
            setDisableForm(true);
          } else {
            setDisableForm(false);
          }
        }
      }, 250),
    [setDisableForm]
  );

  const onInputUsername = useCallback(
    (event: FormEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      if (value.length < 2) {
        setDisableForm(true);
        return;
      }
      debouncedCheckUsername(value);
    },
    [setDisableForm, debouncedCheckUsername]
  );

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
                defaultValue={`${user.firstName} ${user.lastName}`}
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
                  onInput={onInputUsername}
                />
                {disableForm && (
                  <Text size="1" color="gray">
                    Username must be unique
                  </Text>
                )}
              </Flex>
            </TwoColumnInput>
            <TwoColumnInput>
              <Box>{/* empty first column */}</Box>
              <SubmitButton disabled={disableForm} />
            </TwoColumnInput>
          </form>
        </Flex>
      </Card>
    </Flex>
  );
};
