// POST /api/cotacao — o chefe informa a cotação do ouro 18k do dia (página /cotacao).
// Corpo: { senha, valor }  · sem "valor", só confere a senha e devolve a cotação atual.
import { json } from '../../lib/precos.js';

function senhaConfere(digitada, correta) {
  if (!correta || typeof digitada !== 'string' || digitada.length !== correta.length) return false;
  let dif = 0;
  for (let i = 0; i < correta.length; i++) dif |= digitada.charCodeAt(i) ^ correta.charCodeAt(i);
  return dif === 0;
}

function reais(v) {
  return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

async function avisarWhatsApp(env, texto) {
  if (!env.WHATSAPP_NUMERO || !env.CALLMEBOT_APIKEY) return;
  const url = 'https://api.callmebot.com/whatsapp.php?' + new URLSearchParams({
    phone: env.WHATSAPP_NUMERO, text: texto, apikey: env.CALLMEBOT_APIKEY,
  });
  try { await fetch(url); } catch (e) { /* a cotação já foi salva; o aviso é só cortesia */ }
}

export async function onRequestPost({ request, env, waitUntil }) {
  let corpo;
  try { corpo = await request.json(); } catch (e) { return json({ erro: 'Pedido inválido.' }, 400); }

  if (!senhaConfere(corpo.senha, env.ADMIN_SENHA)) {
    await new Promise((r) => setTimeout(r, 1000)); // freia tentativas de adivinhar a senha
    return json({ erro: 'Senha incorreta.' }, 401);
  }

  if (corpo.valor === undefined || corpo.valor === null || corpo.valor === '') {
    return json({ ok: true, atual: await env.COTACAO_OURO.get('atual', 'json') });
  }

  // aceita "487,30", "487.30" e "1.487,30"
  const texto = String(corpo.valor).trim().replace(/^R\$\s*/i, '');
  const valor = Number(texto.includes(',') ? texto.replace(/\./g, '').replace(',', '.') : texto);
  if (!Number.isFinite(valor) || valor < 100 || valor > 5000) {
    return json({ erro: 'Valor fora do esperado. Digite o valor do grama do 18k, ex.: 487,30' }, 400);
  }

  const agora = new Date();
  const registro = { valor: Math.round(valor * 100) / 100, em: agora.toISOString() };
  await env.COTACAO_OURO.put('atual', JSON.stringify(registro));
  await env.COTACAO_OURO.put('historico:' + registro.em.slice(0, 10), JSON.stringify(registro));

  const hora = agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  waitUntil(avisarWhatsApp(env, `✅ Cotação do ouro 18k aplicada: ${reais(registro.valor)}/g\nPreços do site atualizados (${hora}).`));

  return json({ ok: true, atual: registro });
}
