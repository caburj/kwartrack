import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

function makePromise<R, E = unknown>() {
  let resolve: (result: R) => void;
  let reject: (reason?: E) => void;
  const promise = new Promise<R>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return [promise, resolve!, reject!] as const;
}

type DialogProps<Data, Props> = {
  resolve: (data: Data | undefined) => void;
  asModal: boolean;
  Component: (
    props: Props & {
      close: () => void;
      confirm: (data: Data) => void;
    }
  ) => ReactNode;
  extraProps: Props;
};

const DialogContext = createContext<(dProps: DialogProps<any, any>) => void>(
  () => {}
);

export function DialogProvider<D>({ children }: { children: ReactNode }) {
  const [dProps, setDialogProps] = useState<DialogProps<D, unknown>>();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (dProps) {
      if (dProps.asModal) {
        dialogRef.current?.showModal();
      } else {
        dialogRef.current?.show();
      }
    }
  }, [dProps]);

  return (
    <DialogContext.Provider value={setDialogProps}>
      {children}
      {dProps && (
        <dialog
          ref={dialogRef}
          onClose={() => {
            setDialogProps(undefined);
            dProps.resolve(undefined);
          }}
        >
          <dProps.Component
            close={() => {
              setDialogProps(undefined);
              dProps.resolve(undefined);
            }}
            confirm={(data) => {
              setDialogProps(undefined);
              dProps.resolve(data);
            }}
            {...(dProps.extraProps as any)}
          />
        </dialog>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog<Data, Props = unknown>(
  DialogComponent: (
    props: {
      close: () => void;
      confirm: (data: Data) => void;
    } & Props
  ) => ReactNode,
  extraProps: Props | undefined = undefined
) {
  const setDialogProps = useContext(DialogContext);
  const showDialog = (asModal: boolean = true) => {
    const [promise, resolve] = makePromise<Data | undefined>();
    setDialogProps({
      resolve,
      Component: DialogComponent,
      asModal,
      extraProps: extraProps || {},
    });
    return promise;
  };
  return showDialog;
}
