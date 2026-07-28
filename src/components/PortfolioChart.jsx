import PerformanceChart from "./charts/PerformanceChart";

function PortfolioChart({ history = [], currentValue = 0 }) {
  return (
    <PerformanceChart
      history={history}
      currentValue={currentValue}
      eyebrow="Portfelio dinamika"
      title="Portfelio vertės pokytis"
      description="Portfelio vertės ir įneštų pinigų pokytis pagal pasirinktą laikotarpį."
      valueLabel="Portfelio vertė"
      investedLabel="Įnešta"
      totalLabel="Dabartinė vertė"
      showPeriodResult
      height={440}
    />
  );
}

export default PortfolioChart;
