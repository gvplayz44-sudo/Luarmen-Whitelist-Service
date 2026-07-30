import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

const supabaseUrl = process.env.SB_URL;
const supabaseKey = process.env.SB_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());
app.use(express.static('dist'));

function jsonRes(res, body, status = 200) {
  return res.status(status).json(body);
}

async function requireApiKey(apiKey) {
  if (!apiKey) return { ok: false, error: 'API key required' };
  const { data } = await supabase
    .from('api_keys')
    .select('user_id, plan')
    .eq('key', apiKey)
    .maybeSingle();
  if (!data) return { ok: false, error: 'Invalid API key' };
  return { ok: true, user_id: data.user_id, plan: data.plan };
}

async function requireOwner(apiKey) {
  const result = await requireApiKey(apiKey);
  if (!result.ok) return result;
  if (result.plan !== 'owner') return { ok: false, error: 'Owner only' };
  return result;
}

app.get('/health', (req, res) => res.send('OK'));

app.post('/api/auth', async (req, res) => {
  const { username, password, api_key } = req.body;
  if (!username || !password) return jsonRes(res, { success: false, message: 'Username and password required' }, 400);

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (existing) return jsonRes(res, { success: false, message: 'Username already taken' }, 400);

  let plan = 'free';
  let finalKey = api_key;
  let isOwner = false;

  if (!api_key || api_key.trim() === '') {
    finalKey = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    plan = 'free';
  } else if (api_key === process.env.OWNER_SIGNUP_KEY) {
    isOwner = true;
    plan = 'owner';
    finalKey = api_key;
  } else if (api_key.startsWith('sk_')) {
    const { data: existingKey } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key', api_key)
      .maybeSingle();
    if (existingKey) return jsonRes(res, { success: false, message: 'API key already in use' }, 400);
    finalKey = api_key;
    plan = 'free';
  } else {
    return jsonRes(res, { success: false, message: 'Invalid API key format' }, 400);
  }

  const { data: newUser, error: userError } = await supabase
    .from('profiles')
    .insert({
      username,
      password,
      plan,
      whitelisted: isOwner ? true : false,
      whitelist_plan: isOwner ? 'owner' : null,
    })
    .select()
    .single();

  if (userError) return jsonRes(res, { success: false, message: 'Failed to create user' }, 500);

  const { error: keyError } = await supabase
    .from('api_keys')
    .insert({
      user_id: newUser.id,
      key: finalKey,
      plan,
    });
  if (keyError) {
    await supabase.from('profiles').delete().eq('id', newUser.id);
    return jsonRes(res, { success: false, message: 'Failed to save API key' }, 500);
  }

  await supabase
    .from('key_check_list')
    .insert({
      script_key: finalKey,
      user_id: newUser.id,
      plan,
      duration_days: plan !== 'free' ? 30 : 0,
      expires_at: plan !== 'free' ? new Date(Date.now() + 30 * 86400000).toISOString() : null,
      is_active: true,
    });

  if (isOwner) {
    await supabase
      .from('site_settings')
      .upsert({ key: 'global_kill_switch', value: 'false' }, { onConflict: 'key' });
  }

  return jsonRes(res, {
    success: true,
    api_key: finalKey,
    plan,
    username,
    isOwner,
  });
});

app.post('/api/verify', async (req, res) => {
  const { key } = req.body;
  if (!key) return jsonRes(res, { valid: false, message: 'Key required' }, 400);

  const { data } = await supabase
    .from('api_keys')
    .select('plan, user_id, profiles!inner(username, blacklisted, blacklist_reason)')
    .eq('key', key)
    .maybeSingle();

  if (!data) return jsonRes(res, { valid: false, message: 'Invalid API key' }, 401);
  const prof = data.profiles;
  if (prof?.blacklisted) return jsonRes(res, { valid: false, message: 'Blacklisted' }, 403);

  return jsonRes(res, {
    valid: true,
    username: prof?.username,
    plan: data.plan,
  });
});

