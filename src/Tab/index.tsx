import React, { h } from "preact";

export function Tabs({
  names,
  ids,
  active,
  onChange,
}: {
  names: string[];
  ids: string[];
  active: string;
  onChange: Function;
}) {
  return (
    <div class="flex">
      {names.map((name, i) => (
        <button
          class={"px-4 py-2" + (active === ids[i] ? " bg-white" : "")}
          onClick={() => onChange(ids[i])}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

// TODO: children any

export function TabContent({
  active,
  children,
}: {
  active: boolean;
  children: any;
}) {
  if (active) return <div class="flex-1">{children}</div>;
  else return null;
}
