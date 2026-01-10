// Simple Admin Page Template
// This creates working admin pages that don't crash while we develop the full functionality

export function createSimpleAdminPage(title: string, description: string) {
  return function() {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          <p className="text-gray-400">{description}</p>
        </div>
        
        <div className="bg-gray-800 border-gray-700 rounded-lg border p-8 text-center">
          <div className="text-gray-400">
            <p className="text-lg mb-2 text-white">{title}</p>
            <p className="text-sm">This feature will be implemented soon.</p>
            <p className="text-xs text-gray-500 mt-4">Connected to CosmosDB - Ready for development</p>
          </div>
        </div>
      </div>
    );
  };
}

// Export individual page components
export const Tasks = createSimpleAdminPage("Tasks", "Task management system");
export const Projects = createSimpleAdminPage("Projects", "Project tracking and management");
export const Leads = createSimpleAdminPage("Leads", "Lead generation and management");
export const Blog = createSimpleAdminPage("Blog", "Blog content management");
export const SEO = createSimpleAdminPage("SEO Content", "SEO content and optimization");
export const Social = createSimpleAdminPage("Social Media", "Social media management");
export const Keywords = createSimpleAdminPage("Keywords", "SEO keyword tracking");
export const AdCampaigns = createSimpleAdminPage("Ad Campaigns", "Advertisement campaign management");
export const LandingPages = createSimpleAdminPage("Landing Pages", "Landing page creation and management");
export const Reports = createSimpleAdminPage("Reports", "Analytics and reporting");
export const CustomerJourney = createSimpleAdminPage("Customer Journey", "Customer journey mapping");
export const Settings = createSimpleAdminPage("Settings", "System settings and configuration");