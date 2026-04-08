export interface FormulaParam {
    id: string;
    label: string;
    value: string;
    unit: "currency" | "percent" | "number";
    active: boolean;
    removable?: boolean;
    readonly?: boolean;
}

export interface PlanConfig {
    id: string;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon?: any;
    badge: string;
    params: FormulaParam[];
}

export const isPerSqm = (label: string) => label.toLowerCase().includes("m²");

export const calculateCompositionTotals = (items: any[], area: number, planId: string) => {
    let material = 0;
    let labor = 0;

    items.forEach(item => {
        const isInPlan = planId === 'basico' ? item.in_basico : item.in_completo;
        if (isInPlan) {
            const indice = parseFloat(item.indice_sinapi) || 0;
            const prob = parseFloat(item.probabilidade) || 0;
            const rend = parseFloat(item.rendimento) || 1;
            const ref = parseFloat(item.valor_referencia) || 0;

            const totalServico = area * indice;
            const execucaoPrevista = totalServico * (prob / 100);

            let mo = rend > 0 ? (execucaoPrevista / rend) * ref * 0.57 : 0;
            let mat = rend > 0 ? (execucaoPrevista / rend) * ref * 0.43 : 0;

            if (item.tem_valor_minimo) {
                const minV = parseFloat(item.valor_minimo) || 0;
                if ((mo + mat) < minV) {
                    mo = minV * 0.57;
                    mat = minV * 0.43;
                }
            }
            material += mat;
            labor += mo;
        }
    });

    return { material, labor };
};

export const calcPp = (params: FormulaParam[], area: number) => {
    if (!params || !Array.isArray(params)) return 0;
    let base = 0; let pct = 0;
    params.filter(p => p && p.active).forEach(p => {
        const v = parseFloat(p.value) || 0;
        if (p.unit === "currency") base += isPerSqm(p.label) ? v * area : v;
        else if (p.unit === "percent") pct += v;
    });
    return base * (1 + pct / 100);
};

export const calcPc = (pp: number, msTotal: number, coTotal: number) => {
    const d = 1 - (coTotal || 0) / 100;
    return d > 0 ? ((pp || 0) * (1 + (msTotal || 0) / 100)) / d : 0;
};

export const sumActive = (params: FormulaParam[]) => {
    if (!params || !Array.isArray(params)) return 0;
    return params.filter(p => p && p.active).reduce((s, p) => s + (parseFloat(p.value) || 0), 0);
};
