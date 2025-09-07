export type MetricCfg = { min:number; max:number; upBetter:boolean };

const clamp = (x:number)=> Math.max(0, Math.min(5, x));
const avg = (xs:(number|undefined|null)[])=>{
  const v = xs.filter((n): n is number => typeof n==="number" && !Number.isNaN(n));
  return v.length ? v.reduce((a,b)=>a+b,0)/v.length : undefined;
};

export function scoreMetric(val:number|undefined|null, cfg:MetricCfg){
  if (val==null || Number.isNaN(val)) return undefined;
  const raw = cfg.upBetter ? 5*(val-cfg.min)/(cfg.max-cfg.min) : 5*(cfg.max-val)/(cfg.max-cfg.min);
  return clamp(raw);
}
export function rag(score?:number, greenMin=4, yellowMin=2.5){
  if (score==null) return undefined;
  return score>=greenMin? "Verde" : score>=yellowMin? "Amarelo" : "Vermelho";
}
export function combined(subj?:number, metr?:number, wSubj=0.6, wMetr=0.4){
  if (subj==null) return metr;
  if (metr==null) return subj;
  return subj*wSubj + metr*wMetr;
}

export function computeAssessment({
  axes, metricTypes, answers, metrics, profile, cfg,
}:{
  axes:string[];
  metricTypes: Record<string, {axisName:string} & MetricCfg>;
  answers: {axisName:string; score:number; type:"base"|"segment"; segmentType?:string; segmentValue?:string}[];
  metrics: {metricName:string; value:number}[];
  profile:{ramo?:string; porte?:string};
  cfg:{greenMin:number; yellowMin:number; wSubj:number; wMetr:number; axisWeights:Record<string,number>};
}){
  // 1) Score por métrica
  const metricScoreByName: Record<string, number|undefined> = {};
  for (const m of metrics){
    const mt = metricTypes[m.metricName]; if (!mt) continue;
    metricScoreByName[m.metricName] = scoreMetric(m.value, mt);
  }
  // 2) Média métrica por eixo
  const metricScoreByAxis: Record<string, number|undefined> = {};
  for (const axis of axes){
    const s = Object.entries(metricTypes)
      .filter(([,t])=> t.axisName===axis)
      .map(([name])=> metricScoreByName[name]);
    metricScoreByAxis[axis] = avg(s);
  }
  // 3) Subjetivo por eixo
  const subjByAxis: Record<string, number|undefined> = {};
  for (const axis of axes){
    const base = answers.filter(a=> a.axisName===axis && a.type==="base").map(a=> a.score);
    const seg  = answers.filter(a=> a.axisName===axis && a.type==="segment" &&
      ((a.segmentType==="ramo"  && a.segmentValue===profile.ramo) ||
       (a.segmentType==="porte" && a.segmentValue===profile.porte))
    ).map(a=> a.score);
    subjByAxis[axis] = avg([...base, ...seg]);
  }
  // 4) Resumo + indicadores especiais
  const summaries = axes.map(axis=>{
    const subj = subjByAxis[axis];
    const metr = metricScoreByAxis[axis];
    const comb = combined(subj, metr, cfg.wSubj, cfg.wMetr);
    const color = rag(comb, cfg.greenMin, cfg.yellowMin);
    const gap = comb==null ? undefined : (5 - comb);
    const priority = gap==null ? undefined : gap * (cfg.axisWeights[axis] ?? 1);

    let comercialHealth: string|undefined;
    if (axis==="Vendas & Aquisição"){
      const l = metricScoreByName["Leads por semana"];
      const c = metricScoreByName["Conversão proposta→fechamento"];
      const r = metricScoreByName["Referidos sobre novos clientes"];
      const m = avg([l,c,r]);
      comercialHealth = m==null? undefined : (m>=3.8? "Saudável" : m>=2.5? "Atenção" : "Crítica");
    }
    let defensiveness: number|undefined;
    if (axis==="Finanças"){
      defensiveness = avg([metricScoreByName["Concentração Top-3"], metricScoreByName["Churn"]]);
    }

    return { axisName:axis, subjScore:subj, metricScore:metr, combinedScore:comb,
             rag:color, gap, priority, comercialHealth, defensiveness };
  });

  const top3Axes = summaries
    .filter(s=> s.priority!=null)
    .sort((a,b)=> (b.priority! - a.priority!))
    .slice(0,3)
    .map(s=> s.axisName);

  return { summaries, top3Axes };
}
