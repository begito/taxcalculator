import { Card, CardContent } from "@/components/ui/card";
import { Layers, Info } from "lucide-react";

export default function TaxBracketsInfo() {
  return (
    <Card className="shadow-lg animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
            <Layers className="text-white" size={16} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Escalões de IRS 2025</h2>
        </div>
        
        <div className="space-y-3">
          <div className="border-l-4 border-green-400 pl-4 py-2 bg-green-50 rounded-r-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">€0 - €8.059</span>
              <span className="text-lg font-bold text-green-600">13,0%</span>
            </div>
          </div>
          
          <div className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50 rounded-r-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">€8.059 - €12.195</span>
              <span className="text-lg font-bold text-blue-600">16,0%</span>
            </div>
          </div>
          
          <div className="border-l-4 border-indigo-400 pl-4 py-2 bg-indigo-50 rounded-r-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">€12.195 - €16.331</span>
              <span className="text-lg font-bold text-indigo-600">21,5%</span>
            </div>
          </div>
          
          <div className="border-l-4 border-purple-400 pl-4 py-2 bg-purple-50 rounded-r-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">€16.331 - €20.467</span>
              <span className="text-lg font-bold text-purple-600">24,4%</span>
            </div>
          </div>
          
          <div className="border-l-4 border-yellow-400 pl-4 py-2 bg-yellow-50 rounded-r-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">€20.467 - €26.355</span>
              <span className="text-lg font-bold text-yellow-600">31,4%</span>
            </div>
          </div>
          
          <div className="border-l-4 border-orange-400 pl-4 py-2 bg-orange-50 rounded-r-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">€26.355 - €41.915</span>
              <span className="text-lg font-bold text-orange-600">34,9%</span>
            </div>
          </div>
          
          <div className="border-l-4 border-red-400 pl-4 py-2 bg-red-50 rounded-r-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">€41.915 - €52.394</span>
              <span className="text-lg font-bold text-red-600">40,2%</span>
            </div>
          </div>
          
          <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-100 rounded-r-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">€52.394 - €83.696</span>
              <span className="text-lg font-bold text-red-700">44,7%</span>
            </div>
          </div>
          
          <div className="border-l-4 border-red-600 pl-4 py-2 bg-red-200 rounded-r-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">€83.696+</span>
              <span className="text-lg font-bold text-red-800">48,0%</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <Info className="text-[hsl(213,85%,35%)] mt-1 flex-shrink-0" size={16} />
            <div>
              <p className="text-sm text-gray-700">
                <strong>Oficial 2025:</strong> Escalões atualizados pelo Despacho 236-A/2025 (+4,6% nos limites). 
                Este calculador utiliza as tabelas oficiais de retenção na fonte para 2025.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
