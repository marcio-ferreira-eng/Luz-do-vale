import { useState, useEffect, useMemo } from "react"
import { supabase } from "./lib/supabase"
import { format, isPast, parseISO, startOfWeek, endOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Plus, Pencil, Trash2, X, RefreshCw, BarChart2 } from "lucide-react"

const TABS = [
  { id: "MAN", full: "Manutenção",  cor: "#1a73e8" },
  { id: "MAR", full: "Marcenaria",  cor: "#e67c00" },
  { id: "JAR", full: "Jardim",      cor: "#188038" },
  { id: "GES", full: "Gestão",      cor: "#7b1fa2" },
]
const PRIORIDADES = ["Alta","Média","Baixa"]
const STATUSES = ["Não iniciado","Em andamento","Aguardando retorno","Aguardando orçamento","Concluído","Cancelado"]
const EMPTY = { setor:"MAN", tarefa:"", descricao:"", responsavel:"", prioridade:"Média",
                status:"Não iniciado", prazo:"", encaminhado:"", proxima_acao:"", observacoes:"" }

function statusColor(s) {
  return { "Concluído":"#16a34a","Em andamento":"#2563eb","Não iniciado":"#6b7280",
           "Aguardando retorno":"#d97706","Aguardando orçamento":"#7c3aed","Cancelado":"#dc2626" }[s] || "#6b7280"
}
function prioColor(p) { return p==="Alta"?"#dc2626":p==="Média"?"#d97706":"#16a34a" }
function isOverdue(row) {
  if (!row.prazo || row.status==="Concluído" || row.status==="Cancelado") return false
  return isPast(parseISO(row.prazo))
}

function Pill({ color, children }) {
  return (
    <span style={{ background:color+"22", color, border:`1px solid ${color}44`,
      borderRadius:999, padding:"2px 10px", fontSize:12, fontWeight:600, whiteSpace:"nowrap" }}>
      {children}
    </span>
  )
}

