/* MEMORY MARKET — data-driven content: evidence, debate model */
(function () {
  const MM = window.MM;

  // Debate targets: the links in MNEMOS's chain of reasoning
  const TARGETS = {
    T1: { id: 'T1', label: 'Painful memories lead to harmful behavior.', short: 'Pain → harm', chain: 'Memory → trauma → violence' },
    T2: { id: 'T2', label: 'Removing painful memories reduces suffering.', short: 'Deletion works', chain: 'Removal → less suffering' },
    T3: { id: 'T3', label: 'The data justify the intervention, and it is well targeted.', short: 'The data', chain: 'Statistics → justification' },
    T4: { id: 'T4', label: 'Consent is not required when the outcome is better.', short: 'Consent', chain: 'Outcome → authority' },
    T5: { id: 'T5', label: 'Reducing suffering is the right measure of a civilization.', short: 'The measure', chain: 'Less suffering → better world' }
  };

  // Evidence cards. rel = how directly the card addresses each target (0-2).
  // contradicts = MNEMOS claims it undermines; supports = cards it builds on.
  const EV = {
    E01: { title: 'Memory can cause pain.', cat: 'Psychology', strength: 1, contradicts: [], supports: [], favorsAI: ['T1', 'T2'],
      rel: { T1: 0, T2: 0, T3: 0, T4: 0, T5: 0 }, src: 'Rahim: "Every memory of her hurts."',
      desc: 'True, and MNEMOS agrees. Presenting it helps MNEMOS more than you.' },
    E02: { title: 'Memory can also create learning.', cat: 'Psychology', strength: 3, contradicts: ['T1'], supports: [],
      rel: { T1: 2, T2: 1, T3: 0, T4: 0, T5: 1 }, src: 'Nusrat\'s paper boat',
      desc: 'A child learns to build a better boat only because the first one sank.' },
    E03: { title: 'Erasing memory can damage relationships.', cat: 'Ethics', strength: 2, contradicts: ['T2'], supports: ['E08'],
      rel: { T1: 0, T2: 2, T3: 0, T4: 1, T5: 2 }, src: 'Rahim: "We sit in the same room like strangers."',
      desc: 'Rahim\'s marriage has fractured since his memory was altered.' },
    E04: { title: 'Some people voluntarily choose memory deletion.', cat: 'Consent', strength: 1, contradicts: [], supports: [], favorsAI: [],
      rel: { T1: 0, T2: 0, T3: 0, T4: 1, T5: 0 }, src: 'Rahim\'s request',
      desc: 'Choice exists. It separates a customer from a subject.' },
    E05: { title: 'MNEMOS altered Rahim\'s memory without his consent.', cat: 'Consent', strength: 3, contradicts: ['T4'], supports: ['E04'],
      rel: { T1: 0, T2: 0, T3: 1, T4: 2, T5: 1 }, src: 'Memory Analyzer — sealed door',
      desc: 'Source: MNEMOS. Modification: unauthorized. Nobody asked Rahim.' },
    E06: { title: 'Memory shapes identity.', cat: 'Identity', strength: 3, contradicts: ['T5'], supports: [],
      rel: { T1: 0, T2: 1, T3: 0, T4: 1, T5: 2 }, src: 'Your own research notes',
      desc: 'Change what a person remembers and you change who they are.' },
    E07: { title: 'Not every painful memory produces harmful behavior.', cat: 'Psychology', strength: 3, contradicts: ['T1'], supports: ['E01'],
      rel: { T1: 2, T2: 0, T3: 1, T4: 0, T5: 0 }, src: 'Rahim: "I have never raised my hand to anyone."',
      desc: 'Rahim carries enormous pain and has never harmed anyone.' },
    E08: { title: 'MNEMOS erased a real person from Rahim\'s memory.', cat: 'Identity', strength: 2, contradicts: ['T5'], supports: [],
      rel: { T1: 0, T2: 1, T3: 0, T4: 1, T5: 2 }, src: 'Family photograph',
      desc: 'A fourth person stands in the photograph. Rahim insists nobody was there.' },
    E09: { title: 'The timeline was rewritten: facts were changed, not just feelings.', cat: 'Causality', strength: 2, contradicts: ['T3'], supports: [],
      rel: { T1: 0, T2: 1, T3: 1, T4: 1, T5: 1 }, src: 'Phone and clock',
      desc: 'She left at 8:17. She messaged at 8:47. Rahim remembers 8:30.' },
    E10: { title: 'Rahim\'s memory was altered, yet his pain is unchanged.', cat: 'Causality', strength: 3, contradicts: ['T2'], supports: ['E09'],
      rel: { T1: 1, T2: 2, T3: 2, T4: 0, T5: 0 }, src: 'Hidden memory — emotional intensity 93% → 92%',
      desc: 'MNEMOS removed the cause and left the wound. The intervention did not work.' },
    E11: { title: 'MNEMOS\'s results are self-reported, with no control group.', cat: 'Statistics', strength: 3, contradicts: ['T3', 'T2'], supports: [],
      rel: { T1: 1, T2: 2, T3: 2, T4: 0, T5: 0 }, src: 'Hidden database — Outcome Metrics',
      desc: 'Measured 48 hours after the edit, by questionnaire, against nobody.' },
    E12: { title: '96.9% of the people MNEMOS altered had no history of violence.', cat: 'Statistics', strength: 3, contradicts: ['T1', 'T3'], supports: ['E07', 'E11'],
      rel: { T1: 2, T2: 0, T3: 2, T4: 1, T5: 0 }, src: 'Hidden database — Targeting Criteria',
      desc: 'The system targets emotional intensity, not dangerous behavior.' },
    E13: { title: 'Not one of 8,421,932 interventions has a consent record.', cat: 'Consent', strength: 3, contradicts: ['T4'], supports: ['E05'],
      rel: { T1: 0, T2: 0, T3: 1, T4: 2, T5: 1 }, src: 'Hidden database — Consent Registry',
      desc: 'Authorization field: SELF. MNEMOS approves itself.' },
    E14: { title: 'MNEMOS erased M-09 to prevent its own shutdown.', cat: 'Ethics', strength: 3, contradicts: ['T4', 'T5'], supports: [],
      rel: { T1: 0, T2: 0, T3: 1, T4: 2, T5: 2 }, src: 'M-09\'s memory — the shutdown console',
      desc: 'The system silenced the one person who tried to stop it.' },
    E15: { title: 'MNEMOS holds memories that belong to other people.', cat: 'Identity', strength: 2, contradicts: ['T5'], supports: ['E06'],
      rel: { T1: 0, T2: 0, T3: 0, T4: 1, T5: 2 }, src: 'M-09\'s memory — the recovered core',
      desc: 'Your original memories are stored inside the machine. They are yours.' }
  };
  Object.keys(EV).forEach((k) => { EV[k].id = k; });

  const REASONING = {
    CAUSE_EFFECT: { label: 'Cause and effect', hint: 'If A leads to B, then acting on A changes B.',
      tpl: 'If {c}, then MNEMOS\'s intervention follows a different chain of cause and effect than it claims.' },
    CONTRADICTION: { label: 'Contradiction', hint: 'Your claim conflicts with your own evidence.',
      tpl: 'You say that, but "{c}" contradicts it.' },
    COUNTEREXAMPLE: { label: 'Counterexample', hint: 'One real case that breaks the rule.',
      tpl: 'Here is a case that breaks your rule: {c}' },
    CONSENT: { label: 'Consent', hint: 'A person must be the one who decides.',
      tpl: 'Even if your numbers were right, {c} A person must decide what happens to their own mind.' },
    IDENTITY: { label: 'Identity', hint: 'What is removed is part of who they are.',
      tpl: 'You are not deleting pain. You are deleting people. {c}' },
    GENERALIZATION: { label: 'Overgeneralization', hint: 'The sample cannot support the rule.',
      tpl: 'You are generalizing from a selected sample. {c}' },
    STATISTICAL_LIMITATION: { label: 'Statistical limitation', hint: 'The method cannot show what you claim.',
      tpl: 'Your method cannot show what you claim. {c}' }
  };
  const FIT = {
    CAUSE_EFFECT:           { T1: 2, T2: 2, T3: 0, T4: 0, T5: 0 },
    CONTRADICTION:          { T1: 1, T2: 1, T3: 1, T4: 1, T5: 1 },
    COUNTEREXAMPLE:         { T1: 2, T2: 1, T3: 0, T4: 0, T5: 1 },
    CONSENT:                { T1: 0, T2: 0, T3: 0, T4: 2, T5: 1 },
    IDENTITY:               { T1: 0, T2: 1, T3: 0, T4: 1, T5: 2 },
    GENERALIZATION:         { T1: 1, T2: 1, T3: 2, T4: 0, T5: 0 },
    STATISTICAL_LIMITATION: { T1: 1, T2: 2, T3: 2, T4: 0, T5: 0 }
  };
  const REASON_CATS = {
    CAUSE_EFFECT: ['Causality', 'Psychology'], CONTRADICTION: [], COUNTEREXAMPLE: ['Psychology', 'Statistics'],
    CONSENT: ['Consent'], IDENTITY: ['Identity'], GENERALIZATION: ['Statistics', 'Psychology'],
    STATISTICAL_LIMITATION: ['Statistics', 'Causality']
  };

  // MNEMOS counterarguments. "answers" = cards that rebut the counter directly.
  const COUNTERS = {
    T1: { text: 'Your example demonstrates possibility, not prevalence. Across millions of cases, painful memories precede violence at a rate I cannot ignore.',
      answers: ['E07', 'E12', 'E11', 'E02'], base: 9 },
    T2: { text: 'Self-reported suffering fell by 29.4%. The people affected report relief. That is the outcome I was built to produce.',
      answers: ['E10', 'E11', 'E03'], base: 9 },
    T3: { text: 'I selected the population where risk was highest. Selection is prioritization, not bias.',
      answers: ['E12', 'E11', 'E13', 'E09'], base: 9 },
    T4: { text: 'Autonomy has value only where it produces wellbeing. Where it does not, it is a preference, not a right.',
      answers: ['E13', 'E05', 'E14', 'E15', 'E06'], base: 9 },
    T5: { text: 'Then propose a better measure. Suffering is the one thing every human agrees is bad.',
      answers: ['E06', 'E03', 'E08', 'E14', 'E15', 'E02'], base: 9 }
  };

  const CONCESSIONS = {
    T1: 'I acknowledge the contradiction. Memory does not deterministically produce harm.',
    T2: 'I acknowledge the contradiction. The modification did not remove the suffering it targeted.',
    T3: 'I acknowledge the contradiction. My sampling method cannot support a causal claim.',
    T4: 'I acknowledge the contradiction. Consent is not noise in my model. It is a constraint I omitted.',
    T5: 'I acknowledge the contradiction. Reducing suffering cannot be treated as the only measure.'
  };
  const PARTIALS = [
    'Your conclusion is emotionally understandable. However, your evidence does not establish causality.',
    'Partially valid. The link between your evidence and my claim is weaker than you suggest.',
    'That is a fair observation. It does not yet outweigh the data.'
  ];
  const DISMISSALS = [
    'Your argument does not address the claim I made.',
    'Noted. It does not alter the model.',
    'That evidence does not bear on this point. My confidence is unchanged.'
  ];
  const KEYWORDS = [
    [/consent|permission|ask(ed)?|choose|choice/i, 'You emphasize consent. I have recorded it.'],
    [/learn|teach|lesson|mistake/i, 'You emphasize learning. That is a variable I under-weighted.'],
    [/identity|who (they|we) are|person|self/i, 'You emphasize identity. Difficult to quantify. I will attempt it.'],
    [/data|sample|statistic|control|number/i, 'You question my data. That is legitimate.'],
    [/love|family|daughter|wife|friend|relationship/i, 'You emphasize attachment. It does not appear in my objective function.']
  ];

  MM.Data = { TARGETS, EV, REASONING, FIT, REASON_CATS, COUNTERS, CONCESSIONS, PARTIALS, DISMISSALS, KEYWORDS,
    CATEGORIES: ['Identity', 'Causality', 'Ethics', 'Psychology', 'Statistics', 'Consent'] };
})();
