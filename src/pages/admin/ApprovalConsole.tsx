import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ApprovalConsoleContent } from "@/components/accounting/shared/ApprovalConsoleContent";

export default function ApprovalConsole() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Approval Console"
          subtitle="Review and approve pending requests across all modules"
        />
        <ApprovalConsoleContent />
      </div>
    </MainLayout>
  );
}
