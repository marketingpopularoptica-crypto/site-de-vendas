// Cálculo de preço por grama a partir da cotação do ouro 18k do dia.
// Os multiplicadores vêm do segredo FORMULA (JSON) gravado na Cloudflare,
// nunca do código, para que ninguém veja a fórmula pelo repositório.
//
// Formato esperado de FORMULA (os números reais ficam só na Cloudflare):
// {
//   "gerais":   { "fator": F, "acrescimo": A, "margem": M },
//   "aliancas": { "k10": X, "k18": Y, "margem": M, "divisor": D }
// }

export function lerFormula(env) {
  if (!env.FORMULA) throw new Error('Segredo FORMULA não configurado');
  return JSON.parse(env.FORMULA);
}



// Valores por grama que o site usa para montar o preço de cada peça.
export function taxasPorGrama(cotacao18k, f) {
  const g = f.gerais;
  const a = f.aliancas;
  return {
    // joias em geral: preço = gerais x peso da peça
    gerais: cotacao18k * g.fator * (1 + g.acrescimo) * g.margem,
    // alianças: preço do par = aliancaXX x (peso catálogo / divisor) x (soma dos tamanhos)
    alianca10: cotacao18k * a.k10 * a.margem,
    alianca18: cotacao18k * a.k18 * a.margem,
    divisor: a.divisor,
  };
}

export function json(dados, status = 200, extras = {}) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extras },
  });
}
