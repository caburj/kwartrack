import { Centered } from '@/utils/common';
import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <Centered>
      <SignIn />
    </Centered>
  );
}
