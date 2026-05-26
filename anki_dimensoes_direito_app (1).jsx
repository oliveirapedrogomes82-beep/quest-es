import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "revisor_certo_errado_direito_v4_teste";
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const TEMP_CARD_TTL = MINUTE;
const HARD_TRIGGER_MS = 5 * 1000;
const MAX_SIMPLIFICATION_LEVEL = 3;
const NORMAL_QUESTION_MS = MINUTE;
const MAX_REVIEW_INTERVAL_MS = 120 * DAY;
const DEFAULT_DIFFICULTY = 0.35;
const DEFAULT_EASE = 2.5;

function now() {
  return Date.now();
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-5);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const seedCards = [
  {
    id: "teste-normal-01",
    statement: "É mais adequado falar em dimensões dos direitos fundamentais do que em gerações, porque uma dimensão não substitui a anterior.",
    answer: true,
    correctFeedback: "Certo. A expressão dimensões indica coexistência, acumulação e complementaridade entre os direitos fundamentais.",
    wrongFeedback: "Errado seria entender que uma dimensão elimina ou substitui a anterior. As dimensões permanecem coexistindo.",
    tag: "teste: conceito-base",
    relatedTo: "teste-normal-01",
    manualSource: true,
    simplifications: [
      {
        statement: "As dimensões dos direitos fundamentais coexistem entre si.",
        answer: true,
        correctFeedback: "Certo. A ideia de dimensão indica que os direitos se somam e continuam existindo juntos.",
        wrongFeedback: "Errado seria imaginar que uma dimensão apaga a outra.",
        tag: "teste: conceito-base"
      },
      {
        statement: "Uma nova dimensão de direitos fundamentais não elimina a anterior.",
        answer: true,
        correctFeedback: "Certo. A nova dimensão amplia o conjunto de direitos, sem excluir a anterior.",
        wrongFeedback: "Errado seria tratar a evolução dos direitos como substituição total.",
        tag: "teste: conceito-base"
      },
      {
        statement: "As dimensões dos direitos fundamentais são cumulativas.",
        answer: true,
        correctFeedback: "Certo. Elas se acumulam historicamente.",
        wrongFeedback: "Errado seria afirmar que uma dimensão deixa de existir quando surge outra.",
        tag: "teste: conceito-base"
      }
    ]
  },
  {
    id: "teste-hard-01",
    statement: "A expressão gerações é sempre tecnicamente superior a dimensões, porque demonstra que cada grupo de direitos substitui integralmente o anterior.",
    answer: false,
    correctFeedback: "Correto marcar Errado. A crítica ao termo gerações é justamente o risco de sugerir substituição, quando os direitos coexistem.",
    wrongFeedback: "Se marcou Certo, confundiu evolução histórica com substituição integral de direitos.",
    tag: "teste: conceito-base",
    isHard: true,
    manualSource: true,
    relatedTo: "teste-normal-01",
    linkedNormalId: "teste-normal-01",
    dueAt: null
  },
  {
    id: "teste-normal-02",
    statement: "Os direitos de 1ª dimensão estão ligados principalmente à liberdade individual e aos direitos civis e políticos.",
    answer: true,
    correctFeedback: "Certo. A 1ª dimensão tem como núcleo as liberdades públicas, os direitos civis e os direitos políticos.",
    wrongFeedback: "Errado seria associar a 1ª dimensão principalmente à igualdade material e aos direitos sociais, que são típicos da 2ª dimensão.",
    tag: "teste: 1ª dimensão",
    relatedTo: "teste-normal-02",
    manualSource: true,
    simplifications: [
      {
        statement: "A 1ª dimensão protege principalmente a liberdade do indivíduo.",
        answer: true,
        correctFeedback: "Certo. A liberdade individual é o núcleo clássico da 1ª dimensão.",
        wrongFeedback: "Errado seria trocar esse núcleo por igualdade material ou solidariedade.",
        tag: "teste: 1ª dimensão"
      },
      {
        statement: "Direitos civis e políticos são exemplos de direitos de 1ª dimensão.",
        answer: true,
        correctFeedback: "Certo. Esses direitos fazem parte do núcleo da 1ª dimensão.",
        wrongFeedback: "Errado seria associá-los prioritariamente à 2ª ou à 3ª dimensão.",
        tag: "teste: 1ª dimensão"
      },
      {
        statement: "A palavra-chave da 1ª dimensão é liberdade.",
        answer: true,
        correctFeedback: "Certo. Liberdade é a palavra-chave mais associada à 1ª dimensão.",
        wrongFeedback: "Errado seria indicar igualdade material como núcleo principal da 1ª dimensão.",
        tag: "teste: 1ª dimensão"
      }
    ]
  },
  {
    id: "teste-hard-02",
    statement: "Os direitos de 1ª dimensão exigem, como regra, ampla prestação material do Estado para concretizar igualdade social.",
    answer: false,
    correctFeedback: "Correto marcar Errado. A 1ª dimensão está ligada, em regra, à abstenção estatal e à proteção das liberdades.",
    wrongFeedback: "Se marcou Certo, confundiu a 1ª dimensão com a 2ª dimensão, que envolve direitos sociais e prestações estatais.",
    tag: "teste: 1ª dimensão",
    isHard: true,
    manualSource: true,
    relatedTo: "teste-normal-02",
    linkedNormalId: "teste-normal-02",
    dueAt: null
  },
  {
    id: "teste-normal-03",
    statement: "Os direitos de 2ª dimensão estão relacionados à igualdade material e podem exigir prestações positivas do Estado.",
    answer: true,
    correctFeedback: "Certo. A 2ª dimensão envolve direitos sociais, econômicos e culturais, ligados à atuação estatal para reduzir desigualdades concretas.",
    wrongFeedback: "Errado seria reduzir a 2ª dimensão à liberdade negativa, característica mais ligada à 1ª dimensão.",
    tag: "teste: 2ª dimensão",
    relatedTo: "teste-normal-03",
    manualSource: true,
    simplifications: [
      {
        statement: "A 2ª dimensão busca a igualdade material.",
        answer: true,
        correctFeedback: "Certo. Igualdade material é a ideia central da 2ª dimensão.",
        wrongFeedback: "Errado seria tratar a 2ª dimensão como simples liberdade negativa.",
        tag: "teste: 2ª dimensão"
      },
      {
        statement: "Direitos sociais pertencem ao núcleo da 2ª dimensão.",
        answer: true,
        correctFeedback: "Certo. Direitos sociais são exemplos típicos da 2ª dimensão.",
        wrongFeedback: "Errado seria tratar direitos sociais como núcleo da 1ª dimensão.",
        tag: "teste: 2ª dimensão"
      },
      {
        statement: "A palavra-chave da 2ª dimensão é igualdade material.",
        answer: true,
        correctFeedback: "Certo. A igualdade material resume bem o núcleo da 2ª dimensão.",
        wrongFeedback: "Errado seria trocar igualdade material por liberdade negativa.",
        tag: "teste: 2ª dimensão"
      }
    ]
  },
  {
    id: "teste-hard-03",
    statement: "A eficácia dos direitos de 2ª dimensão depende exclusivamente de abstenção estatal, sem relação com políticas públicas.",
    answer: false,
    correctFeedback: "Correto marcar Errado. Embora possam ter aspectos defensivos, os direitos de 2ª dimensão costumam exigir prestações e políticas públicas.",
    wrongFeedback: "Se marcou Certo, ignorou a dimensão prestacional típica dos direitos sociais.",
    tag: "teste: 2ª dimensão",
    isHard: true,
    manualSource: true,
    relatedTo: "teste-normal-03",
    linkedNormalId: "teste-normal-03",
    dueAt: null
  },
  {
    id: "teste-normal-04",
    statement: "Os direitos de 3ª dimensão estão ligados à solidariedade e podem ter titularidade coletiva ou difusa.",
    answer: true,
    correctFeedback: "Certo. A 3ª dimensão envolve direitos transindividuais, como paz, desenvolvimento e meio ambiente equilibrado.",
    wrongFeedback: "Errado seria limitar a 3ª dimensão a direitos exclusivamente individuais e patrimoniais.",
    tag: "teste: 3ª dimensão",
    relatedTo: "teste-normal-04",
    manualSource: true,
    simplifications: [
      {
        statement: "A 3ª dimensão envolve solidariedade.",
        answer: true,
        correctFeedback: "Certo. Solidariedade ou fraternidade é a ideia central da 3ª dimensão.",
        wrongFeedback: "Errado seria associar a 3ª dimensão apenas à liberdade individual.",
        tag: "teste: 3ª dimensão"
      },
      {
        statement: "Direitos coletivos ou difusos podem integrar a 3ª dimensão.",
        answer: true,
        correctFeedback: "Certo. A 3ª dimensão abrange interesses que ultrapassam o indivíduo isolado.",
        wrongFeedback: "Errado seria dizer que ela se limita a direitos individuais clássicos.",
        tag: "teste: 3ª dimensão"
      },
      {
        statement: "A palavra-chave da 3ª dimensão é solidariedade.",
        answer: true,
        correctFeedback: "Certo. Solidariedade é o núcleo mais associado à 3ª dimensão.",
        wrongFeedback: "Errado seria indicar igualdade material como palavra-chave principal da 3ª dimensão.",
        tag: "teste: 3ª dimensão"
      }
    ]
  },
  {
    id: "teste-hard-04",
    statement: "O direito ao meio ambiente equilibrado é classificado como direito exclusivamente individual, sem titularidade difusa ou coletiva.",
    answer: false,
    correctFeedback: "Correto marcar Errado. O meio ambiente equilibrado é exemplo clássico de direito difuso ligado à 3ª dimensão.",
    wrongFeedback: "Se marcou Certo, reduziu indevidamente um direito transindividual a uma titularidade apenas individual.",
    tag: "teste: 3ª dimensão",
    isHard: true,
    manualSource: true,
    relatedTo: "teste-normal-04",
    linkedNormalId: "teste-normal-04",
    dueAt: null
  },
  {
    id: "teste-normal-05",
    statement: "Existe divergência doutrinária relevante sobre o conteúdo da 4ª e da 5ª dimensões dos direitos fundamentais.",
    answer: true,
    correctFeedback: "Certo. As três primeiras dimensões são mais consolidadas, enquanto a 4ª e a 5ª variam conforme o autor adotado.",
    wrongFeedback: "Errado seria afirmar que há consenso absoluto sobre as dimensões posteriores.",
    tag: "teste: 4ª e 5ª dimensões",
    relatedTo: "teste-normal-05",
    manualSource: true,
    simplifications: [
      {
        statement: "A 4ª e a 5ª dimensões não possuem classificação totalmente pacífica.",
        answer: true,
        correctFeedback: "Certo. Há variação doutrinária sobre o conteúdo dessas dimensões.",
        wrongFeedback: "Errado seria dizer que todos os autores classificam essas dimensões da mesma forma.",
        tag: "teste: 4ª e 5ª dimensões"
      },
      {
        statement: "O conteúdo da 4ª dimensão pode variar conforme o autor.",
        answer: true,
        correctFeedback: "Certo. A classificação da 4ª dimensão não é uniforme na doutrina.",
        wrongFeedback: "Errado seria tratar a 4ª dimensão como absolutamente pacífica.",
        tag: "teste: 4ª e 5ª dimensões"
      },
      {
        statement: "As dimensões posteriores à 3ª exigem atenção ao autor adotado.",
        answer: true,
        correctFeedback: "Certo. A partir da 4ª dimensão, a banca ou o autor podem alterar a classificação.",
        wrongFeedback: "Errado seria aplicar uma classificação única sem observar o referencial teórico.",
        tag: "teste: 4ª e 5ª dimensões"
      }
    ]
  },
  {
    id: "teste-hard-05",
    statement: "A doutrina apresenta consenso absoluto de que a 4ª dimensão corresponde sempre à bioética e a 5ª dimensão corresponde sempre à paz.",
    answer: false,
    correctFeedback: "Correto marcar Errado. Há autores que associam a 4ª dimensão à democracia, informação, pluralismo, bioética ou globalização; a 5ª também varia.",
    wrongFeedback: "Se marcou Certo, tratou como pacífica uma classificação que depende do autor adotado.",
    tag: "teste: 4ª e 5ª dimensões",
    isHard: true,
    manualSource: true,
    relatedTo: "teste-normal-05",
    linkedNormalId: "teste-normal-05",
    dueAt: null
  }
];

