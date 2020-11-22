import React, { h } from "preact";

export default function NavButton({
  onClick,
  active,
  children,
  text,
}: {
  onClick?: any;
  active?: boolean;
  children: any;
  text: string;
}) {
  return (
    <button
      onClick={onClick}
      class={
        "flex flex-col items-center py-2 px-4 text-sm " +
        (active ? "text-green-300 pointer-events-none" : "text-white")
      }
    >
      {children}
      <span class="mt-1">{text}</span>
    </button>
  );
}
