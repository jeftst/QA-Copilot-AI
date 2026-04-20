export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const { requirement } = req.body || {};

    if (!requirement || !requirement.trim()) {
      return res.status(400).json({ error: "Requisito não informado." });
    }

    const systemPrompt = `
Você é um especialista sênior em QA.
Responda sempre em português do Brasil.
A partir do requisito recebido, gere exatamente os blocos abaixo:

1. summary
2. testCases
3. bdd
4. negativeScenarios
5. risks
6. csv

Regras:
- testCases: liste casos de teste claros e objetivos
- bdd: gere cenários em Gherkin PT-BR
- negativeScenarios: liste cenários negativos
- risks: liste bugs/riscos prováveis
- csv: gere conteúdo CSV no formato Action,Data,Expected Result
- Retorne SOMENTE JSON válido
`;

    const userPrompt = `Requisito:\n${requirement}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Erro ao chamar a IA.",
      });
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: "Resposta vazia da IA." });
    }

    const parsed = JSON.parse(content);

    return res.status(200).json({
      summary: parsed.summary || "",
      testCases: parsed.testCases || "",
      bdd: parsed.bdd || "",
      negativeScenarios: parsed.negativeScenarios || "",
      risks: parsed.risks || "",
      csv: parsed.csv || "",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Erro interno no servidor.",
    });
  }
}