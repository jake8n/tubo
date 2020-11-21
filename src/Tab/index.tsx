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
        <button class="bg-white px-4 py-2" onClick={() => onChange(ids[i])}>
          {name}
        </button>
      ))}
    </div>
  );
}

export function TabContent({
  active,
  children,
}: {
  active: boolean;
  children: any;
}) {
  if (active) return <div>{children}</div>;
  else return null;
}
