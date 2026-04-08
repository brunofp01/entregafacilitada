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
