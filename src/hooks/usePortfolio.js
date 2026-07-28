import { useContext } from "react";
import { PortfolioContext } from "../context/PortfolioContext";

export function usePortfolio() {
  const context = useContext(PortfolioContext);

  if (!context) {
    throw new Error(
      "usePortfolio turi būti naudojamas PortfolioProvider viduje."
    );
  }

  return context;
}