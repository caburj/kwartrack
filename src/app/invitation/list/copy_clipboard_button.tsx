'use client';

import { ClipboardCopyIcon } from '@radix-ui/react-icons';
import { Flex, IconButton } from '@radix-ui/themes';

export function CopyClipboardButton({ url }: { url: string }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
  };
  return (
    <Flex direction="column" align="center" justify="center">
      <IconButton onClick={copyToClipboard} variant="ghost">
        <ClipboardCopyIcon />
      </IconButton>
    </Flex>
  );
}
