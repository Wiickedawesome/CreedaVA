import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  title: string;
  description?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
    icon?: ReactNode;
  }>;
  stats?: Array<{
    label: string;
    value: string | number;
  }>;
  children: ReactNode;
}

export function PageLayout({
  title,
  description,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  showSearch = true,
  primaryAction,
  secondaryActions = [],
  stats = [],
  children
}: PageLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          {description && (
            <p className="text-gray-300 mt-1">{description}</p>
          )}
          {stats.length > 0 && (
            <div className="flex items-center space-x-4 mt-2">
              {stats.map((stat, index) => (
                <div key={index} className="text-sm text-gray-400">
                  <span className="font-medium text-gray-200">{stat.value}</span> {stat.label}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {secondaryActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              onClick={action.onClick}
              className={cn(
                "flex items-center",
                action.variant === 'outline' ? 
                  "border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-white" : 
                  "text-white"
              )}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
          {primaryAction && (
            <Button onClick={primaryAction.onClick} className="flex items-center">
              {primaryAction.icon && <span className="mr-2">{primaryAction.icon}</span>}
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && onSearchChange && (
        <div className="flex items-center space-x-2 max-w-md">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400"
          />
        </div>
      )}

      {/* Main Content */}
      {children}
    </div>
  );
}