app.post('/api/upload', async (req, res) => {
  const { api_key, script_name, source_code } = req.body;
  if (!api_key || !script_name || !source_code) return jsonRes(res, { error: 'Missing fields' }, 400);

  const keyCheck = await requireApiKey(api_key);
  if (!keyCheck.ok) return jsonRes(res, { error: keyCheck.error }, 401);

  const planLimits = { owner: 999, pro: 10, premium: 6, basic: 3, free: 0 };
  const max = planLimits[keyCheck.plan] || 0;
  if (keyCheck.plan !== 'owner') {
    const { count } = await supabase
      .from('scripts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', keyCheck.user_id);
    if (count >= max) return jsonRes(res, { error: `Plan limit reached. Max ${max} scripts.` }, 403);
  }

  const loaderId = Array.from({ length: 32 }, () =>
    '0123456789abcdef'.charAt(Math.floor(Math.random() * 16))
  ).join('');
  const scriptKey = Array.from({ length: 32 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))
  ).join('');
  const loaderPath = `/files/v4/loaders/${loaderId}.lua`;

  const { data: script, error } = await supabase
    .from('scripts')
    .insert({
      user_id: keyCheck.user_id,
      script_name,
      source_code,
      script_key: scriptKey,
      loader_path: loaderPath,
      enabled: true,
      keyless_mode: false,
      downloads: 0,
    })
    .select()
    .single();

  if (error) return jsonRes(res, { error: 'Failed to upload script' }, 500);

  return jsonRes(res, {
    success: true,
    script,
    loader_path: loaderPath,
    script_key: scriptKey,
    loader_id: loaderId,
    loadstring: `script_key="${scriptKey}"; loadstring(game:HttpGet("https://luarmen.railway.app${loaderPath}"))()`,
  });
});

app.get('/api/scripts', async (req, res) => {
  const apiKey = req.query.api_key;
  if (!apiKey) return jsonRes(res, { error: 'API key required' }, 401);

  const keyCheck = await requireApiKey(apiKey);
  if (!keyCheck.ok) return jsonRes(res, { error: keyCheck.error }, 401);

  const { data } = await supabase
    .from('scripts')
    .select('id, script_name, script_key, loader_path, enabled, keyless_mode, downloads, created_at')
    .eq('user_id', keyCheck.user_id)
    .order('created_at', { ascending: false });

  return jsonRes(res, { scripts: data || [] });
});

app.get('/api/stats', async (req, res) => {
  const apiKey = req.query.api_key;
  if (!apiKey) return jsonRes(res, { error: 'API key required' }, 401);

  const keyCheck = await requireApiKey(apiKey);
  if (!keyCheck.ok) return jsonRes(res, { error: keyCheck.error }, 401);

  const { count: totalScripts } = await supabase
    .from('scripts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', keyCheck.user_id);

  const { count: totalDownloads } = await supabase
    .from('script_downloads')
    .select('*', { count: 'exact', head: true })
    .eq('script_key', apiKey);

  return jsonRes(res, { total_scripts: totalScripts || 0, total_downloads: totalDownloads || 0 });
});

app.post('/api/update-plan', async (req, res) => {
  const { api_key, user_id, new_plan } = req.body;
  if (!api_key || !user_id || !new_plan) return jsonRes(res, { error: 'Missing fields' }, 400);

  const ownerCheck = await requireOwner(api_key);
  if (!ownerCheck.ok) return jsonRes(res, { error: ownerCheck.error }, 403);

  const { data: targetUser } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user_id)
    .maybeSingle();
  if (!targetUser) return jsonRes(res, { error: 'User not found' }, 404);
  if (targetUser.plan === 'owner') return jsonRes(res, { error: 'Cannot modify owner account' }, 403);

  await supabase
    .from('profiles')
    .update({ plan: new_plan, whitelisted: new_plan !== 'free' })
    .eq('id', user_id);

  await supabase
    .from('api_keys')
    .update({ plan: new_plan })
    .eq('user_id', user_id);

  return jsonRes(res, { success: true, plan: new_plan });
});

