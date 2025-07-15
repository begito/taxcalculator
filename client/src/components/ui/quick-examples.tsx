import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight } from "lucide-react";

interface QuickExamplesProps {
  onSelectExample: (salary: number) => void;
}

export default function QuickExamples({ onSelectExample }: QuickExamplesProps) {
  const examples = [
    { salary: 15000, label: "Salário: €15.000" },
    { salary: 25000, label: "Salário: €25.000" },
    { salary: 35000, label: "Salário: €35.000" }
  ];

  return (
    <Card className="shadow-lg animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Lightbulb className="text-white" size={16} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Exemplos Rápidos</h2>
        </div>
        
        <div className="space-y-3">
          {examples.map((example, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              onClick={() => onSelectExample(example.salary)}
            >
              <span className="text-sm font-medium text-gray-700">{example.label}</span>
              <ArrowRight className="text-gray-400" size={16} />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
