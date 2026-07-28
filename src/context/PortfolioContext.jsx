import { createContext, useEffect, useState } from "react";

export const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPortfolio() {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch(`${import.meta.env.BASE_URL}data/portfolio.json`);

        if (!response.ok) {
          throw new Error("Nepavyko užkrauti portfolio.json failo.");
        }

        const data = await response.json();
        setPortfolio(data);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error.message || "Įvyko klaida kraunant portfelio duomenis."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPortfolio();
  }, []);

  const value = {
    portfolio,
    loading,
    errorMessage,
    setPortfolio,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}