app.get('/api/script/:id', async (req, res) => {
  const { id } = req.params;
  const apiKey = req.query.api_key;
  if (!apiKey) return jsonRes(res, { error: 'API key required' }, 401);

  const keyCheck = await requireApiKey(apiKey);
  if (!keyCheck.ok) return jsonRes(res, { error: keyCheck.error }, 401);

  const { data } = await supabase
    .from('scripts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!data) return jsonRes(res, { error: 'Script not found' }, 404);
  if (data.user_id !== keyCheck.user_id && keyCheck.plan !== 'owner') {
    return jsonRes(res, { error: 'Not authorized' }, 403);
  }
  return jsonRes(res, { script: data });
});

app.delete('/api/script/:id', async (req, res) => {
  const { id } = req.params;
  const apiKey = req.query.api_key;
  if (!apiKey) return jsonRes(res, { error: 'API key required' }, 401);

  const keyCheck = await requireApiKey(apiKey);
  if (!keyCheck.ok) return jsonRes(res, { error: keyCheck.error }, 401);

  const { data: script } = await supabase
    .from('scripts')
    .select('user_id')
    .eq('id', id)
    .maybeSingle();
  if (!script) return jsonRes(res, { error: 'Script not found' }, 404);

  if (script.user_id !== keyCheck.user_id && keyCheck.plan !== 'owner') {
    return jsonRes(res, { error: 'Not authorized' }, 403);
  }

  await supabase.from('scripts').delete().eq('id', id);
  return jsonRes(res, { success: true });
});

app.post('/api/script/toggle', async (req, res) => {
  const { script_id, api_key, enabled } = req.body;
  if (!script_id || !api_key) return jsonRes(res, { error: 'Missing fields' }, 400);

  const keyCheck = await requireApiKey(api_key);
  if (!keyCheck.ok) return jsonRes(res, { error: keyCheck.error }, 401);

  const { data: script } = await supabase
    .from('scripts')
    .select('user_id')
    .eq('id', script_id)
    .maybeSingle();
  if (!script) return jsonRes(res, { error: 'Script not found' }, 404);

  if (script.user_id !== keyCheck.user_id && keyCheck.plan !== 'owner') {
    return jsonRes(res, { error: 'Not authorized' }, 403);
  }

  const newStatus = enabled !== undefined ? enabled : !script.enabled;
  await supabase.from('scripts').update({ enabled: newStatus }).eq('id', script_id);

  return jsonRes(res, { success: true, enabled: newStatus });
});

app.post('/api/script/toggle-keyless', async (req, res) => {
  const { script_id, api_key, keyless_enabled } = req.body;
  if (!script_id || !api_key) return jsonRes(res, { error: 'Missing fields' }, 400);

  const keyCheck = await requireApiKey(api_key);
  if (!keyCheck.ok) return jsonRes(res, { error: keyCheck.error }, 401);

  const { data: script } = await supabase
    .from('scripts')
    .select('user_id, keyless_mode')
    .eq('id', script_id)
    .maybeSingle();
  if (!script) return jsonRes(res, { error: 'Script not found' }, 404);

  if (script.user_id !== keyCheck.user_id && keyCheck.plan !== 'owner') {
    return jsonRes(res, { error: 'Not authorized' }, 403);
  }

  const newStatus = keyless_enabled !== undefined ? keyless_enabled : !script.keyless_mode;
  await supabase.from('scripts').update({ keyless_mode: newStatus }).eq('id', script_id);

  return jsonRes(res, { success: true, keyless_enabled: newStatus });
});

app.get('/api/owner/all-users', async (req, res) => {
  const apiKey = req.query.api_key;
  if (!apiKey) return jsonRes(res, { error: 'API key required' }, 401);

  const ownerCheck = await requireOwner(apiKey);
  if (!ownerCheck.ok) return jsonRes(res, { error: ownerCheck.error }, 403);

  const { data } = await supabase
    .from('profiles')
    .select('id, username, plan, whitelisted, blacklisted, blacklist_reason, created_at')
    .order('created_at', { ascending: false });

  return jsonRes(res, { users: data || [] });
});

app.get('/api/owner/all-scripts', async (req, res) => {
  const apiKey = req.query.api_key;
  if (!apiKey) return jsonRes(res, { error: 'API key required' }, 401);

  const ownerCheck = await requireOwner(apiKey);
  if (!ownerCheck.ok) return jsonRes(res, { error: ownerCheck.error }, 403);

  const { data } = await supabase
    .from('scripts')
    .select('*, profiles(username)')
    .order('created_at', { ascending: false });

  return jsonRes(res, { scripts: data || [] });
});

app.post('/api/owner/whitelist', async (req, res) => {
  const { api_key, user_id, plan, duration_days } = req.body;
  if (!api_key || !user_id || !plan) return jsonRes(res, { error: 'Missing fields' }, 400);

  const ownerCheck = await requireOwner(api_key);
  if (!ownerCheck.ok) return jsonRes(res, { error: ownerCheck.error }, 403);

  const { data: targetUser } = await supabase
    .from('profiles')
    .select('id, plan')
    .eq('id', user_id)
    .maybeSingle();
  if (!targetUser) return jsonRes(res, { error: 'User not found' }, 404);
  if (targetUser.plan === 'owner') return jsonRes(res, { error: 'Cannot modify owner account' }, 403);

  const expiresAt = duration_days > 0 ? new Date(Date.now() + duration_days * 86400000).toISOString() : null;

  await supabase
    .from('profiles')
    .update({
      plan,
      whitelisted: true,
      whitelist_plan: plan,
      whitelist_expires: expiresAt,
      whitelisted_at: new Date().toISOString(),
      blacklisted: false,
      blacklist_reason: null,
      blacklisted_at: null,
    })
    .eq('id', user_id);

  await supabase
    .from('api_keys')
    .update({ plan })
    .eq('user_id', user_id);

  const { data: keyData } = await supabase
    .from('api_keys')
    .select('key')
    .eq('user_id', user_id)
    .maybeSingle();
  if (keyData) {
    await supabase
      .from('key_check_list')
      .update({
        plan,
        is_active: true,
        expires_at: expiresAt,
        duration_days: duration_days || 0,
      })
      .eq('script_key', keyData.key);
  }

  return jsonRes(res, { success: true, plan, expires_at: expiresAt });
});

app.post('/api/owner/blacklist', async (req, res) => {
  const { api_key, user_id, reason } = req.body;
  if (!api_key || !user_id) return jsonRes(res, { error: 'Missing fields' }, 400);

  const ownerCheck = await requireOwner(api_key);
  if (!ownerCheck.ok) return jsonRes(res, { error: ownerCheck.error }, 403);

  const { data: targetUser } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user_id)
    .maybeSingle();
  if (!targetUser) return jsonRes(res, { error: 'User not found' }, 404);
  if (targetUser.plan === 'owner') return jsonRes(res, { error: 'Cannot blacklist owner' }, 403);

  await supabase
    .from('profiles')
    .update({
      plan: 'free',
      blacklisted: true,
      blacklist_reason: reason || 'No reason provided',
      blacklisted_at: new Date().toISOString(),
      whitelisted: false,
      whitelist_plan: null,
      whitelist_expires: null,
    })
    .eq('id', user_id);

  await supabase
    .from('api_keys')
    .update({ plan: 'free' })
    .eq('user_id', user_id);

  const { data: keyData } = await supabase
    .from('api_keys')
    .select('key')
    .eq('user_id', user_id)
    .maybeSingle();
  if (keyData) {
    await supabase
      .from('key_check_list')
      .update({ plan: 'free', is_active: false })
      .eq('script_key', keyData.key);
  }

  return jsonRes(res, { success: true, reason: reason || 'No reason provided' });
});

