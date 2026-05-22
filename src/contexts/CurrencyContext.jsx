import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from "react";
import { formatCurrency, getCurrencySymbol } from "../lib/currency";

/**
 * ============================================================
 * CURRENCY CONTEXT
 * ============================================================
 */

const CurrencyContext = createContext(null);

/**
 * ============================================================
 * DEFAULT CURRENCY
 * ============================================================
 */

const DEFAULT_CURRENCY = {
  code: "INR",
  symbol: "\u20B9",
  country: "IN",
  is_manual: false
};

/**
 * ============================================================
 * CACHE CONFIG
 * ============================================================
 */

const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 Hours

/**
 * ============================================================
 * PROVIDER
 * ============================================================
 */

export function CurrencyProvider({ children }) {

  const [currencyInfo, setCurrencyInfo] = useState(DEFAULT_CURRENCY);

  const [exchangeRates, setExchangeRates] = useState({
    INR: 1
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  /**
   * ============================================================
   * FETCH CURRENCY INFO
   * ============================================================
   */

  useEffect(() => {

    const fetchCurrencyInfo = async () => {

      try {

        setLoading(true);

        setError(null);

        /**
         * ============================================================
         * STEP 1:
         * CHECK CACHE FIRST
         * ============================================================
         */

        const cachedCurrency =
          localStorage.getItem("currentCurrency");

        const cachedRates =
          localStorage.getItem("exchangeRates");

        const cachedTimestamp =
          localStorage.getItem("exchangeRatesTimestamp");

        const now = Date.now();

        /**
         * ============================================================
         * STEP 2:
         * DETECT USER COUNTRY
         * ============================================================
         */

        const geoResponse = await fetch(
          "https://ipapi.co/json/"
        );

        const geoData = await geoResponse.json();

        const country =
          geoData.country_code || "IN";

        console.log("[CurrencyContext] Detected Country:", country);

        const selectedCurrency = localStorage.getItem("selectedCurrency");

        if (
          cachedCurrency &&
          cachedRates &&
          cachedTimestamp &&
          now - Number(cachedTimestamp) < CACHE_DURATION
        ) {

          try {

            const parsedCurrency = JSON.parse(cachedCurrency);
            const cacheMatchesManualSelection =
              selectedCurrency && parsedCurrency.code === selectedCurrency;
            const cacheMatchesDetectedCountry =
              !selectedCurrency && parsedCurrency.country === country;

            if (cacheMatchesManualSelection || cacheMatchesDetectedCountry) {
              setCurrencyInfo(parsedCurrency);

              setExchangeRates(JSON.parse(cachedRates));

              setLoading(false);

              console.log("[CurrencyContext] Loaded currency from cache");

              return;
            }

          } catch (cacheErr) {

            console.error("Cache Parse Error:", cacheErr);
          }
        }

        /**
         * ============================================================
         * STEP 3:
         * GET CURRENCY + EXCHANGE RATE
         * ============================================================
         */

        const currencyQuery = selectedCurrency
          ? `&currency=${encodeURIComponent(selectedCurrency)}`
          : "";

        const response = await fetch(
          `/backend/api/currency.php?action=get-currency&country=${country}${currencyQuery}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        if (!response.ok) {

          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        console.log('[CurrencyContext] Full API Response:', data);

        /**
         * ============================================================
         * STEP 4:
         * UPDATE STATE
         * ============================================================
         */

        if (data.success && data.data) {

          const updatedCurrency = {

            code: data.data.currency || "INR",

            symbol: data.data.symbol || getCurrencySymbol(data.data.currency || "INR"),

            country: data.data.country || "IN",

            is_manual: data.data.is_manual || false
          };

          setCurrencyInfo(updatedCurrency);

          /**
           * EXCHANGE RATES
           */

          if (data.exchange_rates) {

            console.log('[CurrencyContext] Exchange Rates Loaded:', {
              rates: data.exchange_rates,
              userCurrency: updatedCurrency.code,
              rate: data.exchange_rates[updatedCurrency.code]
            });

            setExchangeRates(data.exchange_rates);
          } else {
            console.warn('[CurrencyContext] No exchange_rates in API response');
          }

          /**
           * SAVE CACHE
           */

          localStorage.setItem(
            "currentCurrency",
            JSON.stringify(updatedCurrency)
          );

          localStorage.setItem(
            "exchangeRates",
            JSON.stringify(
              data.exchange_rates || { INR: 1 }
            )
          );

          localStorage.setItem(
            "exchangeRatesTimestamp",
            now.toString()
          );
        }

      } catch (err) {

        console.error("Currency Error:", err);

        setError(err.message);

        /**
         * ============================================================
         * FALLBACK
         * ============================================================
         */

        const cachedCurrency =
          localStorage.getItem("currentCurrency");

        const cachedRates =
          localStorage.getItem("exchangeRates");

        if (cachedCurrency) {

          try {

            setCurrencyInfo(
              JSON.parse(cachedCurrency)
            );

          } catch (e) {

            console.error("Currency Cache Error:", e);
          }
        }

        if (cachedRates) {

          try {

            setExchangeRates(
              JSON.parse(cachedRates)
            );

          } catch (e) {

            console.error("Rates Cache Error:", e);
          }
        }

      } finally {

        setLoading(false);
      }
    };

    fetchCurrencyInfo();

  }, []);

  /**
   * ============================================================
   * CONVERT PRICE
   * ============================================================
   */

  const convertPrice = useCallback(

    (priceINR) => {

      const amount = parseFloat(priceINR);

      if (isNaN(amount)) {

        return 0;
      }

      /**
       * INR
       */

      if (currencyInfo.code === "INR") {

        return Math.round(amount * 100) / 100;
      }

      /**
       * EXCHANGE RATE
       */

      const rate =
        exchangeRates[currencyInfo.code];

      if (!rate || rate <= 0) {

        console.warn(
          `[CurrencyContext] Missing exchange rate for ${currencyInfo.code}. Available rates:`, 
          exchangeRates
        );

        return Math.round(amount * 100) / 100;
      }

      const converted = amount * rate;

      if (process.env.NODE_ENV === 'development') {
        console.log('[CurrencyContext.convertPrice]', {
          inputINR: amount,
          currency: currencyInfo.code,
          rate,
          converted,
          final: Math.round(converted * 100) / 100
        });
      }

      return Math.round(converted * 100) / 100;

    },

    [currencyInfo.code, exchangeRates]

  );

  /**
   * ============================================================
   * FORMAT PRICE
   * ============================================================
   */

  const formatPrice = useCallback(

    (price) => {

      const amount = parseFloat(price);

      if (isNaN(amount)) {

        return `${currencyInfo.symbol}0`;
      }

      try {

        return formatCurrency(amount, currencyInfo.symbol, currencyInfo.code);

      } catch (err) {

        console.error(
          "Currency Format Error:",
          err
        );

        return `${currencyInfo.symbol}${amount.toFixed(2)}`;
      }

    },

    [currencyInfo.code, currencyInfo.symbol]

  );

  /**
   * ============================================================
   * MANUAL CURRENCY SWITCH
   * ============================================================
   */

  const setCurrency = useCallback(

    async (currencyCode) => {

      try {

        setLoading(true);

        const response = await fetch(

          `/backend/api/currency.php?action=set-currency&currency=${currencyCode}`,

          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        if (!response.ok) {

          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {

          const updatedCurrency = {

            code: data.data.currency,

            symbol: data.data.symbol,

            country: data.data.country,

            is_manual: true
          };

          setCurrencyInfo(updatedCurrency);

          if (data.exchange_rates) {
            setExchangeRates(data.exchange_rates);
            localStorage.setItem(
              "exchangeRates",
              JSON.stringify(data.exchange_rates)
            );
            localStorage.setItem(
              "exchangeRatesTimestamp",
              Date.now().toString()
            );
          }

          /**
           * CACHE
           */

          localStorage.setItem(
            "selectedCurrency",
            currencyCode
          );

          localStorage.setItem(
            "currentCurrency",
            JSON.stringify(updatedCurrency)
          );
        }

      } catch (err) {

        console.error(
          "Set Currency Error:",
          err
        );

        setError(err.message);

      } finally {

        setLoading(false);
      }

    },

    []

  );

  /**
   * ============================================================
   * REFRESH RATES
   * ============================================================
   */

  const refreshRates = useCallback(

    async () => {

      try {

        setLoading(true);

        const response = await fetch(

          "/backend/api/currency.php?action=refresh-rates",

          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        if (!response.ok) {

          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {

          setExchangeRates(data.data);

          localStorage.setItem(
            "exchangeRates",
            JSON.stringify(data.data)
          );

          localStorage.setItem(
            "exchangeRatesTimestamp",
            Date.now().toString()
          );
        }

      } catch (err) {

        console.error(
          "Refresh Rates Error:",
          err
        );

        setError(err.message);

      } finally {

        setLoading(false);
      }

    },

    []

  );

  /**
   * ============================================================
   * CONTEXT VALUE
   * ============================================================
   */

  const value = {

    currency: currencyInfo.code,

    symbol: currencyInfo.symbol,

    country: currencyInfo.country,

    is_manual: currencyInfo.is_manual,

    currencyInfo,

    exchangeRates,

    convertPrice,

    formatPrice,

    setCurrency,

    refreshRates,

    loading,

    error
  };

  return (

    <CurrencyContext.Provider value={value}>

      {children}

    </CurrencyContext.Provider>
  );
}

/**
 * ============================================================
 * HOOK
 * ============================================================
 */

export function useCurrency() {

  const context = useContext(CurrencyContext);

  if (!context) {

    throw new Error(
      "useCurrency must be used within CurrencyProvider"
    );
  }

  return context;
}

export default CurrencyContext;
