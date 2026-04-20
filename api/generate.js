function buildSystemPrompt() {
  return `
Você é um especialista sênior em QA.
Responda sempre em português do Brasil.
Retorne SOMENTE JSON válido com as chaves:
summary, testCases, bdd, negativeScenarios, risks, csv

Regras obrigatórias:
- testCases: liste casos de teste claros, objetivos e organizados
- bdd: gere cenários em Gherkin PT-BR
- negativeScenarios: liste cenários negativos e de exceção
- risks: liste bugs/riscos prováveis
- csv: gere conteúdo CSV no formato Action,Data,Expected Result
- não use markdown
- não use crases
`;
}

function demoFallback() {
  return {
    summary:
      "Modo demonstração ativado. O sistema analisou o requisito e retornou uma estrutura padrão de QA.",
    testCases:
      "1. Validar fluxo principal com dados válidos\n2. Validar obrigatoriedade dos campos\n3. Validar mensagens de erro\n4. Validar comportamento em falha externa",
    bdd:
      "Funcionalidade: Validação do requisito\n\nCenário: Executar fluxo principal com sucesso\nDado que o usuário informe dados válidos\nQuando executar a ação principal\nEntão o sistema deve concluir o processamento com sucesso",
    negativeScenarios:
      "Campos obrigatórios vazios\nDados inválidos\nFalha de integração externa\nTentativa duplicada",
    risks:
      "Ausência de validação de entrada\nMensagens inconsistentes\nFalha de tratamento de timeout\nDuplicidade de processamento",
    csv:
      "Action,Data,Expected Result\nPreencher dados válidos,,Processamento com sucesso\nEnviar campos vazios,,Exibir validação de obrigatoriedade"
  };
}

function safeParse(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function callGroq(requirement) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: `Requisito:\n${requirement}` }
      ]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Erro no Groq.");
  }

  const content = data?.choices?.[0]?.message?.content;
  const parsed = safeParse(content);

  if (!parsed) {
    throw new Error("Groq retornou JSON inválido.");
  }

  return parsed;
}

async function callGemini(requirement) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${buildSystemPrompt()}\n\nRequisito:\n${requirement}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json"
        }
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Erro no Gemini.");
  }

  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = safeParse(content);

  if (!parsed) {
    throw new Error("Gemini retornou JSON inválido.");
  }

  return parsed;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const { requirement } = req.body || {};

    if (!requirement?.trim()) {
      return res.status(400).json({ error: "Requisito não informado." });
    }

    if (process.env.GROQ_API_KEY) {
      try {
        const result = await callGroq(requirement);
        return res.status(200).json({ ...result, provider: "groq" });
      } catch (error) {
        console.error("Groq falhou:", error.message);
      }
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const result = await callGemini(requirement);
        return res.status(200).json({ ...result, provider: "gemini" });
      } catch (error) {
        console.error("Gemini falhou:", error.message);
      }
    }

    return res.status(200).json({ ...demoFallback(), provider: "demo" });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Erro interno no servidor."
    });
  }
}