import {
  Button,
  Dialog,
  Flex,
  Separator,
  Switch,
  Text,
  TextField,
} from '@radix-ui/themes';
import { createDisturber } from 'disturb';
import { boolean, minLength, object, parse, string } from 'valibot';
import { Partition } from '@/utils/derived_types';
import { TwoColumnInput } from '@/utils/common';

export const editPartition = createDisturber<
  { name: string; isPrivate: boolean },
  { partition: Partition }
>(function EditPartitionDialog({ partition, confirmWith, cancel, open }) {
  const editPartitionFormId = `edit-partition-form-${partition.id}`;
  return (
    <Dialog.Root
      open={open}
      onOpenChange={open => {
        if (!open) {
          cancel();
        }
      }}
    >
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>Edit partition</Dialog.Title>
        <Separator size="4" mb="4" />
        <Flex direction="column" gap="3" asChild>
          <form
            id={editPartitionFormId}
            onSubmit={async e => {
              e.preventDefault();
              const form = document.getElementById(editPartitionFormId);
              const formdata = new FormData(form as HTMLFormElement);
              const schema = object({
                name: string([minLength(1)]),
                isPrivate: boolean(),
              });
              const fdata = Object.fromEntries(formdata.entries());
              const parsedData = parse(schema, {
                name: fdata.name,
                isPrivate: fdata.isPrivate === 'on',
              });
              confirmWith(parsedData);
            }}
          >
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Name
              </Text>
              <TextField.Input
                name="name"
                placeholder="Enter partition name"
                defaultValue={partition.name}
              />
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Private
              </Text>
              <Switch name="isPrivate" defaultChecked={partition.is_private} />
            </TwoColumnInput>
          </form>
        </Flex>
        <Separator size="4" mt="4" />
        <Flex gap="3" mt="4" justify="start" direction="row-reverse">
          <Button type="submit" form={editPartitionFormId}>
            Save
          </Button>
          <Button variant="soft" color="gray" onClick={cancel}>
            Discard
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
});
