import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { computeAssessment } from "@/lib/compute";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  const { data: a, error: e1 } = await supabaseServer
    .from("assessment").select("*").eq("id", id).single();
  if (e1 || !a) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

  const [{ data: ans }, { data: mets }] = await Promise.all([
    supabaseServer.from("answer").select("*").eq("assessment_id", id),
    supabaseServer.from("metric_value").select("*").eq("assessment_id", id)
  ]);

  const { data: cfg } = await supabaseServer.from("config").select("*").eq("id","default").single();
  const { data: axesRows } = await supabaseServer.from("axis").select("name,weight");
  const axes = (axesRows||[]).map((r:any)=>r.name);
  const axisWeights = Object.fromEntries((axesRows||[]).map((r:any)=>[r.name, Number(r.weight||1)]));

  const { data: mtArr } = await supabaseServer.from("metric_type").select("*");
  const metricTypes = Object.fromEntries((mtArr||[]).map((m:any)=>[
    m.name, { axisName:m.axis_name, min:Number(m.min), max:Number(m.max), upBetter:!!m.up_better }
  ]));

  const answers = (ans||[]).map((x:any)=>({
    axisName:x.axis_name, score:Number(x.score), type:x.type,
    segmentType:x.segment_type, segmentValue:x.segment_value
  }));
  const metrics = (mets||[]).map((m:any)=>({ metricName:m.metric_name, value:Number(m.value) }));

  const { summaries, top3Axes } = computeAssessment({
    axes, metricTypes, answers, metrics,
    profile: { ramo: a.ramo||undefined, porte: a.porte||undefined },
    cfg: { greenMin:Number(cfg.green_min), yellowMin:Number(cfg.yellow_min),
           wSubj:Number(cfg.w_subj), wMetr:Number(cfg.w_metr), axisWeights }
  });

  await supabaseServer.from("summary").delete().eq("assessment_id", id);
  await supabaseServer.from("summary").insert(summaries.map((s:any)=>({ assessment_id:id, ...s })));

  await supabaseServer.from("plan_item").delete().eq("assessment_id", id);
  for (const axisName of top3Axes) {
    const rag = summaries.find((s:any)=>s.axisName===axisName)!.rag!;
    const { data: ax } = await supabaseServer.from("axis").select("id").eq("name", axisName).single();
    const { data: pb } = await supabaseServer.from("playbook_task").select("*").eq("axis_id", ax!.id).eq("rag", rag).single();
    if (pb) {
      await supabaseServer.from("plan_item").insert({
        assessment_id:id, axis_name:axisName, rag,
        tasks:`• ${pb.t1}\n• ${pb.t2}\n• ${pb.t3}`, kpis: pb.kpi
      });
    }
  }
  return NextResponse.json({ ok:true });
}
