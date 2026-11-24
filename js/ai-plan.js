(function () {
  async function generatePlan(input) {
    const config = window.SUPABASE_CONFIG || {};
    if (!config.url || !config.publishableKey) throw new Error('SERVER_UNAVAILABLE');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(`${config.url}/functions/v1/generate-plan`, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', apikey: config.publishableKey },
        body: JSON.stringify(input)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(result.error || 'SERVER_UNAVAILABLE');
        error.code = result.error;
        throw error;
      }
      if (!['gemini', 'fallback'].includes(result.source) || !Array.isArray(result.plan) ||
          result.plan.length !== input.frequency || result.plan.some(item =>
            !item.id || typeof item.title !== 'string' || typeof item.summary !== 'string' ||
            item.place !== input.place || item.workoutType !== input.workoutType ||
            item.duration !== input.duration || item.level !== input.level)) {
        throw new Error('BAD_SERVER_OUTPUT');
      }
      return result;
    } finally { clearTimeout(timer); }
  }
  window.aiTrainerAI = { generatePlan };
})();