function createRealTimeQuestionSpec(baseCard, mode) {
  const card = baseCard || {};
  const tag = String(card.tag || "conceito-base");
  const lowerTag = tag.toLowerCase();
  const sourceStatement = String(card.statement || "direitos fundamentais");
  const variant = now() % 4;
  const wantsTrue = variant % 2 === 0;

  if (mode === "simplified") {
    return {
      statement: sourceStatement,
      answer: Boolean(card.answer),
      correctFeedback: card.correctFeedback || "A resposta segue o mesmo núcleo conceitual da questão anterior.",
      wrongFeedback: card.wrongFeedback || "O erro está na relação entre a afirmação e o conceito cobrado.",
      tag
    };
  }

  if (lowerTag.includes("1")) {
    if (wantsTrue) {
      return {
        statement: "A 1ª dimensão tem como ideia central a liberdade, especialmente por meio de direitos civis e políticos.",
        answer: true,
        correctFeedback: "Certo. A 1ª dimensão está ligada às liberdades clássicas e aos direitos de defesa.",
        wrongFeedback: "Errado seria associar esse núcleo principalmente à igualdade material e às prestações sociais, que são típicas da 2ª dimensão.",
        tag
      };
    }
    return {
      statement: "A 1ª dimensão tem como núcleo principal a prestação estatal de serviços sociais como saúde, educação e moradia.",
      answer: false,
      correctFeedback: "Correto marcar Errado. Esse núcleo prestacional pertence à 2ª dimensão, não à 1ª.",
      wrongFeedback: "Se marcou Certo, houve confusão entre liberdade negativa e direitos sociais prestacionais.",
      tag
    };
  }

  if (lowerTag.includes("2")) {
    if (wantsTrue) {
      return {
        statement: "A 2ª dimensão busca a igualdade material por meio de prestações e políticas públicas.",
        answer: true,
        correctFeedback: "Certo. A 2ª dimensão envolve direitos sociais, econômicos e culturais.",
        wrongFeedback: "Errado seria tratar a 2ª dimensão como mera abstenção estatal, característica mais associada à 1ª dimensão.",
        tag
      };
    }
    return {
      statement: "Na 2ª dimensão, predominam os direitos de defesa contra o Estado, com mínima atuação estatal.",
      answer: false,
      correctFeedback: "Correto marcar Errado. A 2ª dimensão exige atuação positiva do Estado para concretizar direitos sociais.",
      wrongFeedback: "Se marcou Certo, confundiu a lógica liberal da 1ª dimensão com a lógica social da 2ª.",
      tag
    };
  }

  if (lowerTag.includes("3")) {
    if (wantsTrue) {
      return {
        statement: "A 3ª dimensão abrange direitos ligados à solidariedade, com titularidade coletiva ou difusa.",
        answer: true,
        correctFeedback: "Certo. A 3ª dimensão ultrapassa o indivíduo isolado e envolve interesses transindividuais.",
        wrongFeedback: "Errado seria limitar a 3ª dimensão a direitos individuais patrimoniais.",
        tag
      };
    }
    return {
      statement: "A 3ª dimensão é formada exclusivamente por direitos individuais e patrimoniais.",
      answer: false,
      correctFeedback: "Correto marcar Errado. A 3ª dimensão é marcada por solidariedade, fraternidade e interesses coletivos ou difusos.",
      wrongFeedback: "Se marcou Certo, reduziu indevidamente a 3ª dimensão a interesses individuais.",
      tag
    };
  }

  if (lowerTag.includes("atenção")) {
    if (wantsTrue) {
      return {
        statement: "Em prova, classificações de 4ª e 5ª dimensões devem ser lidas com atenção ao autor, banca ou material adotado.",
        answer: true,
        correctFeedback: "Certo. Há divergência doutrinária maior a partir da 4ª dimensão.",
        wrongFeedback: "Errado seria tratar 4ª e 5ª dimensões como classificações totalmente pacíficas.",
        tag
      };
    }
    return {
      statement: "Em prova, a 4ª e a 5ª dimensões sempre possuem o mesmo conteúdo, independentemente do autor adotado.",
      answer: false,
      correctFeedback: "Correto marcar Errado. Esse ponto varia bastante conforme o referencial teórico.",
      wrongFeedback: "Se marcou Certo, ignorou a divergência doutrinária existente nas dimensões posteriores.",
      tag
    };
  }

  if (wantsTrue) {
    return {
      statement: "A correção de uma afirmação de certo ou errado depende da relação conceitual entre seus termos, e não apenas de palavras isoladas.",
      answer: true,
      correctFeedback: "Certo. Em questões de certo ou errado, o sentido conceitual da afirmação é mais importante do que palavras isoladas.",
      wrongFeedback: "Errado seria julgar apenas por termos soltos, sem verificar a relação conceitual do enunciado.",
      tag
    };
  }

  return {
    statement: "Basta reconhecer uma palavra parecida para considerar automaticamente correta uma afirmação de certo ou errado.",
    answer: false,
    correctFeedback: "Correto marcar Errado. Sem relação conceitual adequada, a afirmação pode estar falsa mesmo usando palavras familiares.",
    wrongFeedback: "Se marcou Certo, você julgou por associação superficial, não pelo conceito.",
    tag
  };
}

const aiPrompt = `Transforme o texto abaixo em questões de CERTO ou ERRADO para revisão espaçada.

Regras:
1. Cada cartão deve ter apenas uma afirmação.
2. A resposta deve ser true para CERTO e false para ERRADO.
3. Crie feedback para quando o aluno acertar e para quando ele errar.
4. Inclua pegadinhas prováveis de prova quando fizer sentido.
5. Inclua também os campos curiosity e explanationText.
6. O campo curiosity deve alimentar a caixa "Curiosidade da questão".
7. O campo explanationText deve alimentar a caixa "Explicação".
8. A explicação deve corroborar o gabarito: se a questão for certa, justifique por que está certa; se for errada, justifique por que está errada.
9. Retorne SOMENTE JSON válido neste formato:
[
  {
    "statement": "afirmação para julgar como certo ou errado",
    "answer": true,
    "correctFeedback": "feedback mostrado quando o aluno responde corretamente",
    "wrongFeedback": "feedback mostrado quando o aluno responde incorretamente",
    "curiosity": "curiosidade curta e útil relacionada ao tema da questão",
    "explanationText": "explicação que corrobora o gabarito da questão: se for certa, justifica por que está certa; se for errada, justifica por que está errada",
    "tag": "tema"
  }
]

Tema: dimensões do direito ou dimensões dos direitos fundamentais.

Texto-base:
COLE AQUI O CONTEÚDO`;

const manualInstructionPrompt = `Você deve transformar o conteúdo fornecido em questões de CERTO ou ERRADO para serem coladas no aplicativo de revisão.

A resposta deve vir em blocos vinculados. Para cada QUESTÃO NORMAL, crie também:
- até 3 simplificações;
- 1 questão difícil vinculada.

Você pode gerar uma ou várias questões na mesma resposta.
Quando gerar mais de uma questão, cada conjunto completo deve ficar dentro de [questao] e [/questao].
O aplicativo identifica que uma questão terminou e outra começou por esse delimitador.

FORMATO DO CONJUNTO COMPLETO

Cada conjunto completo deve seguir esta estrutura:

[questao]
[normal]
questão normal aqui
[/normal]

[simplificacao1]
simplificação 1 aqui
[/simplificacao1]

[simplificacao2]
simplificação 2 aqui
[/simplificacao2]

[simplificacao3]
simplificação 3 aqui
[/simplificacao3]

[questao-dificil]
questão difícil aqui
[/questao-dificil]
[/questao]

FORMATO DA QUESTÃO NORMAL

Use [normal] e [/normal] para delimitar a questão principal.

Dentro dela:
1. Se a afirmação for verdadeira ou correta, coloque a afirmação entre asteriscos:
*afirmação correta aqui*

2. Se a afirmação for falsa ou errada, coloque a afirmação entre pontos de exclamação:
!afirmação errada aqui!

3. Feedback da resposta correta:
[certo]mensagem curta para quando o usuário acertar[/certo]

4. Feedback da resposta incorreta:
[errado]mensagem curta para quando o usuário errar[/errado]

5. Texto que alimenta a caixa "Curiosidade da questão":
[curiosidade]traga uma informação complementar, detalhe interessante, alerta de prova ou conexão útil sobre o tema da questão[/curiosidade]

6. Texto que alimenta a caixa "Explicação":
[explicacao]explique o gabarito da questão. Se a afirmação for certa, justifique por que está certa. Se a afirmação for errada, justifique por que está errada[/explicacao]

7. Tag ou tema:
#tema da questão#

Exemplo:
[questao]
[normal]
*Os direitos de 2ª dimensão estão ligados à igualdade material.*
[certo]Certo. A 2ª dimensão envolve direitos sociais, econômicos e culturais.[/certo]
[errado]Errado seria associar esse núcleo à 1ª dimensão, ligada à liberdade negativa.[/errado]
[curiosidade]Em muitas provas, a 2ª dimensão aparece ligada à ideia de igualdade material.[/curiosidade]
[explicacao]A afirmação está certa porque a 2ª dimensão se relaciona aos direitos sociais e à busca de igualdade material.[/explicacao]
#2ª dimensão#
[/normal]
[/questao]

SIMPLIFICAÇÕES OBRIGATÓRIAS OU RECOMENDADAS

Para cada questão normal, crie até 3 simplificações.
A simplificação 1 deve simplificar a questão original.
A simplificação 2 deve simplificar a simplificação 1.
A simplificação 3 deve simplificar a simplificação 2.
As 3 simplificações devem ser complementares entre si: cada uma deve acrescentar um pequeno reforço conceitual diferente, sem apenas repetir a anterior com outras palavras.
Não crie uma quarta simplificação.
A simplificação deve ser sutil, sem entregar a resposta de forma óbvia.

Use este formato:

[simplificacao1]
*primeira versão um pouco mais simples da questão normal*
[certo]feedback da resposta correta[/certo]
[errado]feedback da resposta incorreta[/errado]
[curiosidade]curiosidade curta e útil sobre o tema da questão[/curiosidade]
[explicacao]explicação que confirma o gabarito: se a afirmação for certa, justifique; se for errada, justifique o erro[/explicacao]
[/simplificacao1]

[simplificacao2]
*segunda versão, simplificando a anterior*
[certo]feedback da resposta correta[/certo]
[errado]feedback da resposta incorreta[/errado]
[curiosidade]curiosidade curta e útil sobre o tema da questão[/curiosidade]
[explicacao]explicação que confirma o gabarito: se a afirmação for certa, justifique; se for errada, justifique o erro[/explicacao]
[/simplificacao2]

[simplificacao3]
*terceira e última versão, simplificando a anterior*
[certo]feedback da resposta correta[/certo]
[errado]feedback da resposta incorreta[/errado]
[curiosidade]curiosidade curta e útil sobre o tema da questão[/curiosidade]
[explicacao]explicação que confirma o gabarito: se a afirmação for certa, justifique; se for errada, justifique o erro[/explicacao]
[/simplificacao3]

QUESTÃO DIFÍCIL VINCULADA

Para cada questão normal, crie uma questão mais difícil vinculada ao mesmo tema.
Essa questão difícil será invocada pelo aplicativo quando o usuário responder a questão normal antes de 5 segundos.
A questão difícil não deve aparecer se não estiver vinculada à última questão respondida.

Use este formato:

[questao-dificil]
!questão mais difícil aqui!
[certo]feedback da resposta correta[/certo]
[errado]feedback da resposta incorreta[/errado]
[curiosidade]curiosidade curta e útil sobre o tema da questão[/curiosidade]
[explicacao]explicação que confirma o gabarito: se a afirmação for certa, justifique; se for errada, justifique o erro[/explicacao]
#mesmo tema da questão normal#
[/questao-dificil]

REGRAS IMPORTANTES

- Cada bloco deve ter apenas uma afirmação julgável como Certo ou Errado.
- Cada conjunto completo deve começar com [questao] e terminar com [/questao].
- O aplicativo usa [questao] e [/questao] para saber onde uma questão termina e outra começa.
- Não misture simplificações ou questão difícil de uma questão com outra.
- A questão normal, as 3 simplificações e a questão difícil devem tratar do mesmo tema.
- As simplificações devem manter o mesmo gabarito da questão original, salvo se for indispensável alterar a frase.
- As simplificações devem ser complementares entre si, formando uma sequência progressiva de compreensão: a primeira aproxima o conceito, a segunda reforça outro aspecto do mesmo conceito e a terceira consolida a ideia com máxima clareza.
- A questão difícil deve ser mais exigente, mas ainda objetiva.
- Os campos [curiosidade] e [explicacao] devem ser preenchidos em todos os blocos: questão normal, simplificações e questão difícil.
- A curiosidade deve trazer uma informação complementar útil sobre o tema, sem substituir a explicação.
- A explicação deve corroborar o gabarito da questão: se a afirmação for certa, justifique por que está certa; se a afirmação for errada, justifique por que está errada.
- Esses campos devem vir das informações do conteúdo fornecido, não de frases genéricas.
- O texto da questão deve conter somente a afirmação a ser julgada, sem comentários como "releia", "observe", "julgue novamente", "sobre o tema", "questão baseada em" ou qualquer indicação de origem.
- Não use JSON.
- Não escreva explicações fora dos blocos.
- Retorne somente os blocos finais.

Se gerar 5 questões, por exemplo, retorne 5 conjuntos completos, cada um dentro de [questao]...[/questao].

MODELO COMPLETO

[questao]
[normal]
!A 2ª dimensão dos direitos fundamentais é formada principalmente por direitos de defesa contra o Estado.!
[certo]Correto marcar Errado. A 2ª dimensão se relaciona aos direitos sociais e à atuação positiva do Estado.[/certo]
[errado]Se marcou Certo, confundiu a 2ª dimensão com a 1ª dimensão, ligada às liberdades negativas.[/errado]
[curiosidade]A palavra-chave da 2ª dimensão costuma ser igualdade material, enquanto a da 1ª é liberdade.[/curiosidade]
[explicacao]A afirmação está errada porque atribui à 2ª dimensão o núcleo dos direitos de defesa contra o Estado, que é mais característico da 1ª dimensão.[/explicacao]
#2ª dimensão#
[/normal]

[simplificacao1]
!A 2ª dimensão tem como núcleo principal a liberdade negativa contra o Estado.!
[certo]Correto marcar Errado. A 2ª dimensão está ligada à igualdade material e aos direitos sociais.[/certo]
[errado]Se marcou Certo, confundiu liberdade negativa com igualdade material.[/errado]
[curiosidade]Liberdade negativa indica limite à atuação estatal; igualdade material costuma exigir atuação estatal.[/curiosidade]
[explicacao]A afirmação está errada porque coloca liberdade negativa como núcleo da 2ª dimensão, quando esse núcleo é ligado à igualdade material.[/explicacao]
[/simplificacao1]

[simplificacao2]
!A 2ª dimensão é lembrada principalmente pela ideia de não intervenção do Estado.!
[certo]Correto marcar Errado. A 2ª dimensão exige atuação positiva para concretizar direitos sociais.[/certo]
[errado]Se marcou Certo, associou a 2ª dimensão à lógica da 1ª dimensão.[/errado]
[curiosidade]A expressão atuação positiva do Estado costuma aparecer em temas de direitos sociais.[/curiosidade]
[explicacao]A afirmação está errada porque associa a 2ª dimensão à não intervenção estatal, característica mais próxima da 1ª dimensão.[/explicacao]
[/simplificacao2]

[simplificacao3]
!A palavra-chave da 2ª dimensão é apenas liberdade individual.!
[certo]Correto marcar Errado. A palavra-chave mais adequada é igualdade material.[/certo]
[errado]Se marcou Certo, trocou igualdade material por liberdade individual.[/errado]
[curiosidade]Uma forma rápida de lembrar: 1ª dimensão = liberdade; 2ª dimensão = igualdade material.[/curiosidade]
[explicacao]A afirmação está errada porque liberdade individual é mais associada à 1ª dimensão, enquanto a 2ª dimensão se liga à igualdade material.[/explicacao]
[/simplificacao3]

[questao-dificil]
!A eficácia dos direitos de 2ª dimensão depende exclusivamente de abstenção estatal, sem relação com políticas públicas.!
[certo]Correto marcar Errado. Embora também possam ter dimensões defensivas, os direitos sociais costumam exigir prestações e políticas públicas.[/certo]
[errado]Se marcou Certo, ignorou a dimensão prestacional típica dos direitos sociais.[/errado]
[curiosidade]Direitos sociais costumam ser cobrados junto da ideia de prestações estatais e políticas públicas.[/curiosidade]
[explicacao]A afirmação está errada porque reduz os direitos de 2ª dimensão à abstenção estatal, quando eles frequentemente exigem prestações e políticas públicas.[/explicacao]
#2ª dimensão#
[/questao-dificil]
[/questao]

Conteúdo-base:
COLE AQUI O CONTEÚDO`;

