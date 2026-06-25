"use client";

interface CollectionFilterProps {
  filters: string[];
  active: string;
  onChange: (filter: string) => void;
}

export default function CollectionFilter({
  filters,
  active,
  onChange,
}: CollectionFilterProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={`text-xs font-bold tracking-widest uppercase px-5 py-2 border transition-all duration-300 ${
            active === filter
              ? "border-[#C8C8D0] text-[#C8C8D0] bg-[rgba(200,200,210,0.1)]"
              : "border-[rgba(200,200,210,0.14)] text-[#6B6B78] hover:border-[rgba(200,200,210,0.3)] hover:text-[#E8E8F0]"
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}