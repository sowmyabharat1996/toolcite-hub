"use client";
import { useMemo, useState } from "react";
import ToolTemplate from "@/components/ToolTemplate";
import { computePercent } from "@/lib/percentage/adapter";


export default function PercentagePage(){
const [mode, setMode] = useState("of");
const [base, setBase] = useState(100);
const [value, setValue] = useState(10);


const result = useMemo(()=> computePercent({ mode: mode as any, base: Number(base), value: Number(value) }), [mode, base, value]);


return (
<ToolTemplate title="Percentage Calculator" subtitle="X% of a number, increase/decrease by %">
<div style={{display:"grid", gap:12}}>
<label>Mode
<select className="input" value={mode} onChange={e=>setMode(e.target.value)}>
<option value="of">What is X% of Base?</option>
<option value="increase">Increase Base by X%</option>
<option value="decrease">Decrease Base by X%</option>
</select>
</label>
<label>Base
<input className="input" type="number" value={base} onChange={e=>setBase(Number(e.target.value))}/>
</label>
<label>X (%)
<input className="input" type="number" value={value} onChange={e=>setValue(Number(e.target.value))}/>
</label>
<button className="btn">Result: {Number.isFinite(result)? result.toFixed(2): "–"}</button>
</div>
</ToolTemplate>
);
}