import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Eye, Globe, Twitter, Facebook } from 'lucide-react';

type SEOPage = Database['public']['Tables']['seo_pages']['Row'];
type SEOPageInsert = Database['public']['Tables']['seo_pages']['Insert'];

export function SEO() {
  const [pages, setPages] = useState<SEOPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<SEOPage | null>(null);
  const [formData, setFormData] = useState<{
    page_path: string
    page_title: string
    meta_title: string
    meta_description: string
    og_title?: string | null
    og_description?: string | null
    og_image?: string | null
    twitter_title?: string | null
    twitter_description?: string | null
    twitter_image?: string | null
    canonical_url?: string | null
  }>({
    page_path: '',
    page_title: '',
    meta_title: '',
    meta_description: '',
    og_title: '',
    og_description: '',
    og_image: '',
    twitter_title: '',
    twitter_description: '',
    twitter_image: '',
    canonical_url: ''
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_pages')
        .select('*')
        .order('page_path', { ascending: true });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching SEO pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPage) {
        const { error } = await supabase
          .from('seo_pages')
          .update(formData)
          .eq('id', editingPage.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('seo_pages')
          .insert([formData]);

        if (error) throw error;
      }

      setIsDialogOpen(false);
      setEditingPage(null);
      resetForm();
      fetchPages();
    } catch (error) {
      console.error('Error saving SEO page:', error);
    }
  };

  const handleEdit = (page: SEOPage) => {
    setEditingPage(page);
    setFormData({
      page_path: page.page_path,
      page_title: page.page_title,
      meta_title: page.meta_title,
      meta_description: page.meta_description,
      og_title: page.og_title,
      og_description: page.og_description,
      og_image: page.og_image,
      twitter_title: page.twitter_title,
      twitter_description: page.twitter_description,
      twitter_image: page.twitter_image,
      canonical_url: page.canonical_url
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      page_path: '',
      page_title: '',
      meta_title: '',
      meta_description: '',
      og_title: '',
      og_description: '',
      og_image: '',
      twitter_title: '',
      twitter_description: '',
      twitter_image: '',
      canonical_url: ''
    });
  };

  const filteredPages = pages.filter(page =>
    page.page_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.page_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.meta_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-96 bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;
  }

  return (
    <div className="p-8 space-y-6 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">SEO Content Management</h1>
          <p className="text-gray-300 mt-2 font-medium">Optimize your pages for search engines</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPage(null);
              resetForm();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Page
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPage ? 'Edit SEO Settings' : 'Add New Page'}</DialogTitle>
              <DialogDescription>
                {editingPage ? 'Update SEO metadata for this page' : 'Configure SEO settings for a new page'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="basic" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="meta">Meta Tags</TabsTrigger>
                  <TabsTrigger value="opengraph">Open Graph</TabsTrigger>
                  <TabsTrigger value="twitter">Twitter Card</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div>
                    <Label htmlFor="page_path">Page Path *</Label>
                    <Input
                      id="page_path"
                      required
                      placeholder="/about"
                      value={formData.page_path}
                      onChange={(e) => setFormData({ ...formData, page_path: e.target.value })}
                      disabled={!!editingPage}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      The URL path of the page (e.g., /about, /services)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="page_title">Page Title *</Label>
                    <Input
                      id="page_title"
                      required
                      placeholder="About Us"
                      value={formData.page_title}
                      onChange={(e) => setFormData({ ...formData, page_title: e.target.value })}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Internal reference name for this page
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="canonical_url">Canonical URL</Label>
                    <Input
                      id="canonical_url"
                      type="url"
                      placeholder="https://www.creedava.com/about"
                      value={formData.canonical_url || ''}
                      onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Preferred URL for this page (helps prevent duplicate content issues)
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="meta" className="space-y-4">
                  <div>
                    <Label htmlFor="meta_title">Meta Title *</Label>
                    <Input
                      id="meta_title"
                      required
                      placeholder="About CreedaVA - Bilingual Virtual Assistants"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {formData.meta_title?.length || 0}/60 characters - Shown in search results
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="meta_description">Meta Description *</Label>
                    <Textarea
                      id="meta_description"
                      required
                      rows={3}
                      placeholder="Professional bilingual virtual assistant services from Belize. Expert support in English & Spanish for businesses worldwide."
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {formData.meta_description?.length || 0}/160 characters - Shown in search results
                    </p>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Search Result Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <div className="text-blue-600 text-xl hover:underline cursor-pointer">
                          {formData.meta_title || 'Your Page Title'}
                        </div>
                        <div className="text-green-700 text-sm">
                          https://www.creedava.com{formData.page_path || '/page'}
                        </div>
                        <div className="text-gray-600 text-sm">
                          {formData.meta_description || 'Your meta description will appear here...'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="opengraph" className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Facebook className="w-5 h-5" />
                    <p className="text-sm text-gray-400">
                      Controls how your page appears when shared on Facebook, LinkedIn, and other platforms
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="og_title">OG Title</Label>
                    <Input
                      id="og_title"
                      placeholder="About CreedaVA - Your Bilingual VA Partner"
                      value={formData.og_title || ''}
                      onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="og_description">OG Description</Label>
                    <Textarea
                      id="og_description"
                      rows={2}
                      placeholder="Discover how CreedaVA's bilingual virtual assistants can transform your business..."
                      value={formData.og_description || ''}
                      onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="og_image">OG Image URL</Label>
                    <Input
                      id="og_image"
                      type="url"
                      placeholder="https://www.creedava.com/images/og-about.jpg"
                      value={formData.og_image || ''}
                      onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended size: 1200x630px
                    </p>
                  </div>

                  {formData.og_image && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Preview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg overflow-hidden max-w-md">
                          <img 
                            src={formData.og_image} 
                            alt="OG Preview" 
                            className="w-full h-auto"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/1200x630?text=Invalid+Image+URL';
                            }}
                          />
                          <div className="p-3 bg-gray-50">
                            <div className="font-semibold text-sm">
                              {formData.og_title || formData.meta_title || 'Title'}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {formData.og_description || formData.meta_description || 'Description'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">creedava.com</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="twitter" className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Twitter className="w-5 h-5" />
                    <p className="text-sm text-muted-foreground">
                      Controls how your page appears when shared on Twitter/X
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="twitter_title">Twitter Title</Label>
                    <Input
                      id="twitter_title"
                      placeholder="About CreedaVA - Your Bilingual VA Partner"
                      value={formData.twitter_title || ''}
                      onChange={(e) => setFormData({ ...formData, twitter_title: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="twitter_description">Twitter Description</Label>
                    <Textarea
                      id="twitter_description"
                      rows={2}
                      placeholder="Discover how CreedaVA's bilingual virtual assistants can transform your business..."
                      value={formData.twitter_description || ''}
                      onChange={(e) => setFormData({ ...formData, twitter_description: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="twitter_image">Twitter Image URL</Label>
                    <Input
                      id="twitter_image"
                      type="url"
                      placeholder="https://www.creedava.com/images/twitter-about.jpg"
                      value={formData.twitter_image || ''}
                      onChange={(e) => setFormData({ ...formData, twitter_image: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended size: 1200x675px (16:9 ratio)
                    </p>
                  </div>

                  {formData.twitter_image && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Twitter Card Preview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-xl overflow-hidden max-w-md">
                          <img 
                            src={formData.twitter_image} 
                            alt="Twitter Preview" 
                            className="w-full h-auto"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/1200x675?text=Invalid+Image+URL';
                            }}
                          />
                          <div className="p-3 border-t">
                            <div className="text-xs text-gray-500 mb-1">creedava.com</div>
                            <div className="font-semibold text-sm">
                              {formData.twitter_title || formData.meta_title || 'Title'}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {formData.twitter_description || formData.meta_description || 'Description'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPage ? 'Update Page' : 'Create Page'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white" />
          <Input
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-gray-800 border-gray-600 text-white placeholder-white"
          />
        </div>
        <div className="text-sm text-gray-400">
          {filteredPages.length} page{filteredPages.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
          <p className="text-sm font-medium text-gray-300">Total Pages</p>
          <p className="text-2xl font-bold text-white mt-2">{pages.length}</p>
        </div>
        <div className="bg-green-600 p-4 rounded-lg border border-green-500">
          <p className="text-sm font-medium text-green-100">Published</p>
          <p className="text-2xl font-bold text-white mt-2">{pages.filter(p => p.is_published).length}</p>
        </div>
        <div className="bg-blue-600 p-4 rounded-lg border border-blue-500">
          <p className="text-sm font-medium text-blue-100">Drafts</p>
          <p className="text-2xl font-bold text-white mt-2">{pages.filter(p => !p.is_published).length}</p>
        </div>
        <div className="bg-purple-600 p-4 rounded-lg border border-purple-500">
          <p className="text-sm font-medium text-purple-100">Total Views</p>
          <p className="text-2xl font-bold text-white mt-2">{pages.reduce((sum, p) => sum + (p.page_views || 0), 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-gray-700 rounded-lg border border-gray-600">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800 border-gray-600">
              <TableHead className="text-gray-200 font-medium">Page Path</TableHead>
              <TableHead className="text-gray-200 font-medium">Page Title</TableHead>
              <TableHead className="text-gray-200 font-medium">Meta Title</TableHead>
              <TableHead className="text-gray-200 font-medium">Description Length</TableHead>
              <TableHead className="text-gray-200 font-medium">Views</TableHead>
              <TableHead className="text-gray-200 font-medium">Status</TableHead>
              <TableHead className="text-right text-gray-200 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No pages found. Add your first page to manage SEO settings.
                </TableCell>
              </TableRow>
            ) : (
              filteredPages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-mono text-sm">{page.page_path}</TableCell>
                  <TableCell>{page.page_title}</TableCell>
                  <TableCell className="max-w-xs truncate">{page.meta_title}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={page.meta_description.length > 160 ? 'destructive' : 'secondary'}
                    >
                      {page.meta_description.length} chars
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      {page.page_views.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={page.is_published ? 'default' : 'secondary'}>
                      {page.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`https://www.creedava.com${page.page_path}`, '_blank')}
                      >
                        <Globe className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(page)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
