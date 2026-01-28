import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { POSTestForm } from "@/components/admin/POSTestForm";
import { POSApiDocumentation } from "@/components/admin/POSApiDocumentation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, FileCode } from "lucide-react";

export default function POSIntegration() {
  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <PageHeader
          title="POS Integration"
          subtitle="Test POS sales integration and view API documentation"
        />

        <Tabs defaultValue="test" className="space-y-4">
          <TabsList>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Test Console
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              API Documentation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test">
            <POSTestForm />
          </TabsContent>

          <TabsContent value="docs">
            <POSApiDocumentation />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