app.delete('/api/owner/blacklist', async (req, res) => {
  const { api_key, user_id } = req.query;
  if (!api_key || !user_id) return jsonRes(res, { error: 'Missing fields' }, 400);

  const ownerCheck = await requireOwner(api_key);
  if (!ownerCheck.ok) return jsonRes(res, { error: ownerCheck.error }, 403);

  await supabase
    .from('profiles')
    .update({
      blacklisted: false,
      blacklist_reason: null,
      blacklisted_at: null,
      plan: 'free',
      whitelisted: false,
    })
    .eq('id', user_id);

  return jsonRes(res, { success: true });
});

app.delete('/api/owner/delete-user', async (req, res) => {
  const { api_key, user_id } = req.query;
  if (!api_key || !user_id) return jsonRes(res, { error: 'Missing fields' }, 400);

  const ownerCheck = await requireOwner(api_key);
  if (!ownerCheck.ok) return jsonRes(res, { error: ownerCheck.error }, 403);

  const { data: targetUser } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user_id)
    .maybeSingle();
  if (!targetUser) return jsonRes(res, { error: 'User not found' }, 404);
  if (targetUser.plan === 'owner') return jsonRes(res, { error: 'Cannot delete owner' }, 403);

  await supabase.from('key_check_list').delete().eq('user_id', user_id);
  await supabase.from('user_connections').delete().eq('user_id', user_id);
  await supabase.from('scripts').delete().eq('user_id', user_id);
  await supabase.from('api_keys').delete().eq('user_id', user_id);
  await supabase.from('activity_log').delete().eq('user_id', user_id);
  await supabase.from('profiles').delete().eq('id', user_id);

  return jsonRes(res, { success: true });
});

