import { useCallback, useEffect, useState } from 'react';

import {
  DEFAULT_INICIO_FILTERS,
  DEFAULT_PROXIMO_FILTERS,
  type InicioDashboardFilters,
  type ProximoFilters,
} from '../domain/dashboardFilters';
import { loadDashboardFilters, saveDashboardFilters } from '../storage/dashboardFilters';

export function useDashboardFilters() {
  const [inicio, setInicio] = useState<InicioDashboardFilters>(DEFAULT_INICIO_FILTERS);
  const [proximo, setProximo] = useState<ProximoFilters>(DEFAULT_PROXIMO_FILTERS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadDashboardFilters();
      if (!cancelled) {
        setInicio(loaded.inicio);
        setProximo(loaded.proximo);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (nextInicio: InicioDashboardFilters, nextProximo: ProximoFilters) => {
    await saveDashboardFilters({ inicio: nextInicio, proximo: nextProximo });
  }, []);

  const setInicioFilters = useCallback(
    async (next: InicioDashboardFilters) => {
      setInicio(next);
      await persist(next, proximo);
    },
    [persist, proximo],
  );

  const setProximoFilters = useCallback(
    async (next: ProximoFilters) => {
      setProximo(next);
      await persist(inicio, next);
    },
    [persist, inicio],
  );

  return {
    ready,
    inicioFilters: inicio,
    setInicioFilters,
    proximoFilters: proximo,
    setProximoFilters,
  };
}