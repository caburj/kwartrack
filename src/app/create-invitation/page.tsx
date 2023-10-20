import { Centered, TwoColumnInput } from "@/utils/common";
import {
  Button,
  Card,
  Flex,
  Switch,
  Text,
  TextFieldInput,
} from "@radix-ui/themes";
import { css } from "../../../styled-system/css";
import { boolean, minLength, object, string } from "valibot";
import { currentUser } from "@clerk/nextjs/server";
import { createInvitation } from "@/procedures/server_functions";
import { redirect } from "next/navigation";
import { SubmitButton } from "../welcome-first-user/submit_button";

const createInvitationAction = async (data: FormData) => {
  "use server";

  const user = await currentUser();
  if (!user) {
    throw new Error("Not logged in");
  }
  const primaryEmailAddress = user.emailAddresses.find(
    (em) => em.id === user.primaryEmailAddressId
  );
  if (!primaryEmailAddress) {
    throw new Error("Email not found");
  }

  const formData = Object.fromEntries(data.entries());
  const schema = object({
    email: string([minLength(3)]),
    code: string([minLength(3)]),
    isAdmin: boolean(),
  });
  const parsedData = schema.parse({
    ...formData,
    isAdmin: formData.isAdmin === "on",
  });

  const result = await createInvitation({
    email: parsedData.email,
    code: parsedData.code,
    isAdmin: parsedData.isAdmin,
    inviterEmail: primaryEmailAddress.emailAddress,
  });

  if (!result) {
    throw new Error("Failed to create invitation");
  }
  if ("error" in result) {
    throw new Error(result.error);
  }
  return redirect("/invitations");
};

export default function CreateInvitationPage() {
  return (
    <Centered>
      <Card>
        <Flex direction="column" gap="2" asChild>
          <form
            action={createInvitationAction}
            className={css({ width: "350px" })}
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
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Allow new DB?
              </Text>
              <Switch name="isAdmin" />
            </TwoColumnInput>
            <SubmitButton disabled={false}>Create Invitation</SubmitButton>
          </form>
        </Flex>
      </Card>
    </Centered>
  );
}
