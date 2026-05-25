import Breadcrumb, { BreadcrumbItem } from './Breadcrumb';

interface PageHeaderProps {
  breadcrumb: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export default function PageHeader({ breadcrumb, actions }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-bd bg-bg sticky top-0 z-10">
      <Breadcrumb items={breadcrumb} />
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