function toBool(value) {
  if (typeof value === "boolean") return value;
  const text = String(value || "").trim().toLowerCase();
  if (["true", "certo", "correto", "verdadeiro", "v", "sim", "1"].includes(text)) return true;
  if (["false", "errado", "incorreto", "falso", "f", "nao", "não", "0"].includes(text)) return false;
  return null;
}

function normalizeCard(raw) {
  const answer = toBool(raw.answer !== undefined ? raw.answer : raw.gabarito);
  const statement = String(raw.statement || raw.afirmacao || raw.afirmação || raw.front || raw.pergunta || "").trim();
  const fallback = String(raw.explanation || raw.explicacao || raw.feedback || "").trim();
  const tag = String(raw.tag || raw.tema || raw.assunto || "geral").trim() || "geral";
  const relatedTo = String(raw.relatedTo || raw.vinculo || raw.vínculo || raw.relacionado || raw.related || "").trim();
  const correctFeedbackText = String(raw.correctFeedback || raw.feedbackCerto || raw.feedback_certo || fallback || "Resposta correta. Revise a justificativa do item.").trim();
  const wrongFeedbackText = String(raw.wrongFeedback || raw.feedbackErrado || raw.feedback_errado || fallback || "Resposta incorreta. Compare a afirmação com o conceito correto antes de avançar.").trim();
  const curiosity = String(raw.curiosity || raw.curiosidade || raw.curiosidadeQuestao || raw.curiosidade_questao || raw.whyCorrectIsCorrect || raw.porqueCerto || raw.porQueCerto || raw.porque_certo || correctFeedbackText).trim();
  const explanationText = String(raw.explanationText || raw.resultExplanation || raw.explicacaoResultado || raw.explicaçãoResultado || raw.explicacao || raw.explicação || raw.justificativa || raw.whyWrongIsWrong || raw.porqueErrado || raw.porQueErrado || raw.porque_errado || correctFeedbackText).trim();

  return {
    id: raw.id || uid(),
    statement,
    answer: answer === null ? true : answer,
    correctFeedback: correctFeedbackText,
    wrongFeedback: wrongFeedbackText,
    curiosity,
    explanationText,
    whyCorrectIsCorrect: curiosity,
    whyWrongIsWrong: explanationText,
    tag,
    relatedTo: relatedTo || tag,
    isHard: Boolean(raw.isHard || raw.hard || raw.dificil || raw.difícil),
    manualSource: Boolean(raw.manualSource || raw.manual || raw.inseridaManualmente),
    createdAt: raw.createdAt || now(),
    updatedAt: raw.updatedAt || now(),
    dueAt: raw.dueAt === null || raw.isHard || raw.hard || raw.dificil || raw.difícil ? null : raw.dueAt || now(),
    intervalMs: raw.intervalMs || 0,
    ease: raw.ease || DEFAULT_EASE,
    difficulty: raw.difficulty === undefined ? DEFAULT_DIFFICULTY : raw.difficulty,
    memoryStrength: raw.memoryStrength || 0,
    reviewBurden: raw.reviewBurden || 0,
    lapseCount: raw.lapseCount || 0,
    reviewStage: raw.reviewStage || (raw.reviews ? "aprendizagem" : "novo"),
    nextReviewReason: raw.nextReviewReason || "A questão ainda não foi revisada pelo algoritmo adaptativo.",
    reviews: raw.reviews || 0,
    correct: raw.correct || 0,
    wrong: raw.wrong || 0,
    streak: raw.streak || 0,
    lastAnswer: raw.lastAnswer === undefined ? null : raw.lastAnswer,
    lastWasCorrect: raw.lastWasCorrect === undefined ? null : raw.lastWasCorrect,
    lastReviewedAt: raw.lastReviewedAt || null,
    mistakes: raw.mistakes || [],
    temporary: Boolean(raw.temporary),
    expiresAt: raw.expiresAt || null,
    originId: raw.originId || null,
    generatedKind: raw.generatedKind || null,
    simplificationLevel: raw.simplificationLevel || 0,
    sourceHardCardId: raw.sourceHardCardId || null,
    simplifications: Array.isArray(raw.simplifications) ? raw.simplifications.slice(0, MAX_SIMPLIFICATION_LEVEL) : [],
    linkedNormalId: raw.linkedNormalId || null,
    lastResponseMs: raw.lastResponseMs || null,
    lastReviewClass: raw.lastReviewClass || null,
    lastReviewClassShort: raw.lastReviewClassShort || null,
    lastReviewClassDescription: raw.lastReviewClassDescription || null
  };
}

function createSeedDeck() {
  return seedCards.map((card) => normalizeCard(card));
}

function loadCards() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createSeedDeck();
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) return createSeedDeck();
    return parsed.map((card) => normalizeCard(card)).filter((card) => card.statement);
  } catch (error) {
    return createSeedDeck();
  }
}

function saveCards(cards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function formatWhen(ts) {
  const diff = ts - now();
  if (diff <= 0) return "agora";
  if (diff < 60 * MINUTE) return `em ${Math.ceil(diff / MINUTE)} min`;
  if (diff < DAY) return `em ${Math.ceil(diff / (60 * MINUTE))} h`;
  return `em ${Math.ceil(diff / DAY)} dia(s)`;
}

function formatCountdown(expiresAt, referenceTime = now()) {
  if (!expiresAt) return "sem prazo";
  const remaining = Math.max(0, expiresAt - referenceTime);
  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDuration(ms) {
  const remaining = Math.max(0, ms);
  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatInterval(ms) {
  if (!ms) return "sem intervalo";
  if (ms < 60 * MINUTE) return `${Math.ceil(ms / MINUTE)} min`;
  if (ms < DAY) return `${Math.ceil(ms / (60 * MINUTE))} h`;
  return `${Math.ceil(ms / DAY)} dia(s)`;
}

function formatDateTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function getTimerPercent(startedAt, totalMs, referenceTime = now()) {
  if (!startedAt || !totalMs) return 100;
  const elapsed = referenceTime - startedAt;
  return clamp(((totalMs - elapsed) / totalMs) * 100, 0, 100);
}

function getCountdownPercent(card, referenceTime = now()) {
  if (!card || !card.expiresAt) return 0;
  const createdAt = card.activatedAt || card.createdAt || referenceTime;
  const total = Math.max(1, card.expiresAt - createdAt);
  const remaining = Math.max(0, card.expiresAt - referenceTime);
  return clamp((remaining / total) * 100, 0, 100);
}

function classifyReviewTime(responseMs) {
  if (responseMs <= HARD_TRIGGER_MS) {
    return {
      label: "Domínio rápido",
      shortLabel: "rápida+",
      intervalMultiplier: 1.45,
      description: "Resposta em até 5 segundos. O app considera maior domínio e pode alongar mais a próxima revisão."
    };
  }

  if (responseMs <= 15 * 1000) {
    return {
      label: "Revisão rápida",
      shortLabel: "rápida",
      intervalMultiplier: 1.2,
      description: "Resposta rápida. O app aumenta o intervalo, mas com menos força do que no domínio imediato."
    };
  }

  if (responseMs <= 45 * 1000) {
    return {
      label: "Revisão normal",
      shortLabel: "normal",
      intervalMultiplier: 1,
      description: "Resposta dentro do tempo esperado. O intervalo cresce de forma padrão."
    };
  }

  return {
    label: "Revisão lenta",
    shortLabel: "lenta",
    intervalMultiplier: 0.75,
    description: "Resposta lenta. Mesmo acertando, o app alonga o intervalo com mais cautela."
  };
}

function getBetweenMarkers(text, startMarker, endMarker) {
  const finalMarker = endMarker || startMarker;
  const start = text.indexOf(startMarker);
  if (start < 0) return "";
  const contentStart = start + startMarker.length;
  const end = text.indexOf(finalMarker, contentStart);
  if (end < 0) return "";
  return text.slice(contentStart, end).trim();
}

function getLineValue(text, label) {
  const lineBreak = String.fromCharCode(10);
  const lines = text.split(lineBreak);
  const target = label.toLowerCase();

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith(target)) {
      return trimmed.slice(label.length).trim();
    }
  }

  return "";
}

function getMarkedBlock(text, marker) {
  return getBetweenMarkers(text, `[${marker}]`, `[/${marker}]`);
}

function getMarkedBlocks(text, marker) {
  const source = String(text || "");
  const startMarker = `[${marker}]`;
  const endMarker = `[/${marker}]`;
  const blocks = [];
  let cursor = 0;

  while (cursor < source.length) {
    const start = source.indexOf(startMarker, cursor);
    if (start < 0) break;
    const contentStart = start + startMarker.length;
    const end = source.indexOf(endMarker, contentStart);
    if (end < 0) break;
    const content = source.slice(contentStart, end).trim();
    if (content) blocks.push(content);
    cursor = end + endMarker.length;
  }

  return blocks;
}

function splitManualQuestionGroups(text) {
  const source = String(text || "").trim();
  if (!source) return [];

  const wrappedGroups = getMarkedBlocks(source, "questao").concat(getMarkedBlocks(source, "questão"));
  if (wrappedGroups.length) return wrappedGroups;

  const normalMarker = "[normal]";
  const starts = [];
  let cursor = 0;

  while (cursor < source.length) {
    const start = source.indexOf(normalMarker, cursor);
    if (start < 0) break;
    starts.push(start);
    cursor = start + normalMarker.length;
  }

  if (starts.length <= 1) return [source];

  return starts.map((start, index) => {
    const end = index + 1 < starts.length ? starts[index + 1] : source.length;
    return source.slice(start, end).trim();
  }).filter(Boolean);
}

function removeMarkedBlock(text, marker) {
  const startMarker = `[${marker}]`;
  const endMarker = `[/${marker}]`;
  let output = text;

  while (output.includes(startMarker) && output.includes(endMarker)) {
    const start = output.indexOf(startMarker);
    const end = output.indexOf(endMarker, start + startMarker.length);
    if (start < 0 || end < 0) break;
    output = output.slice(0, start) + output.slice(end + endMarker.length);
  }

  return output;
}

function parseSingleAnnotatedBlock(block, defaultTag) {
  const trimmed = String(block || "").trim();
  if (!trimmed) return null;

  const correctStatement = getBetweenMarkers(trimmed, "*", "*");
  const wrongStatement = getBetweenMarkers(trimmed, "!", "!");
  const correctFeedback = getBetweenMarkers(trimmed, "[certo]", "[/certo]") || getLineValue(trimmed, "Certo:") || getLineValue(trimmed, "Feedback certo:");
  const wrongFeedback = getBetweenMarkers(trimmed, "[errado]", "[/errado]") || getLineValue(trimmed, "Errado:") || getLineValue(trimmed, "Feedback errado:");
  const curiosity = getBetweenMarkers(trimmed, "[curiosidade]", "[/curiosidade]") || getLineValue(trimmed, "Curiosidade:") || getBetweenMarkers(trimmed, "[porque-certo]", "[/porque-certo]") || getBetweenMarkers(trimmed, "[por-que-certo]", "[/por-que-certo]") || getLineValue(trimmed, "Por que o certo está certo:") || correctFeedback;
  const explanationText = getBetweenMarkers(trimmed, "[explicacao]", "[/explicacao]") || getBetweenMarkers(trimmed, "[explicação]", "[/explicação]") || getBetweenMarkers(trimmed, "[justificativa]", "[/justificativa]") || getLineValue(trimmed, "Explicação:") || getLineValue(trimmed, "Justificativa:") || getBetweenMarkers(trimmed, "[porque-errado]", "[/porque-errado]") || getBetweenMarkers(trimmed, "[por-que-errado]", "[/por-que-errado]") || getLineValue(trimmed, "Por que o errado está errado:") || correctFeedback;
  const tag = getBetweenMarkers(trimmed, "#", "#") || getLineValue(trimmed, "Tag:") || defaultTag || "geral";

  if (correctStatement) {
    return normalizeCard({ statement: correctStatement, answer: true, correctFeedback, wrongFeedback, curiosity, explanationText, tag, manualSource: true });
  }

  if (wrongStatement) {
    return normalizeCard({ statement: wrongStatement, answer: false, correctFeedback, wrongFeedback, curiosity, explanationText, tag, manualSource: true });
  }

  return null;
}

function parseStructuredText(text, defaultTag) {
  const lineBreak = String.fromCharCode(10);
  const carriageReturn = String.fromCharCode(13);
  const normalized = text.split(carriageReturn).join("");
  const blocks = normalized.split(lineBreak + lineBreak).map((block) => block.trim()).filter(Boolean);
  const parsed = [];

  for (const block of blocks) {
    const lines = block.split(lineBreak).map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const pipeSource = lines.find((line) => line.includes("|")) || "";
    if (pipeSource) {
      const parts = pipeSource.split("|").map((part) => part.trim());
      const answer = toBool(parts[1]);
      if (parts[0] && answer !== null) {
        parsed.push(normalizeCard({
          statement: parts[0],
          answer,
          correctFeedback: parts[2],
          wrongFeedback: parts[3],
          tag: parts[4] || defaultTag
        }));
        continue;
      }
    }

    let statement = "";
    let answer = null;
    let feedback = "";

    for (const line of lines) {
      const lower = line.toLowerCase();
      const value = line.includes(":") ? line.slice(line.indexOf(":") + 1).trim() : "";
      if (lower.startsWith("afirmação:") || lower.startsWith("afirmacao:") || lower.startsWith("item:") || lower.startsWith("enunciado:")) {
        statement = value;
      } else if (lower.startsWith("gabarito:") || lower.startsWith("resposta:")) {
        answer = toBool(value);
      } else if (lower.startsWith("feedback:") || lower.startsWith("justificativa:")) {
        feedback = value;
      }
    }

    if (!statement && lines.length >= 2) {
      const maybeAnswer = toBool(lines[lines.length - 1]);
      if (maybeAnswer !== null) {
        statement = lines.slice(0, -1).join(" ");
        answer = maybeAnswer;
      }
    }

    if (statement && answer !== null) {
      parsed.push(normalizeCard({
        statement,
        answer,
        correctFeedback: feedback,
        wrongFeedback: feedback,
        tag: defaultTag
      }));
    }
  }

  return parsed;
}

function parseCards(text, defaultTag) {
  const trimmed = text.trim();
  if (!trimmed) return [];

  try {
    const json = JSON.parse(trimmed);
    if (Array.isArray(json)) return json.map((card) => normalizeCard(card)).filter((card) => card.statement);
    if (json && Array.isArray(json.cards)) return json.cards.map((card) => normalizeCard(card)).filter((card) => card.statement);
  } catch (error) {
    return parseStructuredText(trimmed, defaultTag || "importado");
  }

  return [];
}

function parseAnnotatedManualText(text, defaultTag) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const normalBlock = getMarkedBlock(trimmed, "normal");
  const mainSource = normalBlock || ["simplificacao1", "simplificacao2", "simplificacao3", "questao-dificil"]
    .reduce((current, marker) => removeMarkedBlock(current, marker), trimmed);

  const mainCard = parseSingleAnnotatedBlock(mainSource, defaultTag);
  if (!mainCard) {
    const fallback = parseCards(trimmed, defaultTag || "geral")[0];
    return fallback ? { cards: [normalizeCard({ ...fallback, manualSource: true })], mainCard: fallback } : null;
  }

  const simplifications = [1, 2, 3]
    .map((level) => getMarkedBlock(trimmed, `simplificacao${level}`) || getMarkedBlock(trimmed, `simplificação${level}`))
    .map((block) => parseSingleAnnotatedBlock(block, mainCard.tag))
    .filter(Boolean)
    .slice(0, MAX_SIMPLIFICATION_LEVEL)
    .map((card, index) => ({
      statement: card.statement,
      answer: card.answer,
      correctFeedback: card.correctFeedback,
      wrongFeedback: card.wrongFeedback,
      curiosity: card.curiosity,
      explanationText: card.explanationText,
      whyCorrectIsCorrect: card.curiosity || card.whyCorrectIsCorrect,
      whyWrongIsWrong: card.explanationText || card.whyWrongIsWrong,
      tag: mainCard.tag,
      simplificationLevel: index + 1
    }));

  const hardBlock = getMarkedBlock(trimmed, "questao-dificil") || getMarkedBlock(trimmed, "questão-difícil") || getMarkedBlock(trimmed, "questaoDificil");
  const hardCardParsed = parseSingleAnnotatedBlock(hardBlock, mainCard.tag);
  const mainWithSimplifications = normalizeCard({
    ...mainCard,
    simplifications,
    manualSource: true,
    isHard: false,
    relatedTo: mainCard.tag
  });

  const outputCards = [mainWithSimplifications];

  if (hardCardParsed) {
    outputCards.push(normalizeCard({
      ...hardCardParsed,
      isHard: true,
      manualSource: true,
      relatedTo: mainWithSimplifications.id,
      linkedNormalId: mainWithSimplifications.id,
      dueAt: null
    }));
  }

  return { cards: outputCards, mainCard: mainWithSimplifications };
}