app.get('/api/owner/kill-switch', async (req, res) => {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'global_kill_switch')
    .maybeSingle();
  return jsonRes(res, { enabled: data?.value === 'true' });
});

app.post('/api/owner/kill-switch', async (req, res) => {
  const { api_key, enabled } = req.body;
  if (!api_key) return jsonRes(res, { error: 'API key required' }, 400);

  const ownerCheck = await requireOwner(api_key);
  if (!ownerCheck.ok) return jsonRes(res, { error: ownerCheck.error }, 403);

  await supabase
    .from('site_settings')
    .upsert({ key: 'global_kill_switch', value: enabled ? 'true' : 'false' }, { onConflict: 'key' });

  return jsonRes(res, { success: true, enabled });
});

app.get('/api/owner/source-view', async (req, res) => {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'allow_source_view')
    .maybeSingle();
  return jsonRes(res, { enabled: data?.value === 'true' });
});

app.post('/api/owner/source-view', async (req, res) => {
  const { api_key, enabled } = req.body;
  if (!api_key) return jsonRes(res, { error: 'API key required' }, 400);

  const ownerCheck = await requireOwner(api_key);
  if (!ownerCheck.ok) return jsonRes(res, { error: ownerCheck.error }, 403);

  await supabase
    .from('site_settings')
    .upsert({ key: 'allow_source_view', value: enabled ? 'true' : 'false' }, { onConflict: 'key' });

  return jsonRes(res, { success: true, enabled });
});

app.get('/files/v4/loaders/:id.lua', async (req, res) => {
  const loaderId = req.params.id;
  const loaderPath = `/files/v4/loaders/${loaderId}.lua`;
  const userAgent = req.headers['user-agent'] || '';
  const isBrowser = ['Mozilla', 'Chrome', 'Safari', 'Firefox', 'Edge'].some(b => userAgent.includes(b));
  const allowSourceView = (await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'allow_source_view')
    .maybeSingle())?.data?.value === 'true';

  if (isBrowser && !allowSourceView) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html><head><title>Not Authorized</title>
      <style>body{background:#0a0c14;color:#eef0f7;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;}
      .container{padding:40px 20px;max-width:420px;}h1{font-size:26px;margin-bottom:12px;}p{color:#8b90a8;}</style>
      </head><body>
      <div class="container"><div style="font-size:64px;margin-bottom:20px;">🚫</div><h1>Not Authorized</h1><p>You are not allowed to view these files.</p></div>
      </body></html>
    `);
  }

  const { data: script, error } = await supabase
    .from('scripts')
    .select('source_code, script_key, enabled, keyless_mode')
    .eq('loader_path', loaderPath)
    .maybeSingle();

  if (error || !script) return res.status(404).send('-- Script not found');
  if (!script.enabled) return res.status(403).send('-- Script disabled');

  if (!script.keyless_mode) {
    const providedKey = req.query.key;
    if (!providedKey || providedKey !== script.script_key) return res.status(403).send('-- Invalid key');

    const { data: keyCheck } = await supabase
      .from('key_check_list')
      .select('*')
      .eq('script_key', providedKey)
      .eq('is_active', true)
      .maybeSingle();
    if (!keyCheck) return res.status(403).send('-- Key not active');
    if (keyCheck.expires_at && new Date(keyCheck.expires_at) < new Date()) {
      await supabase.from('key_check_list').update({ is_active: false }).eq('id', keyCheck.id);
      return res.status(403).send('-- Key expired');
    }

    const hwid = req.query.hwid;
    if (hwid) {
      const { data: binding } = await supabase
        .from('hwid_bindings')
        .select('hwid')
        .eq('script_key', script.script_key)
        .eq('hwid', hwid)
        .maybeSingle();
      if (!binding) {
        await supabase.from('hwid_bindings').insert({ script_key: script.script_key, hwid });
      }
    }
    await supabase
      .from('script_downloads')
      .insert({
        script_key: script.script_key,
        hwid: hwid || 'unknown',
        ip_address: req.headers['x-forwarded-for'] || 'unknown',
        user_agent: userAgent,
      });
    await supabase
      .from('scripts')
      .update({ downloads: supabase.raw('downloads + 1'), last_used: new Date().toISOString() })
      .eq('script_key', script.script_key);
  }

  res.set('Content-Type', 'text/plain');
  res.send(script.source_code);
});

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Luarmen server running on port ${PORT}`);
});