interface PagePlaceholderProps {
  title: string;
  description: string;
  section?: string;
}

/** Reusable placeholder for pages under construction */
export function PagePlaceholder({ title, description, section }: PagePlaceholderProps) {
  return (
    <div>
      <h1 className="page-title">{title}</h1>
      {section && (
        <div className="mb-4">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {section}
          </span>
        </div>
      )}
      <div className="card text-center py-16">
        <p className="text-lg text-gray-400">{description}</p>
        <p className="text-sm text-gray-600 mt-2">This page is part of the scaffold.</p>
      </div>
    </div>
  );
}
