import { Centered } from "@/utils/common";
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <Centered>
      <SignUp />
    </Centered>
  );
}
