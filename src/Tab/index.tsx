import React, { h } from "preact";

export function Tabs({
  paths,
  active,
  onChange,
  onNew,
}: {
  paths: string[];
  active: string;
  onChange: Function;
  onNew: Function;
}) {
  const sortedPaths = [...paths].sort();
  // TODO: delete tab
  return (
    <div class="flex overflow-auto">
      {sortedPaths.map((path) => (
        <button
          class={
            "px-4 py-2 text-sm whitespace-nowrap" +
            (active === path ? " bg-white" : "")
          }
          onClick={() => onChange(path)}
        >
          {path}
        </button>
      ))}
      <button onClick={() => onNew()} class="px-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </button>
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