function parseAnnotatedManualBatch(text, defaultTag) {
  const groups = splitManualQuestionGroups(text);
  const allCards = [];
  const groupsParsed = [];

  for (const group of groups) {
    const parsed = parseAnnotatedManualText(group, defaultTag);
    const parsedCards = parsed && Array.isArray(parsed.cards) ? parsed.cards : parsed ? [parsed] : [];
    if (!parsedCards.length || !parsedCards[0].statement) continue;
    allCards.push(...parsedCards);
    groupsParsed.push(parsed);
  }

  if (!allCards.length) {
    const fallback = parseCards(text, defaultTag || "geral");
    return { cards: fallback, groupsParsed: [] };
  }

  return { cards: allCards, groupsParsed };
}

function calculateAdaptiveReview(card, wasCorrect, reviewClass, nextStreak, nextWrong, nextLapseCount) {
  const currentEase = card.ease || DEFAULT_EASE;
  const currentDifficulty = card.difficulty === undefined ? DEFAULT_DIFFICULTY : card.difficulty;
  const currentStrength = card.memoryStrength || 0;
  const currentBurden = card.reviewBurden || 0;
  const previousInterval = card.intervalMs || 0;

  if (wasCorrect) {
    const speedBonus = reviewClass.intervalMultiplier || 1;
    const fastBonus = reviewClass.shortLabel === "rápida+" ? 0.08 : reviewClass.shortLabel === "rápida" ? 0.05 : 0.02;
    const ease = clamp(currentEase + fastBonus, 1.3, 3.4);
    const difficulty = clamp(currentDifficulty - (reviewClass.shortLabel === "lenta" ? 0.01 : 0.05), 0.05, 0.95);
    const memoryGain = reviewClass.shortLabel === "rápida+" ? 1.35 : reviewClass.shortLabel === "rápida" ? 1.1 : reviewClass.shortLabel === "normal" ? 0.85 : 0.55;
    const memoryStrength = clamp(currentStrength + memoryGain, 0, 12);
    const reviewBurden = clamp(currentBurden - 1.25, 0, 10);
    const errorPressure = clamp(nextWrong * 0.08 + nextLapseCount * 0.1 + reviewBurden * 0.03, 0, 0.65);

    let baseInterval;
    if (nextStreak <= 1) {
      baseInterval = nextWrong > 0 ? 12 * 60 * MINUTE : DAY;
    } else if (nextStreak === 2) {
      baseInterval = 3 * DAY;
    } else if (nextStreak === 3) {
      baseInterval = 7 * DAY;
    } else {
      baseInterval = Math.max(previousInterval || 7 * DAY, DAY) * ease;
    }

    let intervalMs = Math.round(baseInterval * speedBonus * (1 - errorPressure) * (1 + memoryStrength * 0.04));
    const minimumInterval = nextWrong > 0 && nextStreak <= 1 ? 20 * MINUTE : 6 * 60 * MINUTE;
    intervalMs = clamp(intervalMs, minimumInterval, MAX_REVIEW_INTERVAL_MS);

    const reviewStage = nextStreak >= 4 && memoryStrength >= 5 && difficulty < 0.35
      ? "manutenção"
      : nextStreak >= 2
        ? "consolidação"
        : nextWrong > 0
          ? "reaprendizagem"
          : "aprendizagem";

    const nextReviewReason = nextWrong > 0
      ? "Acertou, mas ainda há histórico de erro; o intervalo cresce com cautela."
      : reviewClass.shortLabel === "rápida+"
        ? "Acerto muito rápido aumentou a confiança de memória e alongou a próxima revisão."
        : "Acerto registrado; o intervalo aumentou conforme a sequência de acertos.";

    return { ease, difficulty, memoryStrength, reviewBurden, intervalMs, reviewStage, nextReviewReason };
  }

  const difficulty = clamp(currentDifficulty + 0.13, 0.05, 0.95);
  const ease = clamp(currentEase - 0.28, 1.3, 3.4);
  const memoryStrength = clamp(currentStrength - 1.2, 0, 12);
  const reviewBurden = clamp(currentBurden + 2, 0, 10);
  const baseWrongInterval = nextLapseCount >= 3 ? 5 * MINUTE : nextLapseCount === 2 ? 10 * MINUTE : 20 * MINUTE;
  const difficultyFactor = clamp(1 - difficulty * 0.35, 0.45, 1);
  const intervalMs = clamp(Math.round(baseWrongInterval * difficultyFactor), 3 * MINUTE, 30 * MINUTE);

  return {
    ease,
    difficulty,
    memoryStrength,
    reviewBurden,
    intervalMs,
    reviewStage: "reaprendizagem",
    nextReviewReason: "Erro registrado; o conteúdo volta mais cedo e com maior prioridade até estabilizar."
  };
}

function gradeCard(card, selectedAnswer, responseMs) {
  const reviewedAt = now();
  const wasCorrect = selectedAnswer === card.answer;
  const reviewClass = classifyReviewTime(responseMs || 0);
  const nextCorrect = wasCorrect ? (card.correct || 0) + 1 : (card.correct || 0);
  const nextWrong = wasCorrect ? (card.wrong || 0) : (card.wrong || 0) + 1;
  const nextStreak = wasCorrect ? (card.streak || 0) + 1 : 0;
  const nextLapseCount = wasCorrect ? Math.max(0, (card.lapseCount || 0) - (nextStreak >= 2 ? 1 : 0)) : (card.lapseCount || 0) + 1;
  let mistakes = card.mistakes || [];

  if (!wasCorrect) {
    mistakes = [{ at: reviewedAt, selectedAnswer, correctAnswer: card.answer, statement: card.statement, responseMs: responseMs || 0, reviewClass: reviewClass.label }, ...mistakes].slice(0, 20);
  }

  const adaptive = calculateAdaptiveReview(card, wasCorrect, reviewClass, nextStreak, nextWrong, nextLapseCount);

  return {
    ...card,
    ease: adaptive.ease,
    difficulty: adaptive.difficulty,
    memoryStrength: adaptive.memoryStrength,
    reviewBurden: adaptive.reviewBurden,
    reviewStage: adaptive.reviewStage,
    nextReviewReason: adaptive.nextReviewReason,
    intervalMs: adaptive.intervalMs,
    streak: nextStreak,
    wrong: nextWrong,
    correct: nextCorrect,
    lapseCount: nextLapseCount,
    reviews: (card.reviews || 0) + 1,
    lastAnswer: selectedAnswer,
    lastWasCorrect: wasCorrect,
    lastReviewedAt: reviewedAt,
    lastResponseMs: responseMs || 0,
    lastReviewClass: reviewClass.label,
    lastReviewClassShort: reviewClass.shortLabel,
    lastReviewClassDescription: reviewClass.description,
    dueAt: card.isHard || card.generatedKind === "hardReview" ? null : reviewedAt + adaptive.intervalMs,
    updatedAt: reviewedAt,
    mistakes
  };
}

function getTopicHint(card) {
  const tag = String(card.tag || "").toLowerCase();
  if (tag.includes("1")) return "Lembre do núcleo: liberdade, direitos civis e políticos, com abstenção estatal em regra.";
  if (tag.includes("2")) return "Lembre do núcleo: igualdade material, direitos sociais e atuação positiva do Estado.";
  if (tag.includes("3")) return "Lembre do núcleo: solidariedade, fraternidade e direitos coletivos ou difusos.";
  if (tag.includes("conceito")) return "Lembre do núcleo: dimensões coexistem; gerações pode sugerir substituição.";
  if (tag.includes("atenção")) return "Lembre do núcleo: a partir da 4ª dimensão há divergência doutrinária.";
  return `Lembre do tema central: ${card.tag || "direitos fundamentais"}.`;
}

