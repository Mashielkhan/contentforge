const http = require('node:http');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 3000);
const LLM_API_URL = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';
const DEMO_MODE = process.env.DEMO_MODE !== 'false';
const MAX_BODY_BYTES = 64 * 1024;

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST,GET,OPTIONS' });
  res.end(JSON.stringify(body));
}

function friendlyError(code, message) {
  return { error: { code, message } };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
        reject(new Error('payload_too_large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('invalid_json')); }
    });
    req.on('error', reject);
  });
}

function isHttpUrl(value) {
  try { const u = new URL(String(value || '').trim()); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
}

function cleanText(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ').trim();
}

function splitSentences(text) {
  return text.split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean);
}

async function fetchArticle(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'ContentForge/0.1 article reader' }, signal: controller.signal });
    if (!response.ok) throw new Error('page_unavailable');
    const html = await response.text();
    const title = cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '') || new URL(url).hostname;
    const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((match) => cleanText(match[1])).filter((item) => item.length > 20);
    const text = paragraphs.join(' ').trim() || cleanText(html);
    if (text.length < 40) throw new Error('empty_text');
    return { title, text: text.slice(0, 12000) };
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('page_timeout');
    throw error;
  } finally { clearTimeout(timer); }
}

async function callLLM(system, user) {
  if (!LLM_API_KEY) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LLM_API_KEY}` },
      body: JSON.stringify({ model: LLM_MODEL, temperature: 0.7, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
      signal: controller.signal,
    });
    if (response.status === 429) throw new Error('rate_limited');
    if (!response.ok) throw new Error('llm_unavailable');
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) throw new Error('llm_empty');
    return typeof content === 'string' ? JSON.parse(content) : content;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('llm_timeout');
    throw error;
  } finally { clearTimeout(timer); }
}

function validRepurpose(value) {
  return value && Array.isArray(value.thread) && value.thread.length === 5 && value.thread.every((item) => item && typeof item.text === 'string' && item.text.length <= 280) && typeof value.linkedin === 'string';
}

function validWrite(value) {
  return value && Array.isArray(value.captions) && value.captions.length === 3 && Array.isArray(value.hooks) && value.hooks.length === 3 && typeof value.newsletter === 'string' && Array.isArray(value.hashtags);
}

function demoRepurpose(article, tone) {
  const sentences = splitSentences(article.text);
  const points = sentences.slice(0, 3);
  const compact = (text, max = 260) => text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
  return {
    thread: [
      { label: 'Hook', text: compact(`${article.title}: here is the practical takeaway.`) },
      { label: 'Key point', text: compact(points[0] || `A clear idea from this article: ${article.title}.`) },
      { label: 'Key point', text: compact(points[1] || 'The strongest lessons become useful when turned into a repeatable habit.') },
      { label: 'Key point', text: compact(points[2] || 'Start with one small action, measure what happens, and improve from there.') },
      { label: 'CTA', text: compact(`Save this thread and share your take. Tone: ${tone.toLowerCase()}.`) },
    ],
    linkedin: `A useful read on ${article.title}.\n\nThe main lesson is simple: turn insight into a practical next step, then keep improving through feedback.\n\nWhat would you add?`,
  };
}

function demoWrite(input) {
  const brand = input.brandProfile?.name || 'your brand';
  const voice = input.brandProfile?.voice || 'clear and human';
  const topic = input.topic.trim();
  return {
    captions: [
      `${topic}. Built by ${brand} for people who want a clearer next step.`,
      `A better way to think about ${topic}: make it useful, make it simple, and make it yours.`,
      `${topic}, in a voice that stays ${voice.toLowerCase()}. What would you try first?`,
    ],
    hooks: [`The ${topic} mistake most people make`, `Before you post about ${topic}, try this`, `A simpler way to approach ${topic}`],
    newsletter: `Subject: A practical note about ${topic}\n\nHi there,\n\nHere is the useful idea: ${topic}. ${brand} is focused on making the next step easier and more practical.\n\nTry it this week and reply with what you learn.`,
    hashtags: ['#contentmarketing', '#creatorbusiness', '#smallbusiness', '#contentstrategy'],
  };
}

async function handleRepurpose(body) {
  if (!isHttpUrl(body.url)) throw new Error('invalid_url');
  const article = await fetchArticle(body.url);
  const generated = await callLLM(
    'You are ContentForge. Return JSON only with exactly thread (5 objects with label and text) and linkedin (string). Each thread text must be <=280 characters. Do not invent facts beyond the article.',
    JSON.stringify({ tone: body.tone || 'Professional', title: article.title, article: article.text }),
  );
  const result = generated && validRepurpose(generated) ? generated : demoRepurpose(article, body.tone || 'Professional');
  return { ...result, meta: { mode: generated ? 'llm' : 'demo', sourceTitle: article.title } };
}

async function handleWrite(body) {
  if (!String(body.topic || '').trim()) throw new Error('empty_topic');
  const profile = body.brandProfile || {};
  const generated = await callLLM(
    'You are ContentForge. Return JSON only with captions (3 strings), hooks (3 strings), newsletter (string), and hashtags (array of lowercase strings). Never invent brand facts not present in the profile.',
    JSON.stringify({ topic: String(body.topic).trim(), brandProfile: profile }),
  );
  const result = generated && validWrite(generated) ? generated : demoWrite(body);
  return { ...result, meta: { mode: generated ? 'llm' : 'demo' } };
}

async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method === 'GET' && new URL(req.url, `http://${req.headers.host}`).pathname === '/health') return json(res, 200, { ok: true, service: 'contentforge-api', llmConfigured: Boolean(LLM_API_KEY) });
  if (req.method !== 'POST') return json(res, 404, friendlyError('not_found', 'That ContentForge endpoint does not exist.'));
  const path = new URL(req.url, `http://${req.headers.host}`).pathname;
  try {
    const body = await readBody(req);
    if (path === '/repurpose') return json(res, 200, await handleRepurpose(body));
    if (path === '/write') return json(res, 200, await handleWrite(body));
    return json(res, 404, friendlyError('not_found', 'That ContentForge endpoint does not exist.'));
  } catch (error) {
    const code = error?.message || 'unknown';
    const messages = {
      invalid_json: ['invalid_request', 'Please try again with valid content.'],
      invalid_url: ['invalid_url', 'Please enter a valid http or https URL.'],
      page_unavailable: ['bad_url', 'We could not open that page. Check the URL or try another article.'],
      page_timeout: ['timeout', 'The page took too long to respond. Try again or use another URL.'],
      empty_text: ['empty_text', 'That page did not contain readable article text. It may be paywalled.'],
      empty_topic: ['empty_topic', 'Tell us what you want to write about first.'],
      rate_limited: ['rate_limit', 'The AI provider is busy. Please try again shortly.'],
      llm_timeout: ['timeout', 'Content generation timed out. Please try again.'],
      llm_unavailable: ['provider_error', 'The AI provider is temporarily unavailable. Please try again.'],
    };
    const [errorCode, message] = messages[code] || ['generation_error', DEMO_MODE ? 'Generation used the local demo writer because the AI service was unavailable.' : 'Content generation failed. Please try again.'];
    if (DEMO_MODE && (code === 'llm_unavailable' || code === 'llm_timeout' || code === 'llm_empty')) return json(res, 200, path === '/write' ? demoWrite(body) : demoRepurpose({ title: 'Your article', text: 'A useful idea to turn into practical content.' }, body.tone || 'Professional'));
    return json(res, code === 'rate_limited' ? 429 : 400, friendlyError(errorCode, message));
  }
}

const server = http.createServer(handler);

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing backend or choose another port with PORT.`);
  } else {
    console.error('ContentForge API failed to start:', error);
  }
  process.exitCode = 1;
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ContentForge API listening on http://0.0.0.0:${PORT}`);
  console.log(`LLM provider: ${LLM_API_KEY ? LLM_MODEL : 'not configured (demo fallback enabled)'}`);
});
