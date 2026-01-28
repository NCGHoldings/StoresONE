import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ScoreGauge } from "@/components/shared/ScoreGauge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEvaluations, SupplierEvaluation as SupplierEvaluationType, useCreateEvaluation } from "@/hooks/useEvaluations";
import { Plus, Star, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { EvaluationFormDialog } from "@/components/sourcing/EvaluationFormDialog";
import { format } from "date-fns";

export default function SupplierEvaluationPage() {
  const { data: evaluations, isLoading } = useEvaluations();
  const [showForm, setShowForm] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<SupplierEvaluationType | null>(null);

  const avgScore = evaluations?.length
    ? Math.round(evaluations.reduce((sum, e) => sum + (e.overall_score ?? 0), 0) / evaluations.length)
    : 0;

  const columns = [
    {
      key: "supplier",
      label: "Supplier",
      render: (evaluation: SupplierEvaluationType) => evaluation.suppliers?.company_name ?? "-",
      sortable: true,
    },
    {
      key: "evaluation_date",
      label: "Date",
      render: (evaluation: SupplierEvaluationType) =>
        format(new Date(evaluation.evaluation_date), "MMM dd, yyyy"),
      sortable: true,
    },
    { key: "evaluation_period", label: "Period", sortable: true },
    {
      key: "quality_score",
      label: "Quality",
      render: (evaluation: SupplierEvaluationType) => (
        <span className={evaluation.quality_score && evaluation.quality_score >= 80 ? "text-success" : evaluation.quality_score && evaluation.quality_score >= 60 ? "text-warning" : "text-destructive"}>
          {evaluation.quality_score ?? "-"}%
        </span>
      ),
    },
    {
      key: "delivery_score",
      label: "Delivery",
      render: (evaluation: SupplierEvaluationType) => (
        <span className={evaluation.delivery_score && evaluation.delivery_score >= 80 ? "text-success" : evaluation.delivery_score && evaluation.delivery_score >= 60 ? "text-warning" : "text-destructive"}>
          {evaluation.delivery_score ?? "-"}%
        </span>
      ),
    },
    {
      key: "overall_score",
      label: "Overall",
      render: (evaluation: SupplierEvaluationType) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                (evaluation.overall_score ?? 0) >= 80
                  ? "bg-success"
                  : (evaluation.overall_score ?? 0) >= 60
                  ? "bg-warning"
                  : "bg-destructive"
              }`}
              style={{ width: `${evaluation.overall_score ?? 0}%` }}
            />
          </div>
          <span className="text-sm font-medium">{evaluation.overall_score ?? 0}%</span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (evaluation: SupplierEvaluationType) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEvaluation(evaluation);
            setShowForm(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Supplier Evaluation"
        subtitle="Assess and rate supplier performance"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Evaluation
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evaluations?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Performers</CardTitle>
            <Star className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {evaluations?.filter((e) => (e.overall_score ?? 0) >= 80).length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Needs Improvement</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {evaluations?.filter((e) => (e.overall_score ?? 0) < 60).length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DataTable
          data={evaluations ?? []}
          columns={columns}
          searchable
          searchKeys={["evaluation_period", "comments"]}
          onRowClick={(evaluation) => {
            setSelectedEvaluation(evaluation);
            setShowForm(true);
          }}
        />
      )}

      <EvaluationFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        evaluation={selectedEvaluation}
        onClose={() => {
          setShowForm(false);
          setSelectedEvaluation(null);
        }}
      />
    </MainLayout>
  );
}