function makeTemporaryCard(raw, kind, originCard, extra) {
  const createdAt = now();
  const source = originCard || {};
  const more = extra || {};
  return normalizeCard({
    ...raw,
    id: uid(),
    tag: raw.tag || source.tag || "treino temporário",
    createdAt,
    updatedAt: createdAt,
    dueAt: createdAt,
    temporary: true,
    expiresAt: null,
    activatedAt: null,
    originId: source.originId || source.id || null,
    generatedKind: kind,
    simplificationLevel: more.simplificationLevel || 0
  });
}

function createRelatedCard(baseCard) {
  const generated = createRealTimeQuestionSpec(baseCard, "related");
  return makeTemporaryCard(generated, "related", baseCard || null);
}

function normalizeRelation(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getRelationKeys(card) {
  if (!card) return [];
  const values = [card.id, card.tag, card.relatedTo, card.originId].filter(Boolean);
  return Array.from(new Set(values.map((value) => normalizeRelation(value)).filter(Boolean)));
}

function isHardQuestionRelatedTo(hardCard, baseCard) {
  if (!hardCard || !baseCard) return false;
  const hardKeys = getRelationKeys(hardCard);
  const baseKeys = getRelationKeys(baseCard);

  return hardKeys.some((hardKey) =>
    baseKeys.some((baseKey) =>
      hardKey === baseKey ||
      (hardKey.length > 3 && baseKey.length > 3 && (hardKey.includes(baseKey) || baseKey.includes(hardKey)))
    )
  );
}

function findHardQuestionForBase(cards, baseCard) {
  if (!baseCard) return null;

  return cards
    .filter((card) => card.isHard && card.manualSource && card.id !== baseCard.id && isHardQuestionRelatedTo(card, baseCard))
    .sort((a, b) => {
      const aReviewed = a.lastReviewedAt || 0;
      const bReviewed = b.lastReviewedAt || 0;
      if (aReviewed !== bReviewed) return aReviewed - bReviewed;
      return (a.dueAt || 0) - (b.dueAt || 0);
    })[0] || null;
}

function createHardOverlayCard(hardCard, baseCard) {
  return normalizeCard({
    ...hardCard,
    generatedKind: "hardReview",
    sourceHardCardId: hardCard.id,
    originId: baseCard && baseCard.id ? baseCard.id : null,
    temporary: false,
    expiresAt: null
  });
}

function createSimplifiedCard(card) {
  const level = (card.simplificationLevel || 0) + 1;
  if (level > MAX_SIMPLIFICATION_LEVEL) return null;

  const storedSimplification = Array.isArray(card.simplifications) ? card.simplifications[level - 1] : null;
  if (storedSimplification) {
    return makeTemporaryCard({
      ...storedSimplification,
      tag: card.tag,
      simplifications: card.simplifications
    }, "simplified", card, { simplificationLevel: level });
  }

  const generated = createRealTimeQuestionSpec(card, "simplified");

  return makeTemporaryCard({
    ...generated,
    statement: generated.statement,
    correctFeedback: `Agora ficou mais direcionado. ${generated.correctFeedback}`,
    wrongFeedback: `O erro ainda parece estar no vínculo conceitual. ${generated.wrongFeedback}`,
    tag: card.tag,
    simplifications: card.simplifications || []
  }, "simplified", card, { simplificationLevel: level });
}

function removeExpiredTempCards(tempCards, referenceTime = now()) {
  return tempCards.filter((card) => !card.expiresAt || card.expiresAt > referenceTime);
}

function activateTemporaryCard(card, startedAt) {
  if (!card || !card.temporary || card.expiresAt) return card;
  return {
    ...card,
    activatedAt: startedAt,
    createdAt: startedAt,
    updatedAt: startedAt,
    dueAt: startedAt,
    expiresAt: startedAt + TEMP_CARD_TTL
  };
}

export default function RevisorDireitoApp() {
  const [cards, setCards] = useState(loadCards);
  const [tempCards, setTempCards] = useState([]);
  const [tab, setTab] = useState("estudar");
  const [selected, setSelected] = useState(null);
  const [reviewedCard, setReviewedCard] = useState(null);
  const [importText, setImportText] = useState("");
  const [importTag, setImportTag] = useState("dimensões do direito");
  const [manualText, setManualText] = useState("");
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [filter, setFilter] = useState("todos");
  const [message, setMessage] = useState("");
  const [timeTick, setTimeTick] = useState(now());
  const [lastAnsweredCard, setLastAnsweredCard] = useState(null);
  const [questionStartedAt, setQuestionStartedAt] = useState(null);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [timerPausedAt, setTimerPausedAt] = useState(null);
  const [globalOverlayCard, setGlobalOverlayCard] = useState(null);
  const [pendingHardCard, setPendingHardCard] = useState(null);
  const [studyStarted, setStudyStarted] = useState(false);
  const [howItWorksPulseKey, setHowItWorksPulseKey] = useState(1);
  const [showAppGuide, setShowAppGuide] = useState(false);

  useEffect(() => {
    saveCards(cards);
  }, [cards]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const tick = now();
      setTimeTick(tick);
      if (!isTimerPaused) {
        setTempCards((previous) => removeExpiredTempCards(previous, tick));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isTimerPaused]);

  const effectiveTimeTick = isTimerPaused && timerPausedAt ? timerPausedAt : timeTick;
  const activeTempCards = useMemo(() => removeExpiredTempCards(tempCards, effectiveTimeTick), [tempCards, effectiveTimeTick]);
  const tags = useMemo(() => ["todos", ...Array.from(new Set(cards.map((card) => card.tag || "geral"))).sort()], [cards]);
  const filteredCards = useMemo(() => filter === "todos" ? cards : cards.filter((card) => card.tag === filter), [cards, filter]);
  const filteredStudyCards = useMemo(() => filteredCards.filter((card) => !card.isHard), [filteredCards]);
  const filteredTempCards = useMemo(() => filter === "todos" ? activeTempCards : activeTempCards.filter((card) => card.tag === filter), [activeTempCards, filter]);
  const studyCards = useMemo(() => [...filteredTempCards, ...filteredStudyCards], [filteredTempCards, filteredStudyCards]);

  const dueCards = useMemo(() => {
    return studyCards.filter((card) => card.dueAt <= now()).sort((a, b) => {
      if (a.temporary && !b.temporary) return -1;
      if (!a.temporary && b.temporary) return 1;
      const adaptivePriority = (b.reviewBurden || 0) - (a.reviewBurden || 0);
      if (adaptivePriority !== 0) return adaptivePriority;
      const errorPriority = (b.wrong || 0) - (a.wrong || 0);
      if (errorPriority !== 0) return errorPriority;
      return a.dueAt - b.dueAt;
    });
  }, [studyCards]);

  const errorCards = useMemo(() => cards.filter((card) => card.wrong > 0).sort((a, b) => b.wrong - a.wrong), [cards]);
  const current = dueCards[0] || null;

  const stats = useMemo(() => {
    const totalReviews = cards.reduce((sum, card) => sum + card.reviews, 0);
    const totalWrong = cards.reduce((sum, card) => sum + card.wrong, 0);
    const due = cards.filter((card) => !card.isHard && card.dueAt && card.dueAt <= now()).length + activeTempCards.length;
    const newCards = cards.filter((card) => !card.reviews).length;
    const accuracy = totalReviews ? Math.round(((totalReviews - totalWrong) / totalReviews) * 100) : 0;
    return { total: cards.length, due, newCards, totalWrong, accuracy };
  }, [cards, activeTempCards]);

  const rawDisplayCard = globalOverlayCard || reviewedCard || current;
  const displayCard = studyStarted ? rawDisplayCard : null;
  const displayQuestionKey = displayCard ? `${displayCard.id}-${displayCard.generatedKind || "normal"}-${displayCard.sourceHardCardId || ""}` : null;

  useEffect(() => {
    if (!studyStarted || selected !== null || !displayQuestionKey || !displayCard) return;
    if (activeQuestionId === displayQuestionKey) return;

    const startedAt = now();
    setActiveQuestionId(displayQuestionKey);
    setQuestionStartedAt(startedAt);

    if (displayCard.temporary && !displayCard.expiresAt) {
      setTempCards((previous) => previous.map((card) => card.id === displayCard.id ? activateTemporaryCard(card, startedAt) : card));
    }
  }, [studyStarted, selected, displayQuestionKey, displayCard, activeQuestionId]);

  const normalQuestionRemaining = questionStartedAt ? Math.max(0, NORMAL_QUESTION_MS - (effectiveTimeTick - questionStartedAt)) : NORMAL_QUESTION_MS;
  const normalQuestionPercent = questionStartedAt ? getTimerPercent(questionStartedAt, NORMAL_QUESTION_MS, effectiveTimeTick) : 100;
  const hasAnswered = selected !== null && Boolean(displayCard);
  const shouldShowNormalTimer = displayCard && !hasAnswered && !displayCard.temporary && displayCard.generatedKind !== "hardReview";
  const wasCorrect = hasAnswered && displayCard ? selected === displayCard.answer : false;

  function startStudy() {
    setIsTimerPaused(false);
    setTimerPausedAt(null);
    setStudyStarted(true);
    setSelected(null);
    setReviewedCard(null);
    setGlobalOverlayCard(null);
    setPendingHardCard(null);
    setActiveQuestionId(null);
    setQuestionStartedAt(null);
    setTab("estudar");
    setTempCards((previous) => removeExpiredTempCards(previous));
  }

  function clearAnswerState() {
    setIsTimerPaused(false);
    setTimerPausedAt(null);
    setSelected(null);
    setReviewedCard(null);
    setActiveQuestionId(null);
    setQuestionStartedAt(null);

    if (pendingHardCard) {
      setGlobalOverlayCard(pendingHardCard);
      setPendingHardCard(null);
    } else {
      setGlobalOverlayCard(null);
    }

    setTempCards((previous) => removeExpiredTempCards(previous));
  }

  function resetHardWindow() {
    setIsTimerPaused(false);
    setTimerPausedAt(null);
    setActiveQuestionId(null);
    setQuestionStartedAt(now());
  }

  function toggleTimerPause() {
    if (!displayCard || selected !== null || !questionStartedAt) return;

    if (!isTimerPaused) {
      setTimerPausedAt(now());
      setIsTimerPaused(true);
      return;
    }

    const resumedAt = now();
    const pausedFor = Math.max(0, resumedAt - (timerPausedAt || resumedAt));

    setQuestionStartedAt((previous) => previous ? previous + pausedFor : previous);

    if (displayCard.temporary && displayCard.expiresAt) {
      setTempCards((previous) => previous.map((card) => card.id === displayCard.id ? {
        ...card,
        activatedAt: card.activatedAt ? card.activatedAt + pausedFor : card.activatedAt,
        createdAt: card.createdAt ? card.createdAt + pausedFor : card.createdAt,
        dueAt: card.dueAt ? card.dueAt + pausedFor : card.dueAt,
        expiresAt: card.expiresAt ? card.expiresAt + pausedFor : card.expiresAt,
        updatedAt: resumedAt
      } : card));
    }

    setTimerPausedAt(null);
    setIsTimerPaused(false);
    setTimeTick(resumedAt);
  }

  function invokeGlobalTimerQuestion() {
    const baseCard = lastAnsweredCard || reviewedCard || current;

    if (!baseCard) {
      resetHardWindow();
      setMessage("Responda ao menos uma questão para o temporizador buscar uma questão difícil vinculada.");
      return;
    }

    const hardCard = findHardQuestionForBase(cards, baseCard);

    if (!hardCard) {
      resetHardWindow();
      setMessage(`Nenhuma questão difícil vinculada a "${baseCard.tag}" foi encontrada. Adicione uma questão manual com [dificil]sim[/dificil] e [vinculo]${baseCard.tag}[/vinculo].`);
      return;
    }

    const overlayCard = createHardOverlayCard(hardCard, baseCard);
    setGlobalOverlayCard(overlayCard);
    setPendingHardCard(null);
    setSelected(null);
    setReviewedCard(null);
    setTab("estudar");
    resetHardWindow();
    setMessage("Questão difícil vinculada encontrada. O contador foi reiniciado.");
  }

  function answerCurrent(value) {
    const targetCard = globalOverlayCard || current;
    if (!targetCard || selected !== null) return;

    const answerReferenceTime = isTimerPaused && timerPausedAt ? timerPausedAt : now();
    const responseMs = answerReferenceTime - (questionStartedAt || answerReferenceTime);
    setIsTimerPaused(false);
    setTimerPausedAt(null);
    const answeredFast = responseMs <= HARD_TRIGGER_MS;
    const updated = gradeCard(targetCard, value, responseMs);
    const wasAnswerCorrect = value === targetCard.answer;

    setSelected(value);
    setReviewedCard(updated);
    setLastAnsweredCard(updated);

    if (globalOverlayCard) {
      if (globalOverlayCard.sourceHardCardId) {
        const savedHardCard = {
          ...updated,
          generatedKind: null,
          sourceHardCardId: null,
          temporary: false,
          expiresAt: null,
          originId: globalOverlayCard.originId || updated.originId,
          dueAt: null,
          intervalMs: 0
        };
        setCards((previous) => previous.map((card) => card.id === globalOverlayCard.sourceHardCardId ? savedHardCard : card));
      }

      if (!wasAnswerCorrect) {
        const simplified = createSimplifiedCard(updated);
        if (simplified) {
          setTempCards((previous) => [simplified, ...removeExpiredTempCards(previous)]);
        }
      }
      return;
    }

    if (current.temporary) {
      setTempCards((previous) => {
        const stillValid = removeExpiredTempCards(previous).filter((card) => card.id !== current.id);
        const shouldContinueSimplification = current.generatedKind === "simplified";
        const shouldCreateSimplification = shouldContinueSimplification || !wasAnswerCorrect;
        if (!shouldCreateSimplification) return stillValid;

        const simplified = createSimplifiedCard(updated);
        return simplified ? [simplified, ...stillValid] : stillValid;
      });
      return;
    }

    setCards((previous) => previous.map((card) => card.id === current.id ? updated : card));

    if (!wasAnswerCorrect) {
      const simplified = createSimplifiedCard(updated);
      if (simplified) {
        setTempCards((previous) => [simplified, ...removeExpiredTempCards(previous)]);
      } else {
        setMessage("Limite de 3 simplificações atingido para esta questão.");
      }
      return;
    }

    if (answeredFast) {
      const hardCard = findHardQuestionForBase(cards, updated);
      if (hardCard) {
        setPendingHardCard(createHardOverlayCard(hardCard, updated));
        setMessage("Você respondeu antes de 5 segundos. A próxima questão será a difícil vinculada.");
      }
    }
  }

  function handleGenerateRelatedQuestion() {
    setIsTimerPaused(false);
    setTimerPausedAt(null);
    const baseCard = reviewedCard || globalOverlayCard || current;
    if (!baseCard) return;
    const related = createRelatedCard(baseCard);
    setTempCards((previous) => [related, ...removeExpiredTempCards(previous)]);
    setMessage("Treino extra temporário criado em tempo real. Ele expira em 1 minuto.");
    setSelected(null);
    setReviewedCard(null);
    setGlobalOverlayCard(null);
    setActiveQuestionId(null);
    setQuestionStartedAt(null);
  }

  function handleImport() {
    const parsed = parseCards(importText, importTag);
    if (!parsed.length) {
      setMessage("Não encontrei itens válidos. Use JSON, Afirmação/Gabarito ou o formato com barras verticais.");
      return;
    }
    setCards((previous) => [...parsed, ...previous]);
    setImportText("");
    setMessage(`${parsed.length} questão(ões) importada(s).`);
    setTab("estudar");
    clearAnswerState();
  }

  function handleManualAdd() {
    const parsed = parseAnnotatedManualBatch(manualText, "geral");
    const parsedCards = parsed && Array.isArray(parsed.cards) ? parsed.cards : [];

    if (!parsedCards.length || !parsedCards.some((card) => card.statement)) {
      setMessage("Não consegui identificar questões. Use o botão Instrução para copiar o modelo correto e separe cada conjunto com [questao]...[/questao].");
      return;
    }

    setCards((previous) => [...parsedCards, ...previous]);
    setManualText("");

    const normalCount = parsedCards.filter((card) => !card.isHard).length;
    const hardCount = parsedCards.filter((card) => card.isHard).length;
    const simplificationCount = parsedCards.reduce((sum, card) => sum + (Array.isArray(card.simplifications) ? card.simplifications.length : 0), 0);
    setMessage(`${normalCount} questão(ões) adicionada(s), com ${simplificationCount} simplificação(ões) e ${hardCount} questão(ões) difícil(is) vinculada(s).`);
  }

  function resetSeed() {
    setIsTimerPaused(false);
    setTimerPausedAt(null);
    setCards(createSeedDeck());
    setTempCards([]);
    setStudyStarted(false);
    clearAnswerState();
    setMessage("Banco reiniciado com questões de certo ou errado.");
  }

  function removeCard(id) {
    setCards((previous) => previous.filter((card) => card.id !== id));
  }

  function markDue(id) {
    setCards((previous) => previous.map((card) => card.id === id ? { ...card, dueAt: now(), updatedAt: now() } : card));
  }

  function copyPrompt() {
    navigator.clipboard.writeText(aiPrompt);
    setMessage("Prompt copiado. Cole em uma IA, depois importe o JSON aqui.");
  }

  function copyManualInstructionPrompt() {
    navigator.clipboard.writeText(manualInstructionPrompt);
    setMessage("Instrução copiada. Cole em uma IA para gerar blocos compatíveis com o programa.");
  }

  return (
    <div className="min-h-screen text-slate-900 p-4 md:p-8 app-futuristic-bg relative overflow-hidden">
      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl bg-white/90 backdrop-blur shadow-sm border border-cyan-100/70 p-5 md:p-6 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(circle_at_12%_18%,rgba(34,211,238,0.18),transparent_26%),radial-gradient(circle_at_88%_80%,rgba(217,70,239,0.14),transparent_30%)]" />
          <div className="relative flex items-center justify-center">
            <AppLogo />
          </div>
        </header>

        <nav className="rounded-3xl bg-slate-950/75 backdrop-blur-xl border border-cyan-300/20 shadow-[0_0_24px_rgba(34,211,238,0.12)] p-2 md:p-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setShowAppGuide((value) => !value)}
              className={`group rounded-2xl px-4 py-3 text-sm font-black transition border ${showAppGuide ? "bg-indigo-500 text-white border-indigo-300 shadow-[0_0_18px_rgba(99,102,241,0.55)]" : "bg-white/10 text-cyan-50 border-white/10 hover:bg-indigo-500/25 hover:border-indigo-300/40"}`}
            >
              <span className="mr-2">⚙</span>{showAppGuide ? "Ocultar funções" : "Funções do app"}
            </button>

            {[["estudar", "▶", "Estudar"], ["importar", "⬆", "Importar"], ["erros", "✕", "Erros"], ["baralho", "▣", "Questões"]].map(([key, icon, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setTab(key); clearAnswerState(); if (key !== "estudar") setStudyStarted(false); }}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition border ${tab === key ? "bg-cyan-400 text-slate-950 border-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.55)]" : "bg-white/10 text-slate-100 border-white/10 hover:bg-cyan-400/20 hover:border-cyan-300/40"}`}
              >
                <span className="mr-2">{icon}</span>{label}
              </button>
            ))}
          </div>
        </nav>

        {showAppGuide && <AppGuidePanel />}

        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Questões" value={stats.total} />
          <Stat label="Para revisar" value={stats.due} />
          <Stat label="Novas" value={stats.newCards} />
          <Stat label="Erros" value={stats.totalWrong} />
          <Stat label="Acerto" value={`${stats.accuracy}%`} />
        </section>

        {message && (
          <div className="rounded-2xl bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-3">
            <span>{message}</span>
            <button onClick={() => setMessage("")} className="text-sm underline">fechar</button>
          </div>
        )}

        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <label htmlFor="tag-filter" className="text-sm font-bold text-slate-600">Filtrar por tema</label>
          <select
            id="tag-filter"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              clearAnswerState();
              setStudyStarted(false);
            }}
            className="input sm:max-w-sm font-semibold cursor-pointer"
          >
            {tags.map((tag) => (
              <option key={tag} value={tag}>{tag === "todos" ? "Todos os temas" : tag}</option>
            ))}
          </select>
        </div>

        {tab === "estudar" && (
          <main className="grid md:grid-cols-[1fr_340px] gap-5">
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 md:p-8 min-h-[470px] flex flex-col">
              {!studyStarted ? (
                <StartStudyScreen dueCount={dueCards.length} onStart={startStudy} />
              ) : displayCard ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{displayCard.tag}</span>
                        {displayCard.generatedKind === "hardReview" && <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">questão difícil vinculada</span>}
                        {displayCard.temporary && displayCard.expiresAt && <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">temporária · expira em {formatCountdown(displayCard.expiresAt, effectiveTimeTick)}</span>}
                      </div>
                      <p className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500">Julgue a afirmação</p>
                      <h2 className="text-2xl md:text-3xl font-bold mt-2 leading-tight">{displayCard.statement}</h2>
                      {shouldShowNormalTimer && <NormalQuestionTimer remaining={normalQuestionRemaining} percent={normalQuestionPercent} onClick={invokeGlobalTimerQuestion} />}
                      {displayCard.temporary && displayCard.expiresAt && <TempTimer card={displayCard} referenceTime={effectiveTimeTick} isPaused={isTimerPaused} />}
                      {!hasAnswered && (shouldShowNormalTimer || (displayCard.temporary && displayCard.expiresAt)) && (
                        <TimerPauseButton isPaused={isTimerPaused} onClick={toggleTimerPause} />
                      )}
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div>Erros: <b>{displayCard.wrong || 0}</b></div>
                      <div>Sequência: <b>{displayCard.streak || 0}</b></div>
                      <div>Prioridade: <b>{(displayCard.reviewBurden || 0).toFixed(1)}</b></div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ChoiceButton disabled={hasAnswered} active={selected === true} onClick={() => answerCurrent(true)} title="Certo" />
                    <ChoiceButton disabled={hasAnswered} active={selected === false} onClick={() => answerCurrent(false)} title="Errado" />
                  </div>

                  <div className="mt-8 flex-1">
                    {!hasAnswered ? (
                      <div className="rounded-3xl border-2 border-dashed border-slate-300 p-8 text-slate-500 text-center">Escolha <b>Certo</b> ou <b>Errado</b> para liberar o feedback.</div>
                    ) : (
                      <div className={`rounded-3xl border p-6 ${wasCorrect ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <p className={`text-xl font-black ${wasCorrect ? "text-emerald-800" : "text-rose-800"}`}>{wasCorrect ? "Você acertou." : "Você errou."}</p>
                          <p className="text-sm font-bold text-slate-700">Gabarito: {displayCard.answer ? "Certo" : "Errado"}</p>
                        </div>
                        {displayCard.lastReviewClass && <ReviewClassification card={displayCard} />}
                        <div className="mt-5 grid md:grid-cols-2 gap-4">
                          <FeedbackBox title="Curiosidade da questão" text={displayCard.curiosity} />
                          <FeedbackBox title="Explicação" text={displayCard.explanationText} />
                        </div>
                        <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <p className="text-sm text-slate-600">
                            {displayCard.isHard || displayCard.generatedKind === "hardReview" ? (
                              <>Questão difícil: <b>sem data de revisão; aparece apenas por evento</b></>
                            ) : (
                              <>Próxima revisão: <b>{displayCard.temporary ? `expira em ${formatCountdown(displayCard.expiresAt, effectiveTimeTick)}` : formatWhen(displayCard.dueAt)}</b></>
                            )}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button onClick={handleGenerateRelatedQuestion} className="rounded-2xl bg-slate-100 text-slate-800 px-5 py-3 font-bold hover:bg-slate-200">Criar treino extra temporário</button>
                            <button type="button" onClick={clearAnswerState} className="rounded-2xl bg-slate-900 text-white px-5 py-3 font-bold hover:bg-slate-700">
                              {pendingHardCard ? "Próxima questão difícil" : "Próxima questão"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="text-6xl">✓</div>
                  <h2 className="text-3xl font-bold mt-4">Nada pendente agora</h2>
                  <p className="text-slate-600 mt-2 max-w-md">Você revisou tudo que estava vencido. Use Importar para colocar novos itens ou force revisão em alguma questão.</p>
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <section key={`how-it-works-${howItWorksPulseKey}`} className={`rounded-3xl bg-white border border-slate-200 shadow-sm p-5 ${howItWorksPulseKey > 0 ? "how-it-works-neon-box" : ""}`}>
                <button
                  type="button"
                  onClick={() => setHowItWorksPulseKey((value) => value + 1)}
                  className="text-xl font-bold mb-4 text-left hover:text-slate-600 transition cursor-pointer"
                  title="Clique para piscar a caixa Como funciona"
                >
                  Como funciona
                </button>
                <p className="text-sm text-slate-600 leading-relaxed">O app usa revisão espaçada adaptativa. Quando você erra, a questão volta mais cedo, ganha prioridade e pode iniciar até 3 simplificações complementares. Quando você acerta, o intervalo aumenta conforme sequência de acertos, dificuldade acumulada e velocidade da resposta. Acerto antes de 5 segundos pode chamar a questão difícil vinculada.</p>
              </section>
            </aside>
          </main>
        )}

        {tab === "importar" && (
          <main className="max-w-3xl mx-auto">
            <Panel title="Adicionar manualmente">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-slate-600">Use o botão Instrução para copiar o prompt completo, cole em uma IA e depois cole aqui um ou vários blocos gerados.</p>
                  <button onClick={() => setShowManualInstructions((value) => !value)} className="rounded-2xl bg-slate-100 text-slate-800 px-4 py-2 text-sm font-bold hover:bg-slate-200">Instrução</button>
                </div>

                {showManualInstructions && (
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                    <p className="text-sm font-semibold text-slate-700">Prompt de instrução para gerar questões compatíveis com o programa</p>
                    <textarea readOnly value={manualInstructionPrompt} className="w-full min-h-[420px] rounded-2xl border border-slate-300 px-4 py-3 bg-white font-mono text-xs" />
                    <button onClick={copyManualInstructionPrompt} className="w-full rounded-2xl bg-slate-900 text-white py-3 font-bold hover:bg-slate-700">Copiar instrução</button>
                  </div>
                )}

                <textarea className="input min-h-[320px] font-mono text-sm" placeholder="Cole aqui um ou vários conjuntos gerados pela IA. Separe cada conjunto com [questao]...[/questao]." value={manualText} onChange={(event) => setManualText(event.target.value)} />
                <button onClick={handleManualAdd} className="w-full rounded-2xl bg-slate-900 text-white py-3 font-bold hover:bg-slate-700">Adicionar questão(ões)</button>
              </div>
            </Panel>
          </main>
        )}

        {tab === "erros" && (
          <main className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6">
            <h2 className="text-2xl font-bold">Caderno de erros</h2>
            <p className="text-slate-600 mb-5">Questões erradas aparecem primeiro nas revisões.</p>
            {errorCards.length ? (
              <div className="grid md:grid-cols-2 gap-4">
                {errorCards.map((card) => (
                  <div key={card.id} className="rounded-3xl bg-slate-50 border border-slate-200 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">{card.tag}</span>
                      <span className="text-sm font-bold text-slate-700">{card.wrong} erro(s)</span>
                    </div>
                    <h3 className="font-bold text-lg mt-4">{card.statement}</h3>
                    <p className="text-sm text-slate-600 mt-2">Gabarito: <b>{card.answer ? "Certo" : "Errado"}</b></p>
                    <p className="text-slate-700 mt-2 whitespace-pre-wrap">{card.correctFeedback}</p>
                    <p className="text-sm text-slate-500 mt-2 whitespace-pre-wrap">{card.wrongFeedback}</p>
                    <p className="text-xs text-slate-500 mt-2">Fase: <b>{card.reviewStage || "aprendizagem"}</b> · Prioridade adaptativa: <b>{(card.reviewBurden || 0).toFixed(1)}</b></p>
                    <div className="mt-4 text-xs text-slate-500">{card.isHard ? "Questão difícil: aparece apenas por evento" : `Próxima revisão: ${formatWhen(card.dueAt)}`}</div>
                    <button onClick={() => markDue(card.id)} className="mt-3 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-bold">Revisar agora</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-slate-50 border border-slate-200 p-10 text-center text-slate-600">Nenhum erro registrado ainda.</div>
            )}
          </main>
        )}

        {tab === "baralho" && (
          <main className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-2xl font-bold">Todas as questões</h2>
                <p className="text-slate-600">Gerencie, force revisão ou apague itens.</p>
              </div>
              <button onClick={resetSeed} className="rounded-2xl bg-slate-100 text-slate-800 px-4 py-2 font-bold hover:bg-slate-200">Reiniciar tema inicial</button>
            </div>
            <div className="space-y-3">
              {filteredCards.map((card) => (
                <div key={card.id} className="rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-500">
                      {card.tag} · {card.isHard ? `difícil vinculada a: ${card.relatedTo} · sem data de revisão · ` : ""}gabarito: {card.answer ? "Certo" : "Errado"} · {card.reviewStage ? `fase: ${card.reviewStage} · ` : ""}{card.reviewBurden ? `prioridade: ${card.reviewBurden.toFixed(1)} · ` : ""}{card.lastReviewClass ? `classe: ${card.lastReviewClass} · ` : ""}{!card.isHard ? `próxima: ${formatWhen(card.dueAt)} · ` : ""}última: {formatDateTime(card.lastReviewedAt)}
                    </div>
                    <div className="font-bold mt-1">{card.statement}</div>
                    <div className="text-sm text-slate-600 mt-1 line-clamp-2">{card.correctFeedback}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => markDue(card.id)} className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm font-bold">Revisar</button>
                    <button onClick={() => removeCard(card.id)} className="rounded-xl bg-slate-100 text-slate-700 px-3 py-2 text-sm font-bold">Apagar</button>
                  </div>
                </div>
              ))}
            </div>
          </main>
        )}
      </div>
      <style>{`.app-futuristic-bg { background: radial-gradient(circle at 8% 10%, rgba(37, 99, 235, 0.42), transparent 28%), radial-gradient(circle at 92% 88%, rgba(217, 70, 239, 0.36), transparent 30%), radial-gradient(circle at 70% 12%, rgba(6, 182, 212, 0.24), transparent 24%), linear-gradient(135deg, #020617 0%, #07112e 38%, #111047 68%, #020617 100%); isolation: isolate; } .app-futuristic-bg::before { content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.78; background-image: linear-gradient(115deg, transparent 0 12%, rgba(59, 130, 246, 0.16) 12.2%, transparent 12.7% 44%, rgba(168, 85, 247, 0.18) 44.2%, transparent 44.8% 100%), linear-gradient(65deg, transparent 0 28%, rgba(14, 165, 233, 0.13) 28.2%, transparent 29% 72%, rgba(236, 72, 153, 0.14) 72.2%, transparent 73% 100%), radial-gradient(circle at 0% 0%, transparent 0 23%, rgba(59, 130, 246, 0.34) 23.2%, transparent 24.1% 100%), radial-gradient(circle at 100% 100%, transparent 0 24%, rgba(217, 70, 239, 0.34) 24.2%, transparent 25.1% 100%); } .app-futuristic-bg::after { content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.42; background-image: linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px), radial-gradient(circle, rgba(125, 211, 252, 0.28) 1px, transparent 1.4px); background-size: 58px 58px, 58px 58px, 24px 24px; mask-image: radial-gradient(circle at center, black 0 72%, transparent 100%); } .input { width: 100%; border-radius: 1rem; border: 1px solid rgb(203 213 225); padding: 0.75rem 1rem; background: white; } @keyframes howItWorksNeonBox { 0%, 8% { border-color: #a855f7; box-shadow: 0 0 8px #a855f7, 0 0 22px #a855f7, 0 0 42px rgba(168, 85, 247, 0.95); background: linear-gradient(135deg, rgba(168, 85, 247, 0.16), #fff); } 9%, 16% { box-shadow: 0 0 2px rgba(15, 23, 42, 0.12); } 17%, 25% { border-color: #ff0033; box-shadow: 0 0 8px #ff0033, 0 0 24px #ff0033, 0 0 48px rgba(255, 0, 51, 0.95); background: linear-gradient(135deg, rgba(255, 0, 51, 0.14), #fff); } 26%, 33% { box-shadow: 0 0 2px rgba(15, 23, 42, 0.12); } 34%, 42% { border-color: #ff2bd6; box-shadow: 0 0 8px #ff2bd6, 0 0 24px #ff2bd6, 0 0 48px rgba(255, 43, 214, 0.95); background: linear-gradient(135deg, rgba(255, 43, 214, 0.14), #fff); } 43%, 50% { box-shadow: 0 0 2px rgba(15, 23, 42, 0.12); } 51%, 59% { border-color: #00b7ff; box-shadow: 0 0 8px #00b7ff, 0 0 24px #00b7ff, 0 0 48px rgba(0, 183, 255, 0.95); background: linear-gradient(135deg, rgba(0, 183, 255, 0.14), #fff); } 60%, 67% { box-shadow: 0 0 2px rgba(15, 23, 42, 0.12); } 68%, 76% { border-color: #b45309; box-shadow: 0 0 8px #b45309, 0 0 24px #b45309, 0 0 48px rgba(180, 83, 9, 0.9); background: linear-gradient(135deg, rgba(180, 83, 9, 0.14), #fff); } 77%, 84% { box-shadow: 0 0 2px rgba(15, 23, 42, 0.12); } 85%, 100% { border-color: #39ff14; box-shadow: 0 0 8px #39ff14, 0 0 24px #39ff14, 0 0 52px rgba(57, 255, 20, 0.95); background: linear-gradient(135deg, rgba(57, 255, 20, 0.13), #fff); } } .how-it-works-neon-box { animation: howItWorksNeonBox 6s steps(1, end) 1; } .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; } @keyframes timerFlashBlue { 0%, 100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); } 35% { box-shadow: 0 0 0 5px rgba(14, 165, 233, 0.35); } 70% { box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2); } } @keyframes timerFlashRed { 0%, 100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); } 35% { box-shadow: 0 0 0 5px rgba(244, 63, 94, 0.35); } 70% { box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.2); } } .timer-flash-blue { animation: timerFlashBlue 1s ease-in-out; } .timer-flash-red { animation: timerFlashRed 1s ease-in-out; } .w-22 { width: 5.5rem; } .h-18 { height: 4.5rem; }`}</style>
    </div>
  );
}

function AppLogo() {
  return (
    <div className="relative w-36 h-28 md:w-44 md:h-32 flex items-center justify-center" aria-label="Símbolo do app">
      <div className="absolute inset-3 rounded-[2rem] bg-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.38),0_0_48px_rgba(217,70,239,0.28)] border border-cyan-300/50 rotate-[-2deg]" />
      <div className="absolute inset-5 rounded-[1.7rem] border border-fuchsia-400/40 shadow-[inset_0_0_24px_rgba(59,130,246,0.35)]" />
      <div className="absolute w-24 h-24 md:w-28 md:h-28 rounded-full border-[7px] border-cyan-300/80 border-b-fuchsia-400/80 border-l-fuchsia-400/80 shadow-[0_0_22px_rgba(34,211,238,0.55)]" />
      <div className="absolute top-6 right-8 w-0 h-0 border-y-[10px] border-y-transparent border-l-[18px] border-l-cyan-200 drop-shadow-[0_0_9px_rgba(103,232,249,0.9)]" />
      <div className="absolute bottom-6 left-8 w-0 h-0 border-y-[10px] border-y-transparent border-r-[18px] border-r-fuchsia-200 drop-shadow-[0_0_9px_rgba(244,114,182,0.9)]" />

      <div className="relative z-10 flex items-center justify-center">
        <div className="absolute translate-x-5 translate-y-1 w-20 h-14 md:w-24 md:h-16 rounded-2xl bg-fuchsia-400 shadow-[0_0_18px_rgba(217,70,239,0.65)] rotate-6" />
        <div className="absolute translate-x-2 w-20 h-14 md:w-24 md:h-16 rounded-2xl bg-blue-500 shadow-[0_0_18px_rgba(59,130,246,0.65)] rotate-2" />
        <div className="relative w-22 h-16 md:w-28 md:h-18 rounded-2xl bg-white shadow-[0_12px_30px_rgba(15,23,42,0.28),0_0_18px_rgba(255,255,255,0.8)] -rotate-3 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center justify-center gap-1">
            <div className="w-0 h-0 border-y-[11px] border-y-transparent border-l-[18px] border-l-cyan-500" />
            <div className="w-0 h-0 border-y-[11px] border-y-transparent border-l-[18px] border-l-blue-600" />
          </div>
          <div className="w-12 h-1.5 rounded-full bg-slate-300/80" />
          <div className="w-9 h-1.5 rounded-full bg-slate-300/70" />
        </div>
      </div>

      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950 border border-fuchsia-400 shadow-[0_0_16px_rgba(217,70,239,0.75)] flex items-center justify-center text-fuchsia-300 text-2xl font-black">×</div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950 border border-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.75)] flex items-center justify-center text-cyan-200 text-2xl font-black">✓</div>
      <div className="absolute top-4 left-8 w-1.5 h-1.5 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />
      <div className="absolute bottom-4 right-8 w-1.5 h-1.5 rounded-full bg-fuchsia-200 shadow-[0_0_10px_rgba(244,114,182,0.9)]" />
    </div>
  );
}

function AppGuidePanel() {
  return (
    <section className="rounded-3xl bg-white border border-indigo-100 shadow-sm p-6 md:p-7">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-indigo-700">Guia detalhado</p>
          <h2 className="text-2xl md:text-3xl font-black mt-1">Funções, tempos e revisão espaçada</h2>
          <p className="text-slate-600 mt-2 max-w-3xl">Este painel resume as regras usadas durante o estudo, importação, revisão adaptativa, questões difíceis, simplificações e prazos-base do sistema.</p>
        </div>
        <div className="rounded-2xl bg-indigo-50 text-indigo-900 px-4 py-3 text-sm font-bold">Timer normal: 1 minuto</div>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <GuideItem title="Início do estudo" text="As questões só aparecem depois do botão de play. O timer da primeira questão começa apenas quando o estudo é iniciado, e o timer das próximas só começa quando a próxima questão entra na tela." />
        <GuideItem title="Questão normal" text="Cada questão normal tem 1 minuto contado a partir da entrada dela na tela. A barra fica verde até 5s, azul de 5s até 45s e vermelha de 45s até 1min. O botão Pausar timer congela essa contagem enquanto você pensa." />
        <GuideItem title="Questão difícil vinculada" text="Se a questão normal for respondida corretamente em até 5 segundos, a próxima questão pode ser a difícil vinculada. Ela não tem data de revisão e só aparece por evento." />
        <GuideItem title="Simplificações" text="Ao errar uma questão normal, o app inicia até 3 simplificações complementares. Depois que a sequência começa, elas aparecem uma seguida da outra, mesmo se a simplificação anterior for acertada." />
        <GuideItem title="Questões temporárias" text="Simplificações e treinos extras temporários ficam em espera até aparecerem na tela. O prazo de 1 minuto só começa quando você chega nelas e também pode ser pausado pelo botão Pausar timer." />
        <GuideItem title="Treino extra temporário" text="O botão Criar treino extra temporário gera uma questão relacionada ao tema da questão atual ou recém-respondida. Ela só começa a expirar quando você entra nela e respeita a pausa do timer." />
        <GuideItem title="Importar" text="A aba Importar usa apenas Adicionar manualmente. O botão Instrução abre um prompt completo para copiar, colar em uma IA e gerar blocos compatíveis com o app." />
        <GuideItem title="Curiosidade e explicação" text="Cada questão pode alimentar duas caixas: Curiosidade da questão e Explicação. A curiosidade traz um detalhe útil sobre o tema; a explicação confirma o gabarito, justificando por que a afirmação está certa ou errada." />
        <GuideItem title="Filtro por tema" text="A cortina de filtro escolhe o tema estudado. Ao mudar o filtro, o app volta para a tela de play para iniciar uma nova sessão corretamente." />
        <GuideItem title="Caderno de erros" text="A aba Erros mostra questões com erro registrado, fase da memória, prioridade adaptativa e botão para revisar agora." />
      </div>

      <div className="mt-7 rounded-3xl bg-slate-50 border border-slate-200 p-5">
        <h3 className="text-xl font-black text-slate-900">Como funciona a revisão espaçada adaptativa</h3>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">O app não usa um prazo fixo para todas as questões. Ele calcula a próxima revisão combinando resultado, sequência de acertos, histórico de erros, velocidade da resposta, dificuldade acumulada, força de memória e prioridade adaptativa.</p>

        <div className="mt-5 grid md:grid-cols-2 gap-4">
          <GuideItem title="Quando erra" text="A questão entra em reaprendizagem, ganha +2 de prioridade adaptativa, perde força de memória, fica mais difícil e volta em poucos minutos." />
          <GuideItem title="Quando acerta" text="A questão ganha força de memória, perde prioridade de erro, fica um pouco mais fácil e o intervalo aumenta conforme a sequência de acertos." />
          <GuideItem title="Prioridade adaptativa" text="Na fila de estudo, questões temporárias aparecem primeiro. Depois, o app prioriza as vencidas com maior prioridade adaptativa e maior histórico de erros." />
          <GuideItem title="Limites do algoritmo" text="O intervalo mínimo prático após consolidação é de 6 horas e o intervalo máximo é de 120 dias. Após erro, o intervalo fica entre aproximadamente 3 e 30 minutos." />
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-3 bg-slate-100 text-xs font-black uppercase text-slate-600">
            <div className="p-3">Situação</div>
            <div className="p-3">Prazo-base</div>
            <div className="p-3">Ajuste aplicado</div>
          </div>
          <ReviewRuleRow situation="1º erro" base="20 min" adjust="Pode cair até perto de 3 min se a dificuldade estiver alta. Limite máximo após erro: 30 min." />
          <ReviewRuleRow situation="2º erro acumulado" base="10 min" adjust="O conteúdo volta mais cedo porque o app entende que ainda está instável." />
          <ReviewRuleRow situation="3º erro ou mais" base="5 min" adjust="Mantém o item em reaprendizagem forte até os acertos estabilizarem." />
          <ReviewRuleRow situation="1º acerto sem erro anterior" base="1 dia" adjust="Pode alongar com resposta rápida ou encurtar se a resposta for lenta." />
          <ReviewRuleRow situation="1º acerto após erro" base="12 h" adjust="Cresce com cautela por causa do histórico de erro. Pode ser reduzido pela pressão de erro." />
          <ReviewRuleRow situation="2 acertos seguidos" base="3 dias" adjust="Entra em consolidação e começa a espaçar mais." />
          <ReviewRuleRow situation="3 acertos seguidos" base="7 dias" adjust="Mantém consolidação e aumenta a confiança de memória." />
          <ReviewRuleRow situation="4 acertos ou mais" base="intervalo anterior × facilidade" adjust="Pode entrar em manutenção. A facilidade varia de 1,3 a 3,4; o teto geral é 120 dias." />
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-3 bg-indigo-50 text-xs font-black uppercase text-indigo-800">
            <div className="p-3">Tempo de resposta</div>
            <div className="p-3">Classificação</div>
            <div className="p-3">Multiplicador</div>
          </div>
          <ReviewRuleRow situation="até 5s" base="Domínio rápido" adjust="Multiplica o intervalo por 1,45 e pode acionar a questão difícil vinculada." />
          <ReviewRuleRow situation="até 15s" base="Revisão rápida" adjust="Multiplica o intervalo por 1,20." />
          <ReviewRuleRow situation="até 45s" base="Revisão normal" adjust="Mantém o multiplicador em 1,00." />
          <ReviewRuleRow situation="após 45s" base="Revisão lenta" adjust="Reduz o intervalo com multiplicador 0,75, mesmo quando a resposta está correta." />
        </div>

        <div className="mt-5 rounded-2xl bg-white border border-slate-200 p-4">
          <h4 className="font-black text-slate-900">Fórmula simplificada do próximo prazo</h4>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">No acerto, o app parte do prazo-base da sequência e aplica: velocidade da resposta, pressão de erro e força de memória. A pressão de erro reduz o intervalo quando há muitos erros, lapsos ou prioridade acumulada. A força de memória aumenta o intervalo quando o usuário acerta com consistência.</p>
          <p className="text-xs font-mono bg-slate-100 rounded-xl p-3 mt-3 text-slate-700">próximo prazo = prazo-base × multiplicador de velocidade × redução por erros × bônus de força de memória</p>
        </div>
      </div>
    </section>
  );
}

function ReviewRuleRow({ situation, base, adjust }) {
  return (
    <div className="grid grid-cols-3 border-t border-slate-200 text-sm">
      <div className="p-3 font-bold text-slate-900">{situation}</div>
      <div className="p-3 text-slate-700">{base}</div>
      <div className="p-3 text-slate-600">{adjust}</div>
    </div>
  );
}

function GuideItem({ title, text }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
      <h3 className="font-black text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 mt-1 leading-relaxed">{text}</p>
    </div>
  );
}

function StartStudyScreen({ dueCount, onStart }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <button
        onClick={onStart}
        aria-label="Iniciar estudo"
        title="Iniciar estudo"
        className="rounded-full bg-slate-900 text-white w-24 h-24 flex items-center justify-center text-4xl font-black shadow-sm hover:bg-slate-700 transition hover:scale-105"
      >
        ▶
      </button>
      <h2 className="text-3xl font-bold mt-5">Preparar estudo</h2>
      <p className="text-slate-600 mt-2 max-w-md">
        Toque no play para começar. Nenhum timer começa antes de a questão aparecer na tela.
      </p>
      <p className="text-sm font-semibold text-slate-500 mt-3">Questões disponíveis agora: {dueCount}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-slate-500 font-semibold">{label}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function ChoiceButton({ title, onClick, disabled, active }) {
  const isCorrectChoice = title === "Certo";
  const activeClass = isCorrectChoice
    ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200"
    : "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200";
  const idleClass = isCorrectChoice
    ? "bg-slate-50 border-slate-200 text-slate-900 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-200/80 hover:ring-2 hover:ring-emerald-300/70"
    : "bg-slate-50 border-slate-200 text-slate-900 hover:bg-rose-50 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-200/80 hover:ring-2 hover:ring-rose-300/70";

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-3xl p-6 text-left border transition-all duration-200 ${active ? activeClass : idleClass} disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:ring-0`}
    >
      <div className="text-2xl font-black">{title}</div>
      <div className={`text-sm mt-1 ${active ? "text-white/80" : "text-slate-500"}`}>Clique para responder</div>
    </button>
  );
}

function FeedbackBox({ title, text }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4">
      <p className="text-sm font-bold text-slate-500 uppercase">{title}</p>
      <p className="mt-2 text-slate-700 whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function NormalQuestionTimer({ remaining, percent, onClick }) {
  const elapsed = Math.max(0, NORMAL_QUESTION_MS - remaining);
  const hardRemaining = Math.max(0, HARD_TRIGGER_MS - elapsed);
  const blueLimitMs = 45 * 1000;
  const stage = elapsed <= HARD_TRIGGER_MS ? "green" : elapsed <= blueLimitMs ? "blue" : "red";
  const barClass = stage === "green" ? "bg-emerald-500" : stage === "blue" ? "bg-sky-500" : "bg-rose-500";
  const borderClass = stage === "green" ? "border-emerald-200 bg-emerald-50" : stage === "blue" ? "border-sky-200 bg-sky-50" : "border-rose-200 bg-rose-50";
  const textClass = stage === "green" ? "text-emerald-800" : stage === "blue" ? "text-sky-800" : "text-rose-800";
  const justChangedToBlue = elapsed >= HARD_TRIGGER_MS && elapsed < HARD_TRIGGER_MS + 1300;
  const justChangedToRed = elapsed >= blueLimitMs && elapsed < blueLimitMs + 1300;
  const flashClass = justChangedToBlue ? "timer-flash-blue" : justChangedToRed ? "timer-flash-red" : "";
  const hardCheckpointPercent = ((NORMAL_QUESTION_MS - HARD_TRIGGER_MS) / NORMAL_QUESTION_MS) * 100;
  const redCheckpointPercent = ((NORMAL_QUESTION_MS - blueLimitMs) / NORMAL_QUESTION_MS) * 100;
  const helperText = stage === "green"
    ? `Questão difícil disponível por mais ${formatDuration(hardRemaining)}.`
    : stage === "blue"
      ? "Janela da questão difícil encerrada. Ainda conta como revisão rápida."
      : "Tempo avançado. A revisão será classificada como normal ou lenta.";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-4 w-full rounded-2xl border p-3 text-left transition hover:brightness-95 ${borderClass} ${flashClass}`}
      title="Clique para buscar uma questão difícil vinculada à questão atual. A janela começa quando a questão entra na tela e vai até 5 segundos."
    >
      <div className={`flex items-center justify-between gap-3 text-sm font-bold ${textClass}`}>
        <span>Tempo da questão normal</span>
        <span>{remaining > 0 ? formatDuration(remaining) : "tempo excedido"}</span>
      </div>
      <div className="mt-2 relative h-3">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/70 overflow-hidden">
          <div className={`h-full transition-all ${barClass}`} style={{ width: `${percent}%` }} />
        </div>
        <div className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-slate-900/55" style={{ left: `${hardCheckpointPercent}%` }} title="Fim da janela da questão difícil: 5s" />
        <div className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-slate-900/55" style={{ left: `${redCheckpointPercent}%` }} title="Início da fase vermelha: 45s" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-600">
        <span>{helperText}</span>
        <span>5s · 45s · 1min</span>
      </div>
    </button>
  );
}

function ReviewClassification({ card }) {
  return (
    <div className="mt-5 rounded-2xl bg-white border border-slate-200 p-4">
      <p className="text-sm font-bold text-slate-500 uppercase">Classificação da revisão</p>
      <p className="mt-1 text-lg font-black text-slate-900">{card.lastReviewClass}</p>
      <p className="text-sm text-slate-600 mt-1">Tempo de resposta: <b>{formatDuration(card.lastResponseMs || 0)}</b></p>
      <p className="text-sm text-slate-600 mt-1">Fase da memória: <b>{card.reviewStage || "aprendizagem"}</b></p>
      {!(card.isHard || card.generatedKind === "hardReview") && (
        <p className="text-sm text-slate-600 mt-1">Intervalo calculado: <b>{formatInterval(card.intervalMs || 0)}</b></p>
      )}
      <p className="text-sm text-slate-600 mt-2">{card.lastReviewClassDescription}</p>
      <p className="text-sm text-slate-600 mt-2">{card.nextReviewReason}</p>
    </div>
  );
}

function TempTimer({ card, referenceTime, isPaused }) {
  return (
    <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-3">
      <div className="flex items-center justify-between gap-3 text-sm font-bold text-amber-900">
        <span>{isPaused ? "Temporizador pausado" : "Temporizador da questão"}</span>
        <span>{formatCountdown(card.expiresAt, referenceTime)}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-amber-100 overflow-hidden">
        <div className="h-full bg-amber-500 transition-all" style={{ width: `${getCountdownPercent(card, referenceTime)}%` }} />
      </div>
    </div>
  );
}

function TimerPauseButton({ isPaused, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-3 w-full rounded-2xl px-4 py-3 font-black border transition ${isPaused ? "bg-cyan-950 text-cyan-100 border-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.45)]" : "bg-slate-950 text-white border-slate-800 hover:bg-slate-800"}`}
      title={isPaused ? "Continuar contagem do timer" : "Pausar todos os timers da questão atual"}
    >
      {isPaused ? "▶ Continuar timer" : "⏸ Pausar timer"}
    </button>
  );
}

function GlobalOverlayNotice() {
  return (
    <div className="mt-4 rounded-2xl bg-indigo-50 border border-indigo-200 p-3 text-sm text-indigo-900">
      Esta questão difícil foi chamada pelo temporizador e está vinculada à última questão respondida. Ao avançar, você volta ao fluxo normal.
    </div>
  );
}

function GlobalTimerButton({ remaining, percent, onClick }) {
  const size = 58;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <button
      onClick={onClick}
      className="fixed top-4 right-4 z-50 rounded-full bg-white/80 shadow-sm border border-slate-200 hover:bg-indigo-50 transition backdrop-blur flex items-center justify-center opacity-80 hover:opacity-100"
      style={{ width: size, height: size }}
      title="Janela de 5 segundos para ativar a questão difícil vinculada. Clique para buscar manualmente."
      aria-label="Indicador sutil da janela de questão difícil"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(224 231 255)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={remaining > 0 ? "rgb(99 102 241)" : "rgb(148 163 184)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="relative flex flex-col items-center justify-center leading-none">
        <span className="text-[9px] font-black text-indigo-600 uppercase">Dif.</span>
        <span className="text-[11px] font-black text-slate-900 mt-0.5">{remaining > 0 ? formatDuration(remaining) : "fim"}</span>
      </div>
    </button>
  );
}
