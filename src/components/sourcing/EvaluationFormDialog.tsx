import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SupplierEvaluation, useCreateEvaluation } from "@/hooks/useEvaluations";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { ScoreGauge } from "@/components/shared/ScoreGauge";

interface EvaluationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: SupplierEvaluation | null;
  onClose: () => void;
}

interface FormData {
  supplier_id: string;
  evaluation_date: string;
  evaluation_period: string;
  quality_score: number;
  delivery_score: number;
  price_score: number;
  service_score: number;
  comments: string;
  recommendations: string;
}

const periods = ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Annual 2024"];

export function EvaluationFormDialog({ open, onOpenChange, evaluation, onClose }: EvaluationFormDialogProps) {
  const { data: suppliers } = useSuppliers();
  const createEvaluation = useCreateEvaluation();
  const isEditing = !!evaluation;

  const [scores, setScores] = useState({
    quality: 70,
    delivery: 70,
    price: 70,
    service: 70,
  });

  const overallScore = Math.round(
    (scores.quality + scores.delivery + scores.price + scores.service) / 4
  );

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      supplier_id: "",
      evaluation_date: new Date().toISOString().split("T")[0],
      evaluation_period: "",
      quality_score: 70,
      delivery_score: 70,
      price_score: 70,
      service_score: 70,
      comments: "",
      recommendations: "",
    },
  });

  useEffect(() => {
    if (evaluation) {
      reset({
        supplier_id: evaluation.supplier_id,
        evaluation_date: evaluation.evaluation_date,
        evaluation_period: evaluation.evaluation_period ?? "",
        quality_score: evaluation.quality_score ?? 70,
        delivery_score: evaluation.delivery_score ?? 70,
        price_score: evaluation.price_score ?? 70,
        service_score: evaluation.service_score ?? 70,
        comments: evaluation.comments ?? "",
        recommendations: evaluation.recommendations ?? "",
      });
      setScores({
        quality: evaluation.quality_score ?? 70,
        delivery: evaluation.delivery_score ?? 70,
        price: evaluation.price_score ?? 70,
        service: evaluation.service_score ?? 70,
      });
    } else {
      reset({
        supplier_id: "",
        evaluation_date: new Date().toISOString().split("T")[0],
        evaluation_period: "",
        quality_score: 70,
        delivery_score: 70,
        price_score: 70,
        service_score: 70,
        comments: "",
        recommendations: "",
      });
      setScores({ quality: 70, delivery: 70, price: 70, service: 70 });
    }
  }, [evaluation, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await createEvaluation.mutateAsync({
        supplier_id: data.supplier_id,
        evaluation_date: data.evaluation_date,
        evaluation_period: data.evaluation_period,
        quality_score: scores.quality,
        delivery_score: scores.delivery,
        price_score: scores.price,
        service_score: scores.service,
        overall_score: overallScore,
        comments: data.comments,
        recommendations: data.recommendations,
        evaluator_id: null,
        strengths: null,
        weaknesses: null,
      });
      onClose();
    } catch (error) {
      console.error("Error saving evaluation:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "View Evaluation" : "New Supplier Evaluation"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select
                value={watch("supplier_id")}
                onValueChange={(value) => setValue("supplier_id", value)}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.filter(s => s.status === "active").map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Evaluation Period</Label>
              <Select
                value={watch("evaluation_period")}
                onValueChange={(value) => setValue("evaluation_period", value)}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Score Gauges */}
          <div className="flex justify-center py-4">
            <ScoreGauge score={overallScore} label="Overall Score" size="lg" />
          </div>

          {/* Score Sliders */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Performance Scores
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Quality Score</Label>
                  <span className="text-sm font-medium">{scores.quality}%</span>
                </div>
                <Slider
                  value={[scores.quality]}
                  onValueChange={([value]) => setScores((prev) => ({ ...prev, quality: value }))}
                  max={100}
                  step={1}
                  disabled={isEditing}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Delivery Score</Label>
                  <span className="text-sm font-medium">{scores.delivery}%</span>
                </div>
                <Slider
                  value={[scores.delivery]}
                  onValueChange={([value]) => setScores((prev) => ({ ...prev, delivery: value }))}
                  max={100}
                  step={1}
                  disabled={isEditing}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Price Score</Label>
                  <span className="text-sm font-medium">{scores.price}%</span>
                </div>
                <Slider
                  value={[scores.price]}
                  onValueChange={([value]) => setScores((prev) => ({ ...prev, price: value }))}
                  max={100}
                  step={1}
                  disabled={isEditing}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Service Score</Label>
                  <span className="text-sm font-medium">{scores.service}%</span>
                </div>
                <Slider
                  value={[scores.service]}
                  onValueChange={([value]) => setScores((prev) => ({ ...prev, service: value }))}
                  max={100}
                  step={1}
                  disabled={isEditing}
                />
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                {...register("comments")}
                rows={3}
                disabled={isEditing}
                placeholder="General comments about supplier performance..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommendations">Recommendations</Label>
              <Textarea
                id="recommendations"
                {...register("recommendations")}
                rows={3}
                disabled={isEditing}
                placeholder="Recommendations for improvement..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              {isEditing ? "Close" : "Cancel"}
            </Button>
            {!isEditing && (
              <Button type="submit" disabled={createEvaluation.isPending}>
                Submit Evaluation
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
