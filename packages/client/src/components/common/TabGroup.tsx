interface TabGroupProps<T extends string> {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
  labels?: Partial<Record<T, string>>;
  counts?: Partial<Record<T, number>>;
}

export function TabGroup<T extends string>({
  tabs,
  active,
  onChange,
  labels,
  counts,
}: TabGroupProps<T>) {
  return (
    <div className="flex gap-0.5 bg-gray-900/60 p-1 rounded-xl w-fit overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-150 ${
            active === tab
              ? 'bg-gray-800 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {labels?.[tab] ?? tab}
          {counts?.[tab] !== undefined && (
            <span className={`ml-1.5 text-xs ${active === tab ? 'text-gray-400' : 'text-gray-600'}`}>
              {counts[tab]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
