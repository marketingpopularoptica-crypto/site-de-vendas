// GET /api/precos — valores por grama do dia, usados pelo catálogo para mostrar os preços.
// Não devolve a cotação nem os multiplicadores, só o resultado final por grama.
import { lerFormula, taxasPorGrama, json } from '../../lib/precos.js';

export async function onRequestGet({ env }) {
  const salvo = await env.COTACAO_OURO.get('atual', 'json');
  if (!salvo) return json({ disponivel: false }, 200, { 'Cache-Control': 'no-store' });
  return json(
    { disponivel: true, atualizado_em: salvo.em, ...taxasPorGrama(salvo.valor, lerFormula(env)) },
    200,
    { 'Cache-Control': 'public, max-age=60' },
  );
}
