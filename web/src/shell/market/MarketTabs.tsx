/*
 * MK.tabs and MK.segment.
 *
 *   useTabs(first)                  { active, hasOpened(tab), open(tab) }; a panel
 *                                   mounts the first time its tab is opened and
 *                                   then stays, hidden, as the old pages kept it
 *   <MarketTabs id tabs active onChange>
 *   <TabPanel name tabs>            one panel, driven by the useTabs value
 *   <Segment id options value onChange>
 */
import { useCallback, useState } from "react";
import type { ReactNode } from "react";

export type TabsState<T extends string> = { active: T; hasOpened: (tab: T) => boolean; open: (tab: T) => void };

export function useTabs<T extends string>(first: T): TabsState<T> {
  const [active, setActive] = useState<T>(first);
  const [opened, setOpened] = useState<ReadonlySet<T>>(() => new Set([first]));
  const open = useCallback((tab: T) => {
    setActive(tab);
    setOpened(previous => (previous.has(tab) ? previous : new Set([...previous, tab])));
  }, []);
  return { active, hasOpened: tab => opened.has(tab), open };
}

type Option<T extends string> = { value: T; label: string };

type MarketTabsProps<T extends string> = {
  id: string;
  tabs: readonly Option<T>[];
  active: T;
  onChange: (tab: T) => void;
};

export function MarketTabs<T extends string>({ id, tabs, active, onChange }: MarketTabsProps<T>) {
  return (
    <div className="mk-tabs" id={id} role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.value}
          className={tab.value === active ? "mk-tab is-on" : "mk-tab"}
          type="button"
          role="tab"
          aria-selected={tab.value === active}
          data-tab={tab.value}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

type TabPanelProps<T extends string> = { name: T; tabs: TabsState<T>; children: ReactNode };

export function TabPanel<T extends string>({ name, tabs, children }: TabPanelProps<T>) {
  return (
    <div data-panel={name} hidden={tabs.active !== name}>
      {tabs.hasOpened(name) && children}
    </div>
  );
}

type SegmentProps = {
  id: string;
  options: readonly Option<string>[];
  value: string;
  onChange: (value: string) => void;
};

export function Segment({ id, options, value, onChange }: SegmentProps) {
  return (
    <div className="mk-seg" id={id}>
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          data-value={option.value}
          className={option.value === value ? "is-on" : undefined}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
