import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/admin/PageLayout';
import { SEODialog, SEOContent } from '@/components/admin/SEODialog';
import { API_BASE, authorizedFetch } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorPanel } from '@/components/ErrorPanel'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  TrendingUp, 
  Globe, 
  BarChart3,
  FileText,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type SEOFormData = {
  title: string;
  metaDescription: string;
  content: string;
  url: string;
  status: string;
  contentType: string;
  targetKeywords: string;
  focusKeyword?: string;
  wordCount: number;
  publishedDate?: Date;
  tags?: string;
  category?: string;
  canonicalUrl?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
};

const seoStatuses = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-500', textColor: 'text-gray-400' },
  { value: 'review', label: 'In Review', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  { value: 'optimized', label: 'Optimized', color: 'bg-green-500', textColor: 'text-green-400' },
  { value: 'published', label: 'Published', color: 'bg-blue-500', textColor: 'text-blue-400' },
  { value: 'needs-work', label: 'Needs Work', color: 'bg-red-500', textColor: 'text-red-400' },
];

const contentTypes = [
  { value: 'page', label: 'Web Page' },
  { value: 'blog-post', label: 'Blog Post' },
  { value: 'product', label: 'Product Page' },
  { value: 'category', label: 'Category Page' },
  { value: 'landing', label: 'Landing Page' },
  { value: 'service', label: 'Service Page' },
];

export function SEO() {
  const [seoContent, setSEOContent] = useState<SEOContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const { signIn } = useAuth()
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSEO, setSelectedSEO] = useState<SEOContent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [seoToDelete, setSEOToDelete] = useState<SEOContent | null>(null);

  useEffect(() => {
    fetchSEOContent();
  }, []);

  const fetchSEOContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authorizedFetch(`${API_BASE}/getSeo`);
      
      if (response.ok) {
        const result = await response.json();
        setSEOContent(result.data || []);
      } else {
        throw new Error('Failed to fetch SEO content');
      }
    } catch (error: any) {
      console.error('Error fetching SEO content:', error);
      setError(error instanceof Error ? error.message : 'Failed to load SEO content. Please try again.');
      setErrorStatus(error?.status || null)
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSEO = () => {
    setSelectedSEO(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEditSEO = (seo: SEOContent) => {
    setSelectedSEO(seo);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleViewSEO = (seo: SEOContent) => {
    setSelectedSEO(seo);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleSaveSEO = async (seoData: Omit<SEOContent, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (dialogMode === 'create') {
        const response = await authorizedFetch(`${API_BASE}/createSeo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(seoData)
        });
        
        if (response.ok) {
          await fetchSEOContent();
        } else {
          throw new Error('Failed to create SEO content');
        }
      } else if (dialogMode === 'edit' && selectedSEO) {
        const response = await authorizedFetch(`${API_BASE}/updateSeo/${selectedSEO.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(seoData)
        });
        
        if (response.ok) {
          await fetchSEOContent();
        } else {
          throw new Error('Failed to update SEO content');
        }
      }
    } catch (error) {
      console.error('Error saving SEO content:', error);
      setError('Failed to save SEO content. Please try again.');
    }
  };

  const handleDeleteSEO = async () => {
    if (!seoToDelete) return;
    
    try {
      const response = await authorizedFetch(`${API_BASE}/deleteSeo/${seoToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchSEOContent();
        setDeleteDialogOpen(false);
        setSEOToDelete(null);
      } else {
        throw new Error('Failed to delete SEO content');
      }
    } catch (error) {
      console.error('Error deleting SEO content:', error);
      setError('Failed to delete SEO content. Please try again.');
    }
  };

  const filteredSEO = seoContent.filter(seo =>
    seo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seo.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seo.targetKeywords.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = seoStatuses.find(s => s.value === status);
    if (!statusConfig) return null;
    
    return (
      <Badge className={cn("px-2 py-1 text-xs font-medium rounded-full", statusConfig.color)}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getSEOScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <>
      <PageLayout
        title="SEO Content"
        description="Manage SEO optimization for pages and content"
        searchPlaceholder="Search content..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        primaryAction={{
          label: 'Create Content',
          onClick: handleCreateSEO,
          icon: <Plus className="h-4 w-4" />
        }}
        secondaryActions={[
          {
            label: 'Refresh',
            onClick: fetchSEOContent,
            icon: <RefreshCw className="h-4 w-4" />
          }
        ]}
      >
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Loading SEO content...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Search className="h-8 w-8 text-red-400 mx-auto mb-4" />
            <ErrorPanel message={error} onRetry={fetchSEOContent} onSignIn={errorStatus === 401 ? async () => { await signIn(); fetchSEOContent() } : undefined} />
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Content</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">SEO Score</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Keywords</TableHead>
                  <TableHead className="text-gray-300">Performance</TableHead>
                  <TableHead className="text-gray-300">Modified</TableHead>
                  <TableHead className="text-gray-300 w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSEO.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg mb-2">No SEO content found</p>
                      <p className="text-gray-500 mb-4">
                        {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating your first SEO content'}
                      </p>
                      {!searchTerm && (
                        <Button onClick={handleCreateSEO} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Content
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSEO.map((seo) => {
                    return (
                      <TableRow key={seo.id} className="border-gray-700 hover:bg-gray-750">
                        <TableCell>
                          <div>
                            <div className="font-medium text-white">{seo.title}</div>
                            <div className="text-sm text-blue-400">{seo.url}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(seo.status)}
                        </TableCell>
                        <TableCell>
                          <div className={cn("flex items-center space-x-2", getSEOScoreColor(seo.seoScore))}>
                            <BarChart3 className="h-4 w-4" />
                            <span className="font-medium">{seo.seoScore || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-300">
                            {contentTypes.find(t => t.value === seo.contentType)?.label || seo.contentType}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-32">
                            {seo.focusKeyword ? (
                              <Badge variant="outline" className="text-blue-400 border-blue-500">
                                {seo.focusKeyword}
                              </Badge>
                            ) : (
                              <span className="text-gray-500 text-sm">No focus keyword</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {seo.pageViews ? (
                              <div className="text-green-400">{seo.pageViews.toLocaleString()} views</div>
                            ) : (
                              <div className="text-gray-500">No data</div>
                            )}
                            {seo.averagePosition && (
                              <div className="text-blue-400">Pos #{seo.averagePosition}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-300 text-sm">
                            {format(new Date(seo.lastModified), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-600">
                              <DropdownMenuItem onClick={() => handleViewSEO(seo)} className="text-gray-300 hover:bg-gray-700">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditSEO(seo)} className="text-gray-300 hover:bg-gray-700">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Content
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => window.open(seo.url.startsWith('http') ? seo.url : `https://creedava.com${seo.url}`, '_blank')}
                                className="text-blue-400 hover:bg-blue-900/20"
                              >
                                <Globe className="h-4 w-4 mr-2" />
                                View Live
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSEOToDelete(seo);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-400 hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </PageLayout>

      {/* SEO Dialog */}
      <SEODialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        seo={selectedSEO}
        onSave={handleSaveSEO}
        mode={dialogMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete SEO Content</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{seoToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSEO}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Content
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}