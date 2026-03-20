(function (w) {
  if (!w) return;

  function getEnv(key, fallback) {
    if (w.ENV && w.ENV[key]) {
      return w.ENV[key];
    }
    return fallback;
  }

  w.SENHA_FISCAL = getEnv('SENHA_FISCAL', '1q2w');

  w.STORAGE_KEY_OMS = 'pcm_oms_mcr_v4';
  w.STORAGE_KEY_CURRENT = 'pcm_current_om_mcr_v4';
  w.STORAGE_KEY_MATERIAIS = 'pcm_materiais_mcr_v4';
  w.STORAGE_KEY_DEVICE = 'pcm_device_id_v4';
  w.STORAGE_KEY_HISTORICO = 'pcm_historico_v4';
  w.STORAGE_KEY_DESVIOS = 'pcm_desvios_v1';
  w.STORAGE_KEY_DESVIOS_ACUM = 'pcm_desvios_acumulados';
  w.STORAGE_KEY_DASHBOARD = 'pcm_dashboard_log';
  w.STORAGE_KEY_CONFIG = 'pcm_config_v1';

  w.SUPABASE_TABLE_OMS = 'oms';
  // Fallback local para desenvolvimento — em produção usar window.ENV
  w.SUPABASE_URL = getEnv('SUPABASE_URL', 'https://xigajcnuwnofbuqzohpg.supabase.co');
  w.SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZ2FqY251d25vZmJ1cXpvaHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4ODg0NTMsImV4cCI6MjA4NzQ2NDQ1M30.ljX9rtkGzqJF94hW_5V91jXRA6xfal5Dk7AqJLv8Jnc');
  w.SUPABASE_TABLE_MATERIAIS = 'pricelist2026';
})(window);