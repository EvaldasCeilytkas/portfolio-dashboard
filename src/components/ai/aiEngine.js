const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const money = (value) => new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(number(value));
const percent = (value, signed = false) => `${signed && number(value) > 0 ? "+" : ""}${new Intl.NumberFormat("lt-LT", { maximumFractionDigits: 1 }).format(number(value))} %`;
const integer = (value) => new Intl.NumberFormat("lt-LT", { maximumFractionDigits: 0 }).format(number(value));

function readGoals(ownerId) {
  const defaults = { targetValue: 100000, monthlyContribution: 500, expectedReturn: 8 };
  try {
    const saved = window.localStorage.getItem(`portfolio-goals-v1-${ownerId}`);
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  } catch {
    return defaults;
  }
}

function futureValue(currentValue, monthlyContribution, annualRate, months) {
  const monthlyRate = annualRate / 100 / 12;
  if (!monthlyRate) return currentValue + monthlyContribution * months;
  const growth = Math.pow(1 + monthlyRate, months);
  return currentValue * growth + monthlyContribution * ((growth - 1) / monthlyRate);
}

function monthsToGoal(currentValue, targetValue, monthlyContribution, annualRate) {
  if (currentValue >= targetValue) return 0;
  for (let month = 1; month <= 1200; month += 1) {
    if (futureValue(currentValue, monthlyContribution, annualRate, month) >= targetValue) return month;
  }
  return null;
}

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function buildAIInsights(report, ownerId) {
  const platforms = report?.platforms || [];
  const history = report?.history || [];
  const latest = report?.latest || history.at(-1) || {};
  const previous = report?.previous || history.at(-2) || latest;
  const totalValue = number(report?.currentValue ?? latest.value);
  const invested = number(report?.invested ?? latest.invested);
  const profit = number(report?.profit ?? latest.profit);
  const roi = invested > 0 ? (profit / invested) * 100 : 0;
  const monthlyValueChange = number(latest.value) - number(previous.value);
  const monthlyProfitChange = number(latest.profit) - number(previous.profit);
  const monthlyRate = number(previous.value) > 0 ? monthlyValueChange / number(previous.value) * 100 : 0;
  const delayedTotal = platforms.reduce((sum, item) => sum + number(item.delayed), 0);
  const activeTotal = platforms.reduce((sum, item) => sum + number(item.active), 0);
  const delayedShare = activeTotal > 0 ? delayedTotal / activeTotal * 100 : 0;
  const topPlatform = platforms[0] || null;
  const topShare = totalValue > 0 && topPlatform ? number(topPlatform.value) / totalValue * 100 : 0;
  const best = report?.best || null;
  const weakest = report?.weakest || null;
  const positivePlatforms = platforms.filter((item) => number(item.roi) > 0).length;

  const allocation = report?.allocation || [];
  const largestAsset = [...allocation].sort((a, b) => number(b.share) - number(a.share))[0] || null;
  const smallestAsset = [...allocation].sort((a, b) => number(a.share) - number(b.share))[0] || null;
  const allocationGap = largestAsset ? Math.max(0, number(largestAsset.share) - 65) : 0;

  const diversificationScore = clamp(45 + Math.min(platforms.length, 15) * 3.5 - Math.max(0, topShare - 20) * 1.6);
  const riskScore = clamp(100 - delayedShare * 4 - Math.max(0, topShare - 25) * 1.4);
  const growthScore = clamp(55 + roi * 2 + monthlyRate * 3);
  const liquidityScore = 92;
  const goals = readGoals(ownerId);
  const goalProgress = goals.targetValue > 0 ? clamp(totalValue / goals.targetValue * 100) : 0;
  const goalScore = clamp(40 + goalProgress * 0.6);
  const score = clamp(diversificationScore * .26 + riskScore * .28 + growthScore * .22 + liquidityScore * .08 + goalScore * .16);

  const goalMonths = monthsToGoal(totalValue, number(goals.targetValue), number(goals.monthlyContribution), number(goals.expectedReturn));
  const goalDate = goalMonths === null ? null : addMonths(new Date(), goalMonths);

  const dailyBrief = [];
  dailyBrief.push({
    tone: monthlyValueChange >= 0 ? "positive" : "negative",
    icon: monthlyValueChange >= 0 ? "↗" : "↘",
    title: monthlyValueChange >= 0 ? "Portfelis augo" : "Portfelio vertė sumažėjo",
    text: `Naujausias mėnesio vertės pokytis – ${money(monthlyValueChange)} (${percent(monthlyRate, true)}).`,
  });
  if (best) dailyBrief.push({ tone: "positive", icon: "★", title: "Geriausias rezultatas", text: `${best.name} šiuo metu rodo ${percent(best.roi)} ROI.` });
  if (delayedTotal > 0) dailyBrief.push({ tone: delayedShare >= 8 ? "warning" : "neutral", icon: "!", title: "Vėlavimų stebėsena", text: `${integer(delayedTotal)} investicijos vėluoja – ${percent(delayedShare)} aktyvių pozicijų.` });
  else dailyBrief.push({ tone: "positive", icon: "✓", title: "Vėlavimų nėra", text: "Aktyviose investicijose vėlavimų neužfiksuota." });
  dailyBrief.push({ tone: "info", icon: "◎", title: "Tikslų progresas", text: `Pasiekta ${percent(goalProgress)} ${money(goals.targetValue)} tikslo.` });

  const highlights = [
    { label: "Geriausias ROI", value: best?.name || "—", meta: best ? percent(best.roi) : "Nėra duomenų", tone: "green" },
    { label: "Didžiausia pozicija", value: topPlatform?.name || "—", meta: topPlatform ? `${money(topPlatform.value)} · ${percent(topShare)}` : "Nėra duomenų", tone: "blue" },
    { label: "Mėnesio pelno pokytis", value: money(monthlyProfitChange), meta: monthlyProfitChange >= 0 ? "Teigiamas impulsas" : "Reikia stebėti", tone: monthlyProfitChange >= 0 ? "violet" : "orange" },
    { label: "Pelningos platformos", value: `${positivePlatforms}/${platforms.length}`, meta: `${platforms.length ? Math.round(positivePlatforms / platforms.length * 100) : 0} % platformų`, tone: "cyan" },
  ];

  const risks = [];
  if (delayedTotal > 0) risks.push({ level: delayedShare >= 8 ? "high" : "medium", title: "Vėluojančios investicijos", text: `${integer(delayedTotal)} vėlavimų (${percent(delayedShare)} aktyvių investicijų).`, action: "/p2p" });
  if (topShare > 20) risks.push({ level: topShare > 30 ? "high" : "medium", title: "Platformos koncentracija", text: `${topPlatform.name} sudaro ${percent(topShare)} viso portfelio.`, action: `/platforms/${topPlatform.id}` });
  if (allocationGap > 0) risks.push({ level: "medium", title: "Turto klasės dominavimas", text: `${largestAsset.label} dalis pasiekė ${percent(largestAsset.share)}.`, action: "/portfolio" });
  if (!risks.length) risks.push({ level: "low", title: "Kritinių rizikų nenustatyta", text: "Koncentracija, vėlavimai ir turto paskirstymas išlieka kontroliuojami.", action: "/portfolio" });

  const opportunities = [];
  if (smallestAsset && allocation.length > 1) opportunities.push({ title: `Stiprinti „${smallestAsset.label}“`, text: `Ši turto klasė sudaro ${percent(smallestAsset.share)} portfelio. Nauji įnašai padėtų subalansuoti paskirstymą.`, impact: "Diversifikacija", action: "/portfolio" });
  if (topShare > 18) opportunities.push({ title: "Mažinti didžiausios pozicijos svorį", text: `Naujas lėšas nukreipiant už „${topPlatform.name}“ ribų sumažėtų koncentracijos rizika.`, impact: "+ rizikos balas", action: "/portfolio" });
  if (monthlyValueChange > 0) opportunities.push({ title: "Išlaikyti investavimo tempą", text: `Mėnesio vertės pokytis buvo teigiamas (${money(monthlyValueChange)}). Reguliarumas šiuo metu veikia.`, impact: "Augimo tęstinumas", action: "/goals" });
  if (!opportunities.length) opportunities.push({ title: "Tęsti dabartinį planą", text: "Didelių alokacijos korekcijų šiuo metu nereikia. Svarbiausia – reguliarus įnašų tempas.", impact: "Stabilumas", action: "/goals" });

  const recentSix = history.slice(-6);
  const firstSix = recentSix[0] || latest;
  const sixMonthGrowth = number(firstSix.value) > 0 ? (number(latest.value) - number(firstSix.value)) / number(firstSix.value) * 100 : 0;
  const recentResults = recentSix.map((row) => number(row.monthlyResult));
  const averageResult = recentResults.length ? recentResults.reduce((sum, value) => sum + value, 0) / recentResults.length : 0;
  const lastThree = recentResults.slice(-3);
  const priorThree = recentResults.slice(-6, -3);
  const avg = (rows) => rows.length ? rows.reduce((sum, value) => sum + value, 0) / rows.length : 0;
  const momentum = avg(lastThree) - avg(priorThree);
  const trends = [
    { label: "6 mėn. portfelio vertė", value: percent(sixMonthGrowth, true), direction: sixMonthGrowth >= 0 ? "up" : "down", text: sixMonthGrowth >= 0 ? "Ilgalaikė kryptis teigiama" : "Ilgalaikė kryptis silpnėja" },
    { label: "Vidutinis mėnesio rezultatas", value: money(averageResult), direction: averageResult >= 0 ? "up" : "down", text: "Pagal paskutinius 6 istorijos taškus" },
    { label: "Trumpalaikis impulsas", value: money(momentum), direction: momentum >= 0 ? "up" : "down", text: "Paskutiniai 3 mėn. prieš ankstesnius 3 mėn." },
    { label: "Diversifikacija", value: `${platforms.length} platformos`, direction: platforms.length >= 8 ? "up" : "flat", text: topShare > 25 ? "Platformų daug, bet didžiausia pozicija reikšminga" : "Platformų paskirstymas pakankamai platus" },
  ];

  const actions = [];
  if (delayedTotal > 0) actions.push({ priority: "high", title: `Peržiūrėti ${integer(delayedTotal)} vėluojančių investicijų`, text: "Patikrinkite didžiausią vėlavimų koncentraciją P2P puslapyje.", path: "/p2p" });
  if (topShare > 20) actions.push({ priority: "medium", title: `Nedidinti „${topPlatform.name}“ dalies`, text: `Dabartinė koncentracija – ${percent(topShare)}.`, path: "/portfolio" });
  if (smallestAsset) actions.push({ priority: "medium", title: `Kitą įnašą svarstyti skirti „${smallestAsset.label}“`, text: "Tai padėtų priartinti turto klases prie tolygesnio paskirstymo.", path: "/portfolio" });
  actions.push({ priority: "normal", title: "Patikrinti tikslo datą", text: goalDate ? `Pagal dabartinį planą tikslas prognozuojamas ${new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long" }).format(goalDate)}.` : "Dabartinis planas nepasiekia tikslo per 100 metų prognozę.", path: "/goals" });

  const summary = `Portfelio AI balas yra ${Math.round(score)}/100. ${monthlyValueChange >= 0 ? `Naujausias mėnuo pridėjo ${money(monthlyValueChange)} vertės.` : `Naujausias mėnuo sumažino vertę ${money(Math.abs(monthlyValueChange))}.`} ${best ? `Geriausią ROI rodo ${best.name}.` : "Platformų ROI duomenų nepakanka."} ${delayedTotal > 0 ? `Svarbiausia stebėti ${integer(delayedTotal)} vėluojančių investicijų.` : "Vėlavimų šiuo metu nėra."}`;

  return {
    score: Math.round(score),
    grade: score >= 90 ? "A+" : score >= 82 ? "A" : score >= 74 ? "B+" : score >= 66 ? "B" : "C",
    scoreParts: [
      { label: "Diversifikacija", value: Math.round(diversificationScore) },
      { label: "Rizika", value: Math.round(riskScore) },
      { label: "Augimas", value: Math.round(growthScore) },
      { label: "Likvidumas", value: Math.round(liquidityScore) },
      { label: "Tikslai", value: Math.round(goalScore) },
    ],
    dailyBrief,
    highlights,
    risks,
    opportunities: opportunities.slice(0, 3),
    trends,
    actions: actions.slice(0, 5),
    goal: { progress: goalProgress, target: goals.targetValue, date: goalDate, months: goalMonths, monthlyContribution: goals.monthlyContribution },
    summary,
    generatedAt: new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date()),
    weakest,
  };
}
