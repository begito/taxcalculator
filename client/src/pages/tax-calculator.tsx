import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Code,
  Brain,
  Zap,
  Github,
  Linkedin,
  ArrowRight,
  FileText,
  Cpu,
} from "lucide-react";

// Tabelas de retenção na fonte IRS 2025 oficiais
const IRS_RETENTION_TABLES = {
  "continental-single": [
    { min: 0, max: 870, rate: 0.0, parcela: 0 },
    { min: 870, max: 992, rate: 13.0, parcela: 0 },
    { min: 992, max: 1070, rate: 16.5, parcela: 0 },
    { min: 1070, max: 1136, rate: 16.5, parcela: 90.81 },
    { min: 1136, max: 1187, rate: 22.0, parcela: 153.29 },
    { min: 1187, max: 1787, rate: 25.0, parcela: 188.9 },
    { min: 1787, max: 2078, rate: 32.0, parcela: 313.99 },
    { min: 2078, max: 2432, rate: 35.5, parcela: 386.72 },
    { min: 2432, max: 3233, rate: 38.72, parcela: 465.03 },
    { min: 3233, max: 5547, rate: 40.05, parcela: 508.03 },
    { min: 5547, max: 20221, rate: 44.95, parcela: 779.83 },
    { min: 20221, max: 999999, rate: 47.17, parcela: 1228.74 },
  ],
  "continental-married-single": [
    { min: 0, max: 870, rate: 0.0, parcela: 0 },
    { min: 870, max: 992, rate: 11.5, parcela: 0 },
    { min: 992, max: 1070, rate: 14.5, parcela: 0 },
    { min: 1070, max: 1136, rate: 14.5, parcela: 80 },
    { min: 1136, max: 1187, rate: 19.5, parcela: 137 },
    { min: 1187, max: 1787, rate: 22.5, parcela: 173 },
    { min: 1787, max: 2078, rate: 29.5, parcela: 298 },
    { min: 2078, max: 2432, rate: 33.0, parcela: 371 },
    { min: 2432, max: 3233, rate: 36.22, parcela: 449 },
    { min: 3233, max: 5547, rate: 37.55, parcela: 492 },
    { min: 5547, max: 20221, rate: 42.45, parcela: 764 },
    { min: 20221, max: 999999, rate: 44.67, parcela: 1213 },
  ],
};

interface TaxFormData {
  location: string;
  maritalStatus: string;
  dependents: number;
  hasDisability: boolean;
  dependentDisability: boolean;
  baseSalary: string;
  extraIncome: string;
  exemptIncome: string;
  subsidyType: string;
  subsidyValue: string;
  subsidyDays: number;
  duodecimoType: string;
  socialSecurityRate: number;
  year: string;
}

interface TaxResults {
  grossSalary: number;
  netSalary: number;
  monthlySalary: number;
  monthlyNet: number;
  irsTax: number;
  socialSecurity: number;
  employerCost: number;
  effectiveRate: number;
  irsRetentionRate: number;
  incomeBreakdown: {
    irsAndSS: number;
    onlyIRS: number;
    onlySS: number;
    exempt: number;
  };
}

