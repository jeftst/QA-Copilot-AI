import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ClipboardCopy,
  FileDown,
  ShieldCheck,
  Bug,
  TestTube2,
  AlertTriangle,
  Loader2
} from "lucide-react";

const EXAMPLES = [
  {
    label: "Login com MFA",
    text: "Como usuário, desejo realizar login com e-mail e senha. Se minhas credenciais estiverem corretas, devo receber um código de verificação por e-mail para concluir o acesso. Após 5 tentativas inválidas, a conta deve ser bloqueada por 15 minutos."
  },
  {
    label: "Cadastro de cliente",
    text: "O sistema deve permitir cadastrar clientes com nome, CPF, e-mail e telefone. O CPF deve ser único. Campos obrigatórios não podem ficar em branco. Após cadastro com sucesso, o sistema deve exibir mensagem de confirmação."
  },
  {
    label: "Checkout com cartão",
    text: "Durante o checkout, o usuário pode pagar com cartão de crédito. O pagamento só deve ser aprovado para cartões válidos e dentro do limite. Em caso de falha na operadora, o pedido deve permanecer pendente e o usuário deve ser informado."
  }
];

function SectionCard({ title, icon: Icon, content }) {
  return (
    <div className="result-card">
      <h3>
        <Icon size={18} color="#67e8f9" />
        {title}
      </h3>
      <pre className="result-content">{content || "Sem conteúdo."}</pre>
    </div>
  );
}

export default function App() {
  const [requirement, setRequirement] = useState(EXAMPLES[0].text);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const promptPreview = useMemo(() => {
    return `Você é um especialista sênior em QA. A partir do requisito informado, gere:
1. resumo funcional
2. casos de teste
3. BDD em PT-BR
4. cenários negativos
5. bugs/riscos prováveis
6. CSV em Action,Data,Expected Result`;
  }, []);

  async function handleGenerate() {
    if (!requirement.trim()) {
      setError("Cole um requisito antes de gerar.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ requirement })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Falha ao gerar resposta da IA.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copiado com sucesso.`);
    } catch {
      alert("Não foi possível copiar o conteúdo.");
    }
  }

  function exportCsv() {
    if (!result?.csv) return;

    const blob = new Blob([result.csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "qa-copilot-casos-de-teste.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-shell bg-points">
      <div className="container">
        <div className="hero-grid">
          <motion.section
            className="panel panel-main"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="badge">
              <Sparkles size={14} />
              QA Copilot AI
            </div>

            <h1 className="title">
              Gere testes com <span className="gradient-text">IA real</span>
            </h1>

            <p className="subtitle">
              Cole um requisito funcional e receba casos de teste, BDD,
              cenários negativos, riscos e CSV pronto para uso em ferramentas
              de QA.
            </p>

            <div className="examples-grid">
              {EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  className="example-card"
                  onClick={() => setRequirement(example.text)}
                >
                  <div className="example-title">{example.label}</div>
                  <div className="example-text">{example.text}</div>
                </button>
              ))}
            </div>

            <div className="input-panel">
              <label className="label">Requisito de entrada</label>

              <textarea
                className="textarea"
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="Cole aqui a história de usuário, regra de negócio ou requisito funcional..."
              />

              <div className="actions">
                <button
                  className="btn-primary"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 size={16} className="loading-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {loading ? "Gerando..." : "Gerar testes com IA"}
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => setRequirement("")}
                >
                  Limpar
                </button>
              </div>

              {error && <div className="error-box">{error}</div>}

              <div className="footer-note">
                Dica para a apresentação: use um dos exemplos prontos e depois
                teste um requisito novo ao vivo.
              </div>
            </div>
          </motion.section>

          <motion.aside
            className="panel panel-side"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <div className="small-card">
              <h2 className="side-title">Destaques do MVP</h2>
              <ul className="list">
                <li>IA generativa integrada por API real</li>
                <li>Casos de teste e BDD em PT-BR</li>
                <li>Cenários negativos e riscos</li>
                <li>Botão para copiar BDD</li>
                <li>Exportação CSV</li>
                <li>Pronto para deploy no Vercel</li>
              </ul>
            </div>

            <div className="small-card">
              <h2 className="side-title">Prompt de sistema</h2>
              <div className="prompt-preview">{promptPreview}</div>
            </div>
          </motion.aside>
        </div>

        {result && (
          <>
            <div className="result-toolbar">
              <button
                className="btn-secondary"
                onClick={() => copyText(result.bdd || "", "BDD")}
              >
                <ClipboardCopy size={16} />
                Copiar BDD
              </button>

              <button className="btn-secondary" onClick={exportCsv}>
                <FileDown size={16} />
                Exportar CSV
              </button>
            </div>

            <div className="result-grid">
              <SectionCard
                title="Resumo funcional"
                icon={TestTube2}
                content={result.summary}
              />
              <SectionCard
                title="Casos de teste"
                icon={TestTube2}
                content={result.testCases}
              />
              <SectionCard
                title="BDD"
                icon={ShieldCheck}
                content={result.bdd}
              />
              <SectionCard
                title="Cenários negativos"
                icon={AlertTriangle}
                content={result.negativeScenarios}
              />
              <SectionCard
                title="Bugs e riscos prováveis"
                icon={Bug}
                content={result.risks}
              />
              <SectionCard
                title="CSV gerado"
                icon={FileDown}
                content={result.csv}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}