function Modal({ row, onSave, onClose }) {
  const [form, setForm] = useState({ ...EMPTY, ...row })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const input = { width:"100%", background:"#1e2535", border:"1px solid #2d3a52", borderRadius:8,
    padding:"8px 12px", fontSize:13, color:"#e2e8f0", outline:"none", boxSizing:"border-box" }
  const label = { display:"block", fontSize:11, color:"#94a3b8", marginBottom:4 }
  const field = { display:"flex", flexDirection:"column" }
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:50,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#131929", border:"1px solid #2d3a52", borderRadius:16, padding:32,
        width:"100%", maxWidth:640, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:"#f1f5f9", margin:0 }}>
            {row.id ? "Editar Tarefa" : "Nova Tarefa"}
          </h2>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#64748b", fontSize:22, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div style={{ ...field, gridColumn:"1 / -1" }}>
            <label style={label}>Tarefa *</label>
            <input style={input} value={form.tarefa} onChange={set("tarefa")} placeholder="Nome da tarefa" />
          </div>
          <div style={field}>
            <label style={label}>Setor</label>
            <select style={input} value={form.setor} onChange={set("setor")}>
              {TABS.map(t => <option key={t.id} value={t.id}>{t.id} – {t.full}</option>)}
            </select>
          </div>
          <div style={field}>
            <label style={label}>Responsável</label>
            <input style={input} value={form.responsavel} onChange={set("responsavel")} placeholder="Nome" />
          </div>
          <div style={field}>
            <label style={label}>Prioridade</label>
            <select style={input} value={form.prioridade} onChange={set("prioridade")}>
              {PRIORIDADES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div style={field}>
            <label style={label}>Status</label>
            <select style={input} value={form.status} onChange={set("status")}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={field}>
            <label style={label}>Prazo</label>
            <input type="date" style={input} value={form.prazo} onChange={set("prazo")} />
          </div>
          <div style={field}>
            <label style={label}>Encaminhado para</label>
            <input style={input} value={form.encaminhado} onChange={set("encaminhado")} />
          </div>
          <div style={{ ...field, gridColumn:"1 / -1" }}>
            <label style={label}>Descrição</label>
            <textarea style={{ ...input, minHeight:72, resize:"vertical" }} value={form.descricao} onChange={set("descricao")} />
          </div>
          <div style={{ ...field, gridColumn:"1 / -1" }}>
            <label style={label}>Próxima ação</label>
            <input style={input} value={form.proxima_acao} onChange={set("proxima_acao")} />
          </div>
          <div style={{ ...field, gridColumn:"1 / -1" }}>
            <label style={label}>Observações</label>
            <textarea style={{ ...input, minHeight:72, resize:"vertical" }} value={form.observacoes} onChange={set("observacoes")} />
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:12, marginTop:24 }}>
          <button onClick={onClose} style={{ background:"#1e2535", border:"1px solid #2d3a52", color:"#94a3b8",
            borderRadius:8, padding:"10px 24px", cursor:"pointer", fontSize:14 }}>Cancelar</button>
          <button onClick={() => onSave(form)} style={{ background:"linear-gradient(135deg,#3b82f6,#6366f1)",
            border:"none", color:"#fff", borderRadius:8, padding:"10px 24px",
            cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"'Syne',sans-serif" }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

function Relatorio({ rows, onClose }) {
  const [setorAberto, setSetorAberto] = useState(null)

  const concluidas = rows.filter(r => r.status === "Concluído")
  const atrasadas  = rows.filter(r => isOverdue(r))
  const pendentes  = rows.filter(r => !["Concluído","Cancelado"].includes(r.status) && !isOverdue(r))

  const semanaInicio = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "dd/MM/yyyy")
  const semanaFim    = format(endOfWeek(new Date(),   { weekStartsOn: 1 }), "dd/MM/yyyy")

  const porSetor = TABS.map(t => ({
    ...t,
    total:      rows.filter(r => r.setor === t.id).length,
    concluidas: rows.filter(r => r.setor === t.id && r.status === "Concluído").length,
    atrasadas:  rows.filter(r => r.setor === t.id && isOverdue(r)).length,
    pendentes:  rows.filter(r => r.setor === t.id && !["Concluído","Cancelado"].includes(r.status) && !isOverdue(r)).length,
  }))

  const card = (titulo, lista, cor, emoji) => (
    <div style={{ background:"#1a2540", borderRadius:12, padding:20, border:`1px solid ${cor}33` }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <span style={{ fontSize:20 }}>{emoji}</span>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:"#f1f5f9", fontSize:15 }}>{titulo}</div>
          <div style={{ fontSize:12, color:cor, fontWeight:600 }}>{lista.length} tarefa{lista.length !== 1 ? "s":""}</div>
        </div>
      </div>
      {lista.length === 0 ? (
        <div style={{ fontSize:12, color:"#3f4e68", fontStyle:"italic" }}>Nenhuma tarefa</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {lista.map(r => (
            <div key={r.id} style={{ background:"#0f1726", borderRadius:8, padding:"10px 14px", borderLeft:`3px solid ${cor}` }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0" }}>{r.tarefa}</div>
              <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap", alignItems:"center" }}>
                <span style={{ fontSize:11, color:"#64748b", background:"#1e2535", borderRadius:4, padding:"2px 8px" }}>
                  {TABS.find(t=>t.id===r.setor)?.full || r.setor}
                </span>
                {r.responsavel && <span style={{ fontSize:11, color:"#94a3b8" }}>👤 {r.responsavel}</span>}
                {r.prazo && <span style={{ fontSize:11, color: isOverdue(r)?"#ef4444":"#64748b" }}>
                  📅 {format(parseISO(r.prazo),"dd/MM/yyyy")}
                </span>}
                <Pill color={statusColor(r.status)}>{r.status}</Pill>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:50,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16, overflowY:"auto" }}>
      <div style={{ background:"#0f1726", border:"1px solid #2d3a52", borderRadius:20, padding:32,
        width:"100%", maxWidth:860, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.7)" }}>

        {/* Título */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"#f1f5f9", margin:0 }}>
              📊 Relatório Semanal
            </h2>
            <p style={{ fontSize:12, color:"#64748b", margin:"4px 0 0" }}>
              Semana de {semanaInicio} até {semanaFim}
            </p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#64748b", fontSize:24, cursor:"pointer" }}>×</button>
        </div>

        {/* Cards resumo */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
          {[
            { label:"Concluídas", value: concluidas.length, cor:"#16a34a", emoji:"✅" },
            { label:"Pendentes",  value: pendentes.length,  cor:"#d97706", emoji:"⏳" },
            { label:"Em atraso",  value: atrasadas.length,  cor:"#dc2626", emoji:"🔴" },
          ].map(c => (
            <div key={c.label} style={{ background:"#1a2540", borderRadius:12, padding:20,
              textAlign:"center", border:`1px solid ${c.cor}33` }}>
              <div style={{ fontSize:28 }}>{c.emoji}</div>
              <div style={{ fontSize:32, fontWeight:800, color:c.cor, fontFamily:"'Syne',sans-serif" }}>{c.value}</div>
              <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Por setor */}
        <div style={{ marginBottom:24 }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", color:"#94a3b8", fontSize:13,
            textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12, margin:"0 0 12px" }}>Por Setor</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
            {porSetor.map(t => (
              <div key={t.id} style={{ background:"#1a2540", borderRadius:10, padding:16,
                borderLeft:`3px solid ${t.cor}`, cursor:"pointer" }}
                onClick={() => setSetorAberto(setorAberto===t.id ? null : t.id)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:"#e2e8f0" }}>
                    {t.id} — {t.full}
                  </div>
                  <span style={{ fontSize:11, color:"#64748b" }}>{t.total} total</span>
                </div>
                <div style={{ display:"flex", gap:16, marginTop:8 }}>
                  <span style={{ fontSize:12, color:"#16a34a" }}>✅ {t.concluidas}</span>
                  <span style={{ fontSize:12, color:"#d97706" }}>⏳ {t.pendentes}</span>
                  <span style={{ fontSize:12, color:"#dc2626" }}>🔴 {t.atrasadas}</span>
                </div>
                {setorAberto === t.id && (
                  <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:6 }}>
                    {rows.filter(r=>r.setor===t.id).map(r => (
                      <div key={r.id} style={{ background:"#0f1726", borderRadius:6, padding:"8px 12px",
                        fontSize:12, color:"#94a3b8", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span>{r.tarefa}</span>
                        <Pill color={statusColor(r.status)}>{r.status}</Pill>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detalhes por categoria */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {card("Tarefas Concluídas", concluidas, "#16a34a", "✅")}
          {card("Tarefas em Atraso",  atrasadas,  "#dc2626", "🔴")}
          {card("Tarefas Pendentes",  pendentes,  "#d97706", "⏳")}
        </div>

        <div style={{ marginTop:24, textAlign:"center" }}>
          <button onClick={onClose} style={{ background:"linear-gradient(135deg,#3b82f6,#6366f1)",
            border:"none", color:"#fff", borderRadius:8, padding:"12px 40px",
            cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"'Syne',sans-serif" }}>
            Fechar Relatório
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState("MAN")
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editRow, setEditRow] = useState(null)
  const [counts, setCounts] = useState({})
  const [filterStatus, setFilterStatus] = useState("")
  const [filterPrio, setFilterPrio] = useState("")
  const [search, setSearch] = useState("")
  const [showRelatorio, setShowRelatorio] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    const { data } = await supabase.from("tarefas").select("*").order("created_at", { ascending: false })
    if (data) {
      setRows(data)
      const c = {}
      TABS.forEach(t => { c[t.id] = data.filter(r => r.setor === t.id).length })
      setCounts(c)
    }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])
  useEffect(() => {
    const ch = supabase.channel("tarefas-changes")
      .on("postgres_changes", { event:"*", schema:"public", table:"tarefas" }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const tabRows = useMemo(() => rows.filter(r => {
    if (r.setor !== activeTab) return false
    if (filterStatus && r.status !== filterStatus) return false
    if (filterPrio && r.prioridade !== filterPrio) return false
    if (search && !`${r.tarefa} ${r.descricao} ${r.responsavel}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [rows, activeTab, filterStatus, filterPrio, search])

  const handleSave = async (form) => {
    const payload = {
      setor: form.setor, tarefa: form.tarefa, descricao: form.descricao,
      responsavel: form.responsavel, prioridade: form.prioridade, status: form.status,
      prazo: form.prazo || null, encaminhado: form.encaminhado,
      proxima_acao: form.proxima_acao, observacoes: form.observacoes,
      atualizado_em: new Date().toISOString().split("T")[0]
    }
    if (form.id) {
      await supabase.from("tarefas").update(payload).eq("id", form.id)
    } else {
      await supabase.from("tarefas").insert({ ...payload, criado_em: new Date().toISOString().split("T")[0] })
    }
    setEditRow(null)
    fetchAll()
  }

  const handleDelete = async (id) => {
    if (!confirm("Remover esta tarefa?")) return
    await supabase.from("tarefas").delete().eq("id", id)
    fetchAll()
  }

  return (
    <div style={{ background:"#0c1220", minHeight:"100vh", width:"100vw", overflowX:"hidden" }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0f1e38,#131929)", borderBottom:"1px solid #1e2d45",
        padding:"20px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#3b82f6,#6366f1)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🏫</div>
          <div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20, color:"#f1f5f9", lineHeight:1, margin:0 }}>
              Comitê do Patrimônio
            </h1>
            <p style={{ fontSize:11, color:"#64748b", marginTop:4, marginBottom:0 }}>Escola Luz do Vale — Controle Geral</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={() => setShowRelatorio(true)}
            style={{ display:"flex", alignItems:"center", gap:8, background:"#1e2535",
              border:"1px solid #2d3a52", color:"#94a3b8", borderRadius:10, padding:"8px 18px",
              cursor:"pointer", fontSize:13, fontFamily:"'Syne',sans-serif", fontWeight:600 }}>
            <BarChart2 size={15}/> Relatório Semanal
          </button>
          {TABS.map(t => (
            <div key={t.id} style={{ textAlign:"center", background:"#1e2535", borderRadius:12, padding:"8px 16px" }}>
              <div style={{ fontSize:18, fontWeight:700, color:"#e2e8f0" }}>{counts[t.id] || 0}</div>
              <div style={{ fontSize:11, color:"#64748b" }}>{t.id}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:"#0e1726", borderBottom:"1px solid #1e2d45", display:"flex", paddingLeft:32 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setFilterStatus(""); setFilterPrio(""); setSearch("") }}
            style={{ borderTop: activeTab===t.id ? `2px solid ${t.cor}` : "2px solid transparent",
              borderLeft:"none", borderRight:"none",
              borderBottom: activeTab===t.id ? "1px solid #131929" : "1px solid transparent",
              background: activeTab===t.id ? "#131929" : "transparent",
              color: activeTab===t.id ? "#e2e8f0" : "#64748b",
              fontFamily:"'Syne',sans-serif", fontWeight: activeTab===t.id ? 700 : 500,
              padding:"14px 28px", cursor:"pointer", fontSize:14, position:"relative", top:1, transition:"all 0.15s" }}>
            <span style={{ fontSize:11, opacity:0.6, marginRight:6 }}>{t.id}</span>{t.full}
            {(counts[t.id] || 0) > 0 && (
              <span style={{ background:"#1e3a5f", color:"#60a5fa", borderRadius:999, padding:"1px 8px", fontSize:11, marginLeft:8 }}>
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ background:"#0f1726", borderBottom:"1px solid #1a2540",
        padding:"12px 32px", display:"flex", flexWrap:"wrap", gap:12, alignItems:"center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Buscar..."
          style={{ background:"#1e2535", border:"1px solid #2d3a52", borderRadius:8,
            color:"#e2e8f0", padding:"8px 14px", fontSize:13, outline:"none", width:220 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background:"#1e2535", border:"1px solid #2d3a52", borderRadius:8,
            color: filterStatus?"#e2e8f0":"#64748b", padding:"8px 12px", fontSize:13, outline:"none", cursor:"pointer" }}>
          <option value="">Filtrar status...</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterPrio} onChange={e => setFilterPrio(e.target.value)}
          style={{ background:"#1e2535", border:"1px solid #2d3a52", borderRadius:8,
            color: filterPrio?"#e2e8f0":"#64748b", padding:"8px 12px", fontSize:13, outline:"none", cursor:"pointer" }}>
          <option value="">Filtrar prioridade...</option>
          {PRIORIDADES.map(p => <option key={p}>{p}</option>)}
        </select>
        {(filterStatus||filterPrio||search) && (
          <button onClick={() => { setFilterStatus(""); setFilterPrio(""); setSearch("") }}
            style={{ background:"#1e2535", border:"1px solid #dc262644", color:"#dc2626",
              borderRadius:8, padding:"8px 14px", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
            <X size={12}/> Limpar
          </button>
        )}
        <button onClick={fetchAll}
          style={{ background:"#1e2535", border:"1px solid #2d3a52", color:"#64748b",
            borderRadius:8, padding:"8px 10px", cursor:"pointer", display:"flex", alignItems:"center" }}>
          <RefreshCw size={14} />
        </button>
        <button onClick={() => setEditRow({ ...EMPTY, setor: activeTab })}
          style={{ marginLeft:"auto", background:"linear-gradient(135deg,#3b82f6,#6366f1)",
            border:"none", color:"#fff", borderRadius:8, padding:"9px 22px", cursor:"pointer",
            fontSize:14, fontWeight:600, fontFamily:"'Syne',sans-serif",
            boxShadow:"0 4px 20px #3b82f640", display:"flex", alignItems:"center", gap:8 }}>
          <Plus size={16}/> Nova Tarefa
        </button>
      </div>

      {/* Table */}
      <div style={{ padding:"0 32px 64px", overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", marginTop:16, minWidth:900 }}>
          <thead>
            <tr style={{ background:"#1a2540" }}>
              {["Tarefa","Responsável","Prioridade","Status","Prazo","Encaminhado","Próxima ação","Atualizado",""].map(h => (
                <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:600,
                  color:"#64748b", letterSpacing:"0.08em", textTransform:"uppercase",
                  borderBottom:"1px solid #2d3a52", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={9} style={{ textAlign:"center", padding:64, color:"#64748b", fontSize:14 }}>Carregando...</td></tr>}
            {!loading && tabRows.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign:"center", padding:64, color:"#64748b", fontSize:14 }}>
                {rows.filter(r=>r.setor===activeTab).length===0
                  ? "Nenhuma tarefa. Clique em + Nova Tarefa para começar."
                  : "Nenhum resultado para os filtros aplicados."}
              </td></tr>
            )}
            {tabRows.map(row => {
              const overdue = isOverdue(row)
              const done = row.status==="Concluído"
              const cancelled = row.status==="Cancelado"
              return (
                <tr key={row.id} style={{ background: done?"#0d2318":overdue?"#2a1010":"transparent",
                  borderBottom:"1px solid #1e2d45", opacity:cancelled?0.5:1 }}>
                  <td style={{ padding:"12px 16px", maxWidth:220 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0" }}>{row.tarefa}</div>
                    {row.descricao && <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{row.descricao.slice(0,80)}{row.descricao.length>80?"…":""}</div>}
                    {overdue && <div style={{ fontSize:11, color:"#ef4444", fontWeight:600, marginTop:2 }}>⚠ Prazo vencido</div>}
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:13, color:"#94a3b8" }}>{row.responsavel || <span style={{color:"#3f4e68"}}>—</span>}</td>
                  <td style={{ padding:"12px 16px" }}>{row.prioridade ? <Pill color={prioColor(row.prioridade)}>{row.prioridade}</Pill> : <span style={{color:"#3f4e68"}}>—</span>}</td>
                  <td style={{ padding:"12px 16px" }}>{row.status ? <Pill color={statusColor(row.status)}>{row.status}</Pill> : <span style={{color:"#3f4e68"}}>—</span>}</td>
                  <td style={{ padding:"12px 16px", fontSize:12, whiteSpace:"nowrap", color:overdue?"#ef4444":"#94a3b8" }}>
                    {row.prazo ? format(parseISO(row.prazo),"dd/MM/yyyy") : <span style={{color:"#3f4e68"}}>—</span>}
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:12, color:"#94a3b8" }}>{row.encaminhado || <span style={{color:"#3f4e68"}}>—</span>}</td>
                  <td style={{ padding:"12px 16px", fontSize:12, color:"#94a3b8", maxWidth:180 }}>{row.proxima_acao || <span style={{color:"#3f4e68"}}>—</span>}</td>
                  <td style={{ padding:"12px 16px", fontSize:12, color:"#64748b", whiteSpace:"nowrap" }}>
                    {row.atualizado_em ? format(parseISO(row.atualizado_em),"dd/MM/yyyy") : "—"}
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => setEditRow(row)} style={{ background:"#1e3a5f", border:"none", color:"#60a5fa", borderRadius:6, padding:"6px 10px", cursor:"pointer" }}>
                        <Pencil size={13}/>
                      </button>
                      <button onClick={() => handleDelete(row.id)} style={{ background:"#3a1e1e", border:"none", color:"#f87171", borderRadius:6, padding:"6px 10px", cursor:"pointer" }}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda */}
      <div style={{ padding:"0 32px 32px", display:"flex", gap:24, fontSize:11, color:"#64748b" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:14, height:14, background:"#0d2318", border:"1px solid #16a34a44", borderRadius:3 }}/>Concluído
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:14, height:14, background:"#2a1010", border:"1px solid #dc262644", borderRadius:3 }}/>Prazo vencido
        </div>
      </div>

      {editRow && <Modal row={editRow} onSave={handleSave} onClose={() => setEditRow(null)} />}
      {showRelatorio && <Relatorio rows={rows} onClose={() => setShowRelatorio(false)} />}
    </div>
  )
}
