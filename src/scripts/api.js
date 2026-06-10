// src/scripts/api.js
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  Cole aqui a URL gerada ao publicar o Apps Script como Web App.
//     Extensions > Apps Script > Implantar > Nova implantação > Web App
// ─────────────────────────────────────────────────────────────────────────────
var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyEqDBjDVzzcwI8sc6Hl0iUr0Jhn506zYaTXs1YD77BcF9QiuHuGngXDQPgXZho7QY9/exec';

var Api = {
  /**
   * Busca a lista de presentes disponíveis na planilha.
   * @returns {Promise<{ok: boolean, presentes: Array}>}
   */
  fetchGifts: function () {
    return fetch(SCRIPT_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('network_error');
        return res.json();
      });
  },

  /**
   * Envia a confirmação de presença e (opcionalmente) reserva um presente.
   * Usa Content-Type: text/plain para evitar preflight CORS com Apps Script.
   *
    * @param {{nome: string, telefone: string, presenca: string, presenteId: string|null, contributionType: string|null}} data
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  submitConfirmation: function (data) {
    return fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('network_error');
        return res.json();
      });
  }
};
