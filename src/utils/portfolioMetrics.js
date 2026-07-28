export function calculatePortfolioMetrics(portfolio) {
  if (!portfolio) {
    return {
      value: 0,
      invested: 0,
      profit: 0,
      returnPercent: 0,
      xirr: 0,
      passiveIncome: 0,
      monthlyChange: 0,
      updatedAt: "",
    };
  }

  return {
    value: Number(portfolio.portfolioValue || 0),
    invested: Number(portfolio.invested || 0),
    profit: Number(portfolio.profit || 0),
    returnPercent: Number(portfolio.returnRate || 0),
    xirr: Number(portfolio.xirr || 0),
    passiveIncome: Number(portfolio.passiveIncome || 0),
    monthlyChange: Number(portfolio.monthlyChange || 0),
    updatedAt: portfolio.updatedAt || "",
  };
}