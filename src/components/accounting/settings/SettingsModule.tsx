import { TabsContent } from "@/components/ui/tabs";
import { ModuleSubTabs } from "../ModuleSubTabs";
import { CompanySetup } from "./CompanySetup";
import { DocumentTemplatesTab } from "./DocumentTemplatesTab";
import { CostingBudgetTab } from "./CostingBudgetTab";
import { ApprovalWorkflowTab } from "./ApprovalWorkflowTab";
import { UserActivityTab } from "./UserActivityTab";
import { NotificationSettingsTab } from "./NotificationSettingsTab";
import { DataImportTab } from "./DataImportTab";

const subTabs = [
  { id: "companies", label: "Companies" },
  { id: "templates", label: "Document Templates" },
  { id: "costing", label: "Costing & Budget" },
  { id: "approvals", label: "Approval Workflow" },
  { id: "activity", label: "User Activity" },
  { id: "notifications", label: "Notifications" },
  { id: "import", label: "Data Import" },
];

interface SettingsModuleProps {
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
}

export default function SettingsModule({ activeSubTab, onSubTabChange }: SettingsModuleProps) {
  return (
    <ModuleSubTabs tabs={subTabs} activeTab={activeSubTab || "companies"} onTabChange={onSubTabChange}>
      <TabsContent value="companies" className="mt-4">
        <CompanySetup />
      </TabsContent>

      <TabsContent value="templates" className="mt-4">
        <DocumentTemplatesTab />
      </TabsContent>

      <TabsContent value="costing" className="mt-4">
        <CostingBudgetTab />
      </TabsContent>

      <TabsContent value="approvals" className="mt-4">
        <ApprovalWorkflowTab />
      </TabsContent>

      <TabsContent value="activity" className="mt-4">
        <UserActivityTab />
      </TabsContent>

      <TabsContent value="notifications" className="mt-4">
        <NotificationSettingsTab />
      </TabsContent>

      <TabsContent value="import" className="mt-4">
        <DataImportTab />
      </TabsContent>
    </ModuleSubTabs>
  );
}
