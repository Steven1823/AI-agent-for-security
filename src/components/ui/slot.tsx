import * as React from "react";

type AnyProps = Record<string, unknown>;

/**
 * Minimal Slot implementation (subset of @radix-ui/react-slot) so we can
 * support `asChild` on Button without adding a dependency.
 */
export const Slot = React.forwardRef<HTMLElement, { children?: React.ReactNode }>(
  ({ children, ...props }, ref) => {
    if (React.isValidElement(children)) {
      const child = children as React.ReactElement;
      return React.cloneElement(child, {
        ...props,
        ...(child.props as AnyProps),
        ref,
      } as AnyProps);
    }
    return null;
  },
);
Slot.displayName = "Slot";
