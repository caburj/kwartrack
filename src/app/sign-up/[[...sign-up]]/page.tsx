import { SignUp } from '@clerk/nextjs';
import { Centered } from '@/utils/common';

export default function Page() {
  return (
    <Centered>
      <SignUp />
    </Centered>
  );
}
