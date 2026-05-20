import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';

/**
 * ============================================================================
 * CURRENCY CONTEXT
 * ============================================================================
 */

const CurrencyContext = createContext(null);

/**
 * ============================================================================
 * DEFAULT CURRENCY
 * ============================================================================
 */

const DEFAULT_CURRENCY = {
  code: 'INR',
  symbol: '₹',
  country: 'IN',
  is_manual: false
};

/**
 * ============================================================================
 * PROVIDER
 * ============================================================================
 */

export function CurrencyProvider({ children }) {

  const [currencyInfo, setCurrencyInfo] = useState(DEFAULT_CURRENCY);

  const [exchangeRates, setExchangeRates] = useState({ INR: 1 });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  /**
   * ============================================================================
   * FETCH CURRENCY INFO
   * ============================================================================
   */

useEffect(() => {

  const fetchCurrencyInfo = async () => {

    try {

      setLoading(true);

      setError(null);

      /**
       * ============================================================
       * STEP 1:
       * DETECT COUNTRY FROM FRONTEND
       * ============================================================
       */

      const geoResponse = await fetch('https://ipapi.co/json/');

      const geoData = await geoResponse.json();

      const country = geoData.country_code || 'IN';

      console.log('Detected Country:', country);

      /**
       * ============================================================
       * STEP 2:
       * FETCH CURRENCY FROM BACKEND
       * IMPORTANT:
       * DO NOT USE OLD selectedCurrency CACHE
       * ============================================================
       */

      const response = await fetch(

        `/backend/api/currency.php?action=get-currency&country=${country}`,

        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {

        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      console.log('Currency API Response:', data);

      /**
       * ============================================================
       * STEP 3:
       * UPDATE STATE
       * ============================================================
       */

      if (data.success && data.data) {

        setCurrencyInfo({

          code: data.data.currency,
          symbol: data.data.symbol,
          country: data.data.country,
          is_manual: data.data.is_manual || false

        });

        /**
         * EXCHANGE RATES
         */

        if (data.exchange_rates) {

          setExchangeRates(data.exchange_rates);
        }

        /**
         * CACHE
         */

        localStorage.setItem(

          'currentCurrency',
          JSON.stringify(data.data)

        );

        localStorage.setItem(

          'exchangeRates',
          JSON.stringify(data.exchange_rates || {})

        );

        localStorage.setItem(

          'exchangeRatesTimestamp',
          Date.now().toString()

        );
      }

    } catch (err) {

      console.error('Currency Error:', err);

      setError(err.message);

      /**
       * ============================================================
       * FALLBACK TO CACHE
       * ============================================================
       */

      const cached = localStorage.getItem('currentCurrency');

      if (cached) {

        try {

          setCurrencyInfo(JSON.parse(cached));

        } catch (e) {

          console.error('Cache Parse Error:', e);
        }
      }

    } finally {

      setLoading(false);
    }
  };

  fetchCurrencyInfo();

}, []);

  /**
   * ============================================================================
   * CONVERT PRICE
   * ============================================================================
   */

  const convertPrice = useCallback(

    (priceINR) => {

      if (!priceINR || typeof priceINR !== 'number') {

        return 0;
      }

      /**
       * INR
       */

      if (currencyInfo.code === 'INR') {

        return Math.round(priceINR * 100) / 100;
      }

      /**
       * EXCHANGE RATE
       */

      const rate = exchangeRates[currencyInfo.code];

      if (!rate || rate <= 0) {

        console.warn(

          `Missing exchange rate for ${currencyInfo.code}`

        );

        return Math.round(priceINR * 100) / 100;
      }

      const converted = priceINR * rate;

      return Math.round(converted * 100) / 100;

    },

    [currencyInfo.code, exchangeRates]

  );

  /**
   * ============================================================================
   * FORMAT PRICE
   * ============================================================================
   */

  const formatPrice = useCallback(

    (price) => {

      if (price === null || price === undefined) {

        return `${currencyInfo.symbol}0`;
      }

      const num =

        typeof price === 'number'
          ? price
          : parseFloat(price) || 0;

      const formatted =

        Number.isInteger(num)
          ? num.toString()
          : num.toFixed(2);

      return `${currencyInfo.symbol}${formatted}`;

    },

    [currencyInfo.symbol]

  );

  /**
   * ============================================================================
   * MANUAL CURRENCY SWITCH
   * ============================================================================
   */

  const setCurrency = useCallback(async (currencyCode) => {

    try {

      const response = await fetch(

        `/backend/api/currency.php?action=set-currency&currency=${currencyCode}`,

        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {

        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {

        setCurrencyInfo({

          code: data.data.currency,
          symbol: data.data.symbol,
          country: data.data.country,
          is_manual: true

        });

        localStorage.setItem(

          'selectedCurrency',
          currencyCode

        );

        localStorage.setItem(

          'currentCurrency',
          JSON.stringify(data.data)

        );
      }

    } catch (err) {

      console.error('Set Currency Error:', err);

      setError(err.message);
    }

  }, []);

  /**
   * ============================================================================
   * REFRESH RATES
   * ============================================================================
   */

  const refreshRates = useCallback(async () => {

    try {

      setLoading(true);

      const response = await fetch(

        '/backend/api/currency.php?action=refresh-rates',

        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
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

          'exchangeRates',
          JSON.stringify(data.data)

        );

        localStorage.setItem(

          'exchangeRatesTimestamp',
          Date.now().toString()

        );
      }

    } catch (err) {

      console.error('Refresh Rates Error:', err);

      setError(err.message);

    } finally {

      setLoading(false);
    }

  }, []);

  /**
   * ============================================================================
   * CONTEXT VALUE
   * ============================================================================
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
 * ============================================================================
 * HOOK
 * ============================================================================
 */

export function useCurrency() {

  const context = useContext(CurrencyContext);

  if (!context) {

    throw new Error(

      'useCurrency must be used within CurrencyProvider'

    );
  }

  return context;
}

export default CurrencyContext;