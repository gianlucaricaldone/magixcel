import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, Filter, Download, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-slate-900 mb-6">
            Magi<span className="text-blue-600">Xcel</span>
          </h1>
          <p className="text-2xl text-slate-600 max-w-3xl mx-auto mb-8">
            Transform your Excel and CSV files into actionable insights with powerful filtering and analysis
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/app">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-blue-200 transition-colors">
            <CardHeader>
              <FileSpreadsheet className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Multiple Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Support for Excel (.xlsx, .xls) and CSV files up to 1GB
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-200 transition-colors">
            <CardHeader>
              <Filter className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Smart Filtering</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Apply complex filters without writing a single line of code
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-200 transition-colors">
            <CardHeader>
              <Zap className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Optimized performance for large datasets with instant results
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-200 transition-colors">
            <CardHeader>
              <Download className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Easy Export</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Export filtered results to CSV, Excel, or JSON formats
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="max-w-2xl mx-auto bg-blue-600 text-white border-0">
            <CardHeader>
              <CardTitle className="text-3xl text-white">Ready to get started?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-100 mb-6">
                Upload your first file and experience the power of smart data analysis
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/app">Start Analyzing</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-slate-500">
          <p>Your data is processed securely and never leaves your session</p>
        </div>
      </div>
    </div>
  );
}
