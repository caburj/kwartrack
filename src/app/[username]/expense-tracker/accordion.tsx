import * as Accordion from "@radix-ui/react-accordion";
import { ReactNode } from "react";
import { css } from "../../../../styled-system/css";

export function AnimatedAccordionContent(props: { children: ReactNode }) {
  return (
    <Accordion.Content
      className={css({
        "&[data-state=open]": {
          animation: "slideDown 200ms ease",
        },
        "&[data-state=closed]": {
          animation: "slideUp 200ms ease",
        },
        // needed to prevent the content from being visible during the animation
        overflow: "hidden",
      })}
    >
      {props.children}
    </Accordion.Content>
  );
}
