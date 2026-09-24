import * as React from "react"
import { cn } from "cn"

/**
 * Renders a card container with configurable size and styling.
 * @param className - Additional CSS classes applied to the card.
 * @param size - The size variant of the card.
 * @param props - Additional properties passed to the card element.
 * @returns The rendered card component.
 */
function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-none bg-card py-(--card-spacing) text-sm/relaxed text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(5)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-none *:[img:last-child]:rounded-none",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the header section of a card.
 * @param className - Additional CSS classes applied to the card header.
 * @param props - Additional properties passed to the card header element.
 * @returns The rendered card header component.
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-none px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the title section of a card.
 * @param className - Additional CSS classes applied to the card title.
 * @param props - Additional properties passed to the card title element.
 * @returns The rendered card title component.
 */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base font-semibold group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the description section of a card.
 * @param className - Additional CSS classes applied to the card description.
 * @param props - Additional properties passed to the card description element.
 * @returns The rendered card description component.
 */
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm/relaxed text-muted-foreground", className)}
      {...props}
    />
  )
}

/**
 * Renders the action section of a card.
 * @param className - Additional CSS classes applied to the card action.
 * @param props - Additional properties passed to the card action element.
 * @returns The rendered card action component.
 */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the content section of a card.
 * @param className - Additional CSS classes applied to the card content.
 * @param props - Additional properties passed to the card content element.
 * @returns The rendered card content component.
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

/**
 * Renders the footer section of a card.
 * @param className - Additional CSS classes applied to the card footer.
 * @param props - Additional properties passed to the card footer element.
 * @returns The rendered card footer component.
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-none border-t p-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
