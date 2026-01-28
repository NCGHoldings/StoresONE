import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Auth from "./pages/Auth";
import AccessDenied from "./pages/AccessDenied";
import Dashboard from "./pages/Dashboard";
import ProductMaster from "./pages/warehouse/ProductMaster";
import Inventory from "./pages/warehouse/Inventory";
import BatchInquiry from "./pages/warehouse/BatchInquiry";
import Storage from "./pages/warehouse/Storage";
import Inbound from "./pages/warehouse/Inbound";
import Outbound from "./pages/warehouse/Outbound";
import StockTransfers from "./pages/warehouse/StockTransfers";
import Putaway from "./pages/warehouse/Putaway";
import IssuesInquiry from "./pages/warehouse/IssuesInquiry";
import WarehouseReturns from "./pages/warehouse/Returns";
import PurchaseOrders from "./pages/procurement/PurchaseOrders";
import PurchaseRequisitions from "./pages/procurement/PurchaseRequisitions";
import RFQManagement from "./pages/procurement/RFQManagement";
import BlanketOrders from "./pages/procurement/BlanketOrders";
import ThreeWayMatch from "./pages/procurement/ThreeWayMatch";
import MaterialDemandPlanning from "./pages/procurement/MaterialDemandPlanning";
import CategoryCatalogs from "./pages/procurement/CategoryCatalogs";
import PriceLists from "./pages/procurement/PriceLists";
import GoodsReceipt from "./pages/procurement/GoodsReceipt";
import AccountsPayable from "./pages/finance/AccountsPayable";
import AccountsReceivable from "./pages/finance/AccountsReceivable";
import GeneralLedger from "./pages/finance/GeneralLedger";
import CostCenters from "./pages/finance/CostCenters";
import FinancialReports from "./pages/finance/FinancialReports";
import UserManagement from "./pages/admin/UserManagement";
import RoleManagement from "./pages/admin/RoleManagement";
import SystemConfig from "./pages/admin/SystemConfig";
import AuditLogs from "./pages/admin/AuditLogs";
import SupplierMaster from "./pages/sourcing/SupplierMaster";
import SupplierRegistration from "./pages/sourcing/SupplierRegistration";
import SupplierEvaluationPage from "./pages/sourcing/SupplierEvaluation";
import SupplierScorecardPage from "./pages/sourcing/SupplierScorecard";
import ContractRepository from "./pages/sourcing/ContractRepository";
import RiskFlags from "./pages/sourcing/RiskFlags";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ApprovalConsole from "./pages/admin/ApprovalConsole";
import ApprovalWorkflows from "./pages/admin/ApprovalWorkflows";
import Accounting from "./pages/Accounting";
import Customers from "./pages/sales/Customers";
import CustomerPOs from "./pages/sales/CustomerPOs";
import SalesOrders from "./pages/sales/SalesOrders";
import SalesReturns from "./pages/sales/SalesReturns";
import POSIntegration from "./pages/admin/POSIntegration";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/access-denied" element={<AccessDenied />} />
            
            {/* Protected Routes - Dashboard (all authenticated users) */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            {/* Profile Page - all authenticated users */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            {/* Accounting Module - requires finance module access */}
            <Route path="/accounting" element={
              <ProtectedRoute requiredModule="finance">
                <Accounting />
              </ProtectedRoute>
            } />
            
            {/* Warehouse Module */}
            <Route path="/warehouse/products" element={
              <ProtectedRoute requiredModule="warehouse">
                <ProductMaster />
              </ProtectedRoute>
            } />
            <Route path="/warehouse/inventory" element={
              <ProtectedRoute requiredModule="warehouse">
                <Inventory />
              </ProtectedRoute>
            } />
            <Route path="/warehouse/batches" element={
              <ProtectedRoute requiredModule="warehouse">
                <BatchInquiry />
              </ProtectedRoute>
            } />
            <Route path="/warehouse/storage" element={
              <ProtectedRoute requiredModule="warehouse">
                <Storage />
              </ProtectedRoute>
            } />
            <Route path="/warehouse/inbound" element={
              <ProtectedRoute requiredModule="warehouse">
                <Inbound />
              </ProtectedRoute>
            } />
            <Route path="/warehouse/putaway" element={
              <ProtectedRoute requiredModule="warehouse">
                <Putaway />
              </ProtectedRoute>
            } />
            <Route path="/warehouse/outbound" element={
              <ProtectedRoute requiredModule="warehouse">
                <Outbound />
              </ProtectedRoute>
            } />
            <Route path="/warehouse/issues" element={
              <ProtectedRoute requiredModule="warehouse">
                <IssuesInquiry />
              </ProtectedRoute>
            } />
            <Route path="/warehouse/transfers" element={
              <ProtectedRoute requiredModule="warehouse">
                <StockTransfers />
              </ProtectedRoute>
            } />
            <Route path="/warehouse/returns" element={
              <ProtectedRoute requiredModule="warehouse">
                <WarehouseReturns />
              </ProtectedRoute>
            } />
            
            {/* Procurement Module */}
            <Route path="/procurement/requisitions" element={
              <ProtectedRoute requiredModule="procurement">
                <PurchaseRequisitions />
              </ProtectedRoute>
            } />
            <Route path="/procurement/rfq" element={
              <ProtectedRoute requiredModule="procurement">
                <RFQManagement />
              </ProtectedRoute>
            } />
            <Route path="/procurement/orders" element={
              <ProtectedRoute requiredModule="procurement">
                <PurchaseOrders />
              </ProtectedRoute>
            } />
            <Route path="/procurement/blanket" element={
              <ProtectedRoute requiredModule="procurement">
                <BlanketOrders />
              </ProtectedRoute>
            } />
            <Route path="/procurement/receipt" element={
              <ProtectedRoute requiredModule="procurement">
                <GoodsReceipt />
              </ProtectedRoute>
            } />
            <Route path="/procurement/match" element={
              <ProtectedRoute requiredModule="procurement">
                <ThreeWayMatch />
              </ProtectedRoute>
            } />
            <Route path="/procurement/demand" element={
              <ProtectedRoute requiredModule="procurement">
                <MaterialDemandPlanning />
              </ProtectedRoute>
            } />
            <Route path="/procurement/catalogs" element={
              <ProtectedRoute requiredModule="procurement">
                <CategoryCatalogs />
              </ProtectedRoute>
            } />
            <Route path="/procurement/prices" element={
              <ProtectedRoute requiredModule="procurement">
                <PriceLists />
              </ProtectedRoute>
            } />
            
            {/* Sourcing Module */}
            <Route path="/sourcing/suppliers" element={
              <ProtectedRoute requiredModule="sourcing">
                <SupplierMaster />
              </ProtectedRoute>
            } />
            <Route path="/sourcing/registration" element={
              <ProtectedRoute requiredModule="sourcing">
                <SupplierRegistration />
              </ProtectedRoute>
            } />
            <Route path="/sourcing/evaluation" element={
              <ProtectedRoute requiredModule="sourcing">
                <SupplierEvaluationPage />
              </ProtectedRoute>
            } />
            <Route path="/sourcing/scorecard" element={
              <ProtectedRoute requiredModule="sourcing">
                <SupplierScorecardPage />
              </ProtectedRoute>
            } />
            <Route path="/sourcing/contracts" element={
              <ProtectedRoute requiredModule="sourcing">
                <ContractRepository />
              </ProtectedRoute>
            } />
            <Route path="/sourcing/risk" element={
              <ProtectedRoute requiredModule="sourcing">
                <RiskFlags />
              </ProtectedRoute>
            } />
            
            {/* Finance Module - Redirects to unified Accounting page */}
            <Route path="/finance/payable" element={<Navigate to="/accounting?tab=ap" replace />} />
            <Route path="/finance/receivable" element={<Navigate to="/accounting?tab=ar" replace />} />
            <Route path="/finance/ledger" element={<Navigate to="/accounting?tab=gl" replace />} />
            <Route path="/finance/cost-centers" element={<Navigate to="/accounting?tab=gl&sub=cost-centers" replace />} />
            <Route path="/finance/reports" element={<Navigate to="/accounting?tab=reports" replace />} />
            
            {/* Sales Module */}
            <Route path="/sales/customers" element={
              <ProtectedRoute requiredModule="sales">
                <Customers />
              </ProtectedRoute>
            } />
            <Route path="/sales/customer-pos" element={
              <ProtectedRoute requiredModule="sales">
                <CustomerPOs />
              </ProtectedRoute>
            } />
            <Route path="/sales/orders" element={
              <ProtectedRoute requiredModule="sales">
                <SalesOrders />
              </ProtectedRoute>
            } />
            <Route path="/sales/returns" element={
              <ProtectedRoute requiredModule="sales">
                <SalesReturns />
              </ProtectedRoute>
            } />
            
            {/* Administration Module */}
            <Route path="/admin/approvals" element={
              <ProtectedRoute requiredModule="admin">
                <ApprovalConsole />
              </ProtectedRoute>
            } />
            <Route path="/admin/workflows" element={
              <ProtectedRoute requiredModule="admin">
                <ApprovalWorkflows />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredModule="admin">
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/roles" element={
              <ProtectedRoute requiredModule="admin">
                <RoleManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/config" element={
              <ProtectedRoute requiredModule="admin">
                <SystemConfig />
              </ProtectedRoute>
            } />
            <Route path="/admin/logs" element={
              <ProtectedRoute requiredModule="admin">
                <AuditLogs />
              </ProtectedRoute>
            } />
            <Route path="/admin/pos-integration" element={
              <ProtectedRoute requiredModule="admin">
                <POSIntegration />
              </ProtectedRoute>
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