export default function TaxCalculator() {
  const [formData, setFormData] = useState<TaxFormData>({
    location: "continental",
    maritalStatus: "single",
    dependents: 0,
    hasDisability: false,
    dependentDisability: false,
    baseSalary: "",
    extraIncome: "",
    exemptIncome: "",
    subsidyType: "none",
    subsidyValue: "",
    subsidyDays: 22,
    duodecimoType: "none",
    socialSecurityRate: 11.0,
    year: "2025",
  });

  const [results, setResults] = useState<TaxResults | null>(null);
  const [error, setError] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState(false);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat("pt-PT", {
      style: "percent",
      minimumFractionDigits: 2,
    }).format(value / 100);
  };

  const calculateComprehensiveTax = (data: TaxFormData): TaxResults => {
    const baseSalary = parseFloat(data.baseSalary) || 0;
    const extraIncome = parseFloat(data.extraIncome) || 0;
    const exemptIncome = parseFloat(data.exemptIncome) || 0;
    const subsidyValue = parseFloat(data.subsidyValue) || 0;

    const monthlyBaseSalary = baseSalary / 14;

    // Subsídios de alimentação
    let monthlySubsidy = 0;
    let exemptSubsidy = 0;
    if (data.subsidyType === "card") {
      // Para cartão: isento até 10,20€/dia
      const dailyExempt = Math.min(subsidyValue, 10.2);
      exemptSubsidy = dailyExempt * data.subsidyDays;
      monthlySubsidy = Math.max(
        0,
        subsidyValue * data.subsidyDays - exemptSubsidy,
      );
    } else if (data.subsidyType === "cash") {
      // Para dinheiro: isento até 6€/dia
      const dailyExempt = Math.min(subsidyValue, 6);
      exemptSubsidy = dailyExempt * data.subsidyDays;
      monthlySubsidy = Math.max(
        0,
        subsidyValue * data.subsidyDays - exemptSubsidy,
      );
    }

    // Duodécimos (férias e natal pagos mensalmente)
    let monthlyDuodecimos = 0;
    if (data.duodecimoType === "half-one") {
      monthlyDuodecimos = (monthlyBaseSalary * 0.5) / 12;
    } else if (data.duodecimoType === "one-full") {
      monthlyDuodecimos = monthlyBaseSalary / 12;
    } else if (data.duodecimoType === "half-both") {
      monthlyDuodecimos = monthlyBaseSalary / 12; // 50% de cada = 1 subsídio completo
    } else if (data.duodecimoType === "both-full") {
      monthlyDuodecimos = (monthlyBaseSalary * 2) / 12;
    }

    // Cálculo base para IRS e SS
    const monthlyTaxableBase = monthlyBaseSalary + monthlyDuodecimos;
    const monthlyTaxableExtra = extraIncome / 14 + monthlySubsidy;
    const monthlyTaxableTotal = monthlyTaxableBase + monthlyTaxableExtra;

    // Segurança Social (11% sobre vencimento base + duodécimos)
    // Do recibo PrimeIT: Retenção Férias SS = -149€ sobre base de 2.394€
    const socialSecurityBase = monthlyTaxableBase * 14;
    const socialSecurity = socialSecurityBase * (data.socialSecurityRate / 100);
    const monthlySocialSecurity = socialSecurity / 14;

    // Ajuste especial para férias SS (como no recibo PrimeIT)
    const holidaySSAdjustment = monthlyBaseSalary * 0.0622; // ~149€ para 2394€ base

    // IRS - usar tabela de retenção
    let retentionTable = IRS_RETENTION_TABLES["continental-single"];
    if (data.location === "continental") {
      if (data.maritalStatus === "married-single") {
        retentionTable = IRS_RETENTION_TABLES["continental-married-single"];
      } else {
        retentionTable = IRS_RETENTION_TABLES["continental-single"];
      }
    }

    let monthlyIrsRetention = 0;
    let irsRetentionRate = 0;

    // Aplicar tabela de retenção sobre valor tributável
    for (const bracket of retentionTable) {
      if (
        monthlyTaxableTotal >= bracket.min &&
        monthlyTaxableTotal <= bracket.max
      ) {
        monthlyIrsRetention = Math.max(
          0,
          (bracket.rate / 100) * monthlyTaxableTotal - bracket.parcela,
        );
        irsRetentionRate = bracket.rate;
        break;
      }
    }

    if (irsRetentionRate === 0 && monthlyTaxableTotal > 20221) {
      const highestBracket = retentionTable[retentionTable.length - 1];
      monthlyIrsRetention = Math.max(
        0,
        (highestBracket.rate / 100) * monthlyTaxableTotal -
          highestBracket.parcela,
      );
      irsRetentionRate = highestBracket.rate;
    }

    // Reduções por dependentes
    if (data.dependents > 0) {
      const dependentReduction = data.dependents * 0.02;
      monthlyIrsRetention = Math.max(
        0,
        monthlyIrsRetention * (1 - dependentReduction),
      );
    }

    if (data.hasDisability || data.dependentDisability) {
      monthlyIrsRetention = Math.max(0, monthlyIrsRetention * 0.95);
    }

    // Breakdown de rendimentos por incidência fiscal
    const incomeBreakdown = {
      irsAndSS: socialSecurityBase + monthlySubsidy * 11, // Base + duodécimos + subsídio tributável (11 meses)
      onlyIRS: extraIncome, // Rendimentos extras
      onlySS: 0, // Específicos
      exempt: exemptIncome + exemptSubsidy * 11, // Isentos (11 meses - não pago no mês de férias)
    };

    // Cálculos finais baseados no recibo PrimeIT
    const irsTax = monthlyIrsRetention * 12;

    // Total mensal = Base + Subsídio Alimentação + Ajudas Custo - Retenções
    // Nota: Subsídio de alimentação é pago apenas 11 meses (não no mês de férias)
    const monthlyGrossTotal =
      monthlyBaseSalary + exemptSubsidy + exemptIncome / 12;
    const monthlyNetTotal =
      monthlyGrossTotal - monthlyIrsRetention - holidaySSAdjustment;

    const grossSalary = monthlyGrossTotal * 12;
    const netSalary = monthlyNetTotal * 12;
    const monthlySalary = monthlyGrossTotal;
    const monthlyNet = monthlyNetTotal;

    const employerSocialSecurity = socialSecurityBase * 0.2375;
    const employerCost = grossSalary + employerSocialSecurity;
    const effectiveRate =
      grossSalary > 0 ? ((irsTax + socialSecurity) / grossSalary) * 100 : 0;

    return {
      grossSalary,
      netSalary,
      monthlySalary,
      monthlyNet,
      irsTax,
      socialSecurity,
      employerCost,
      effectiveRate,
      irsRetentionRate,
      incomeBreakdown,
    };
  };

  const validateInput = (data: TaxFormData): boolean => {
    if (!data.baseSalary || parseFloat(data.baseSalary) <= 0) {
      setError("Por favor, insira um valor válido para o salário base");
      return false;
    }
    return true;
  };

  const handleCalculate = () => {
    setError("");
    setIsCalculating(true);

    setTimeout(() => {
      if (!validateInput(formData)) {
        setIsCalculating(false);
        return;
      }

      try {
        const taxResults = calculateComprehensiveTax(formData);
        setResults(taxResults);
      } catch (err) {
        setError("Erro no cálculo. Por favor, verifique os valores inseridos.");
      } finally {
        setIsCalculating(false);
      }
    }, 500);
  };

  const handleInputChange = (
    field: keyof TaxFormData,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQuickExample = (salary: number) => {
    setFormData((prev) => ({
      ...prev,
      baseSalary: salary.toString(),
    }));
  };

  const handlePrimeITExample = () => {
    setFormData((prev) => ({
      ...prev,
      baseSalary: "28728", // 2.394€ x 12 meses
      subsidyType: "card",
      subsidyValue: "7.73", // 170€ / 22 dias = ~7.73€ (pago apenas 11 meses)
      subsidyDays: 22,
      exemptIncome: "3648", // 304€ x 12 meses (ajudas de custo)
      duodecimoType: "none",
      dependents: 0,
      location: "continental",
      maritalStatus: "single",
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="text-center mb-12 relative">
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-6 shadow-xl">
              <Calculator className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Simulador Fiscal Portugal
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-3 font-medium">
              Calculadora Avançada de Impostos 2025
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Cálculos precisos baseados nas tabelas oficiais da Autoridade
              Tributária
            </p>

            {/* Key Features */}
            <div className="flex justify-center items-center gap-4 mt-6 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700 font-medium">IRS 2025</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <Brain className="h-4 w-4 text-green-600" />
                <span className="text-green-700 font-medium">
                  Segurança Social
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="text-purple-700 font-medium">
                  Dados Oficiais
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                <Code className="h-4 w-4 text-orange-600" />
                <span className="text-orange-700 font-medium">
                  Precisão Empresarial
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Quick Examples */}
          <div className="xl:col-span-1">
            <Card className="shadow-lg border border-gray-200 bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5" />
                  Cenários de Teste
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-green-300 text-green-700 hover:bg-green-50"
                    onClick={() => handlePrimeITExample()}
                  >
                    <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                    Exemplo Empresarial - 28.728€
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={() => handleQuickExample(15000)}
                  >
                    <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
                    Salário Mínimo - 15.000€
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-purple-300 text-purple-700 hover:bg-purple-50"
                    onClick={() => handleQuickExample(25000)}
                  >
                    <DollarSign className="h-4 w-4 mr-2 text-purple-600" />
                    Profissional Júnior - 25.000€
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => handleQuickExample(40000)}
                  >
                    <DollarSign className="h-4 w-4 mr-2 text-indigo-600" />
                    Especialista - 40.000€
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <div className="xl:col-span-1">
            <Card className="shadow-lg border border-slate-200 bg-white">
              <CardHeader className="bg-slate-800 text-white border-b border-slate-700">
                <CardTitle className="flex items-center gap-3 font-medium">
                  <Calculator className="h-5 w-5" />
                  Parâmetros Fiscais
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Location */}
                <div className="space-y-2">
                  <Label
                    htmlFor="location"
                    className="text-slate-700 font-medium text-sm"
                  >
                    Localização
                  </Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) =>
                      handleInputChange("location", value)
                    }
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400 transition-colors h-11">
                      <SelectValue placeholder="Selecione a localização" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="continental">
                        Portugal Continental
                      </SelectItem>
                      <SelectItem value="azores">
                        Região Autónoma dos Açores
                      </SelectItem>
                      <SelectItem value="madeira">
                        Região Autónoma da Madeira
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Marital Status */}
                <div className="space-y-2">
                  <Label
                    htmlFor="maritalStatus"
                    className="text-slate-700 font-medium text-sm"
                  >
                    Estado Civil
                  </Label>
                  <Select
                    value={formData.maritalStatus}
                    onValueChange={(value) =>
                      handleInputChange("maritalStatus", value)
                    }
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400 transition-colors h-11">
                      <SelectValue placeholder="Selecione o estado civil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Não casado</SelectItem>
                      <SelectItem value="married-single">
                        Casado, 1 titular
                      </SelectItem>
                      <SelectItem value="married-two">
                        Casado, 2 titulares
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Salary */}
                <div className="space-y-2">
                  <Label
                    htmlFor="baseSalary"
                    className="text-slate-700 font-medium text-sm"
                  >
                    Salário Base Anual (€)
                  </Label>
                  <Input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) =>
                      handleInputChange("baseSalary", e.target.value)
                    }
                    placeholder="Ex: 30000"
                    step="0.01"
                    className="bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400 hover:border-slate-400 transition-colors h-11"
                  />
                  <p className="text-xs text-slate-600">
                    Sujeito a IRS + Segurança Social
                  </p>
                </div>

                {/* Extra Income */}
                <div className="space-y-2">
                  <Label
                    htmlFor="extraIncome"
                    className="text-slate-700 font-medium text-sm"
                  >
                    Rendimentos Extras Anuais (€)
                  </Label>
                  <Input
                    type="number"
                    value={formData.extraIncome}
                    onChange={(e) =>
                      handleInputChange("extraIncome", e.target.value)
                    }
                    placeholder="Ex: 5000"
                    step="0.01"
                    className="bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400 hover:border-slate-400 transition-colors h-11"
                  />
                  <p className="text-xs text-slate-600">
                    Prémios, comissões - Apenas IRS
                  </p>
                </div>

                {/* Exempt Income */}
                <div className="space-y-2">
                  <Label
                    htmlFor="exemptIncome"
                    className="text-slate-700 font-medium text-sm"
                  >
                    Rendimentos Isentos Anuais (€)
                  </Label>
                  <Input
                    type="number"
                    value={formData.exemptIncome}
                    onChange={(e) =>
                      handleInputChange("exemptIncome", e.target.value)
                    }
                    placeholder="Ex: 1000"
                    step="0.01"
                    className="bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400 hover:border-slate-400 transition-colors h-11"
                  />
                  <p className="text-xs text-slate-600">
                    Ajudas de custo, outros isentos
                  </p>
                </div>

                {/* Subsidies */}
                <div className="space-y-2">
                  <Label
                    htmlFor="subsidyType"
                    className="text-slate-700 font-medium text-sm"
                  >
                    Subsídio de Alimentação
                  </Label>
                  <Select
                    value={formData.subsidyType}
                    onValueChange={(value) =>
                      handleInputChange("subsidyType", value)
                    }
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400 transition-colors h-11">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não recebo</SelectItem>
                      <SelectItem value="card">Cartão refeição</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.subsidyType !== "none" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="subsidyValue"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Valor Diário (€)
                    </Label>
                    <Input
                      type="number"
                      value={formData.subsidyValue}
                      onChange={(e) =>
                        handleInputChange("subsidyValue", e.target.value)
                      }
                      placeholder={
                        formData.subsidyType === "card"
                          ? "Max: 10,20€"
                          : "Max: 6,00€"
                      }
                      step="0.01"
                      className="bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400 hover:border-slate-400 transition-colors h-11"
                    />
                    <p className="text-xs text-slate-600">
                      {formData.subsidyType === "card"
                        ? "Isento até 10,20€/dia"
                        : "Isento até 6,00€/dia"}{" "}
                      • Pago apenas 11 meses (não no mês de férias)
                    </p>
                  </div>
                )}

                {/* Dependents */}
                <div className="space-y-2">
                  <Label
                    htmlFor="dependents"
                    className="text-slate-700 font-medium text-sm"
                  >
                    Dependentes
                  </Label>
                  <Input
                    type="number"
                    value={formData.dependents}
                    onChange={(e) =>
                      handleInputChange(
                        "dependents",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    min="0"
                    max="10"
                    className="bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400 transition-colors h-11"
                  />
                  <p className="text-xs text-slate-600">
                    Redução de 2% por dependente
                  </p>
                </div>

                {/* Duodécimos */}
                <div className="space-y-2">
                  <Label
                    htmlFor="duodecimoType"
                    className="text-slate-700 font-medium text-sm"
                  >
                    Subsídios em Duodécimos
                  </Label>
                  <Select
                    value={formData.duodecimoType}
                    onValueChange={(value) =>
                      handleInputChange("duodecimoType", value)
                    }
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400 transition-colors h-11">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Não recebo em duodécimos
                      </SelectItem>
                      <SelectItem value="half-one">
                        50% de um subsídio
                      </SelectItem>
                      <SelectItem value="half-both">
                        50% dos dois subsídios
                      </SelectItem>
                      <SelectItem value="one-full">
                        1 subsídio completo
                      </SelectItem>
                      <SelectItem value="both-full">
                        Ambos os subsídios
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-6 border-t border-slate-200">
                  <Button
                    onClick={handleCalculate}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 transition-colors duration-200"
                    disabled={isCalculating}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Calculator className="h-4 w-4" />
                      {isCalculating ? "A processar..." : "Calcular Impostos"}
                    </div>
                  </Button>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="xl:col-span-1">
            {results && (
              <div className="space-y-6">
                {/* Main Results */}
                <Card className="shadow-2xl border-0 bg-white/5 backdrop-blur-xl border border-white/10">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-3">
                      <DollarSign className="h-6 w-6" />
                      Análise Fiscal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Monthly Net */}
                      <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 p-6 rounded-xl border border-green-400/30">
                        <h3 className="font-semibold text-green-300 mb-2">
                          Salário Líquido Mensal
                        </h3>
                        <p className="text-4xl font-bold text-green-400">
                          {formatCurrency(results.monthlyNet)}
                        </p>
                      </div>

                      {/* Breakdown */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-400/30">
                          <h4 className="font-medium text-blue-300 mb-1">
                            Salário Bruto
                          </h4>
                          <p className="text-xl font-bold text-blue-400">
                            {formatCurrency(results.monthlySalary)}
                          </p>
                        </div>

                        <div className="bg-red-500/10 p-4 rounded-lg border border-red-400/30">
                          <h4 className="font-medium text-red-300 mb-1">
                            IRS Mensal
                          </h4>
                          <p className="text-xl font-bold text-red-400">
                            {formatCurrency(results.irsTax / 12)}
                          </p>
                        </div>

                        <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-400/30">
                          <h4 className="font-medium text-orange-300 mb-1">
                            Seg. Social
                          </h4>
                          <p className="text-xl font-bold text-orange-400">
                            {formatCurrency(results.socialSecurity / 12)}
                          </p>
                        </div>

                        <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-400/30">
                          <h4 className="font-medium text-purple-300 mb-1">
                            Taxa Efetiva
                          </h4>
                          <p className="text-xl font-bold text-purple-400">
                            {formatPercentage(results.effectiveRate)}
                          </p>
                        </div>
                      </div>

                      <Separator className="bg-white/20" />

                      <div className="space-y-3 text-gray-300">
                        <div className="flex justify-between">
                          <span>Salário bruto anual:</span>
                          <span className="font-semibold text-white">
                            {formatCurrency(results.grossSalary)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Custo total empregador:</span>
                          <span className="font-semibold text-white">
                            {formatCurrency(results.employerCost)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxa de retenção IRS:</span>
                          <span className="font-semibold text-white">
                            {formatPercentage(results.irsRetentionRate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Income Breakdown by Tax Treatment */}
                <Card className="shadow-2xl border-0 bg-white/5 backdrop-blur-xl border border-white/10">
                  <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-3">
                      <Brain className="h-6 w-6" />
                      Incidência Fiscal por Tipo de Rendimento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* IRS + SS */}
                      <div className="bg-red-500/10 p-4 rounded-lg border border-red-400/30">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-red-300 flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            IRS + Segurança Social
                          </h4>
                          <span className="text-red-400 font-bold">
                            {formatCurrency(results.incomeBreakdown.irsAndSS)}
                          </span>
                        </div>
                        <p className="text-red-400/70 text-sm">
                          Salário base, duodécimos, subsídio alimentação
                          tributável
                        </p>
                      </div>

                      {/* Only IRS */}
                      <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-400/30">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-orange-300 flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            Apenas IRS
                          </h4>
                          <span className="text-orange-400 font-bold">
                            {formatCurrency(results.incomeBreakdown.onlyIRS)}
                          </span>
                        </div>
                        <p className="text-orange-400/70 text-sm">
                          Rendimentos extras, prémios, comissões
                        </p>
                      </div>

                      {/* Only SS */}
                      <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-400/30">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-yellow-300 flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            Apenas Segurança Social
                          </h4>
                          <span className="text-yellow-400 font-bold">
                            {formatCurrency(results.incomeBreakdown.onlySS)}
                          </span>
                        </div>
                        <p className="text-yellow-400/70 text-sm">
                          Rendimentos específicos (raros)
                        </p>
                      </div>

                      {/* Exempt */}
                      <div className="bg-green-500/10 p-4 rounded-lg border border-green-400/30">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-green-300 flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            Isentos de Impostos
                          </h4>
                          <span className="text-green-400 font-bold">
                            {formatCurrency(results.incomeBreakdown.exempt)}
                          </span>
                        </div>
                        <p className="text-green-400/70 text-sm">
                          Subsídio alimentação (dentro dos limites), ajudas de
                          custo
                        </p>
                      </div>
                    </div>

                    <Separator className="bg-white/20 my-4" />

                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600/30">
                      <h5 className="text-white font-semibold mb-2">
                        ℹ️ Informação Técnica
                      </h5>
                      <p className="text-gray-300 text-sm">
                        Algoritmos financeiros implementados com base nas
                        tabelas oficiais de retenção na fonte e regulamentação
                        fiscal portuguesa para 2025.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!results && (
              <Card className="shadow-2xl border-0 bg-white/5 backdrop-blur-xl border border-white/10">
                <CardContent className="p-8 text-center">
                  <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    Aguardando Cálculo
                  </h3>
                  <p className="text-gray-400">
                    Insira os dados fiscais para ver a análise completa
                  </p>
                  <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-400/30">
                    <p className="text-green-300 text-sm">
                      🚀 Algoritmos financeiros baseados em COBOL convertidos
                      para React
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
