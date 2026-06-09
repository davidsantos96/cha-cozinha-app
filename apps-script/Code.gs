// Code.gs — Google Apps Script
// ─────────────────────────────────────────────────────────────────────────────
// COMO USAR:
//   1. Na sua planilha: Extensions > Apps Script
//   2. Apague o conteúdo padrão e cole este arquivo inteiro
//   3. Salve (Ctrl+S)
//   4. Clique em "Deploy" > "New deployment"
//   5. Type: Web App
//   6. Execute as: Me
//   7. Who has access: Anyone
//   8. Clique em Deploy e copie a URL gerada
//   9. Cole a URL no arquivo src/scripts/api.js (variável SCRIPT_URL)
// ─────────────────────────────────────────────────────────────────────────────

var SHEET_PRESENTES    = 'Presentes';
var SHEET_CONFIRMACOES = 'Confirmacoes';

// ── GET: retorna lista de presentes disponíveis ──────────────────────────────
function doGet(e) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_PRESENTES);

    if (!sheet) {
      var abas = ss.getSheets().map(function(s){ return s.getName(); }).join(', ');
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'Aba "' + SHEET_PRESENTES + '" não encontrada. Abas disponíveis: ' + abas }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data  = sheet.getDataRange().getValues();

    var presentes = [];
    for (var i = 1; i < data.length; i++) {
      // Coluna D (índice 3) = Status
      if (data[i][3] === 'Disponível') {
        presentes.push({
          id:       data[i][0],   // Coluna A — ID
          nome:     data[i][1],   // Coluna B — Presente
          categoria: data[i][2]   // Coluna C — Categoria
        });
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, presentes: presentes }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── POST: registra confirmação e reserva presente ────────────────────────────
function doPost(e) {
  var lock     = LockService.getScriptLock();
  var acquired = lock.tryLock(10000);

  if (!acquired) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'lock_timeout' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var payload   = JSON.parse(e.postData.contents);
    var nome      = (payload.nome      || '').toString().trim();
    var telefone  = (payload.telefone  || '').toString().trim();
    var presenca  = (payload.presenca  || '').toString();           // 'sim' | 'nao'
    var presenteId = payload.presenteId ? payload.presenteId.toString() : null;
    var presenteNome = '';

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // ── Verificar confirmação duplicada por telefone ──────────────────────────
    var sheetConfCheck = ss.getSheetByName(SHEET_CONFIRMACOES);
    if (sheetConfCheck && sheetConfCheck.getLastRow() > 1) {
      var telefoneSoDigitos = telefone.replace(/\D/g, '');
      var confDados = sheetConfCheck.getRange(2, 1, sheetConfCheck.getLastRow() - 1, 2).getValues();
      for (var c = 0; c < confDados.length; c++) {
        var telRegistrado = String(confDados[c][1]).replace(/\D/g, '');
        if (telRegistrado === telefoneSoDigitos) {
          return ContentService
            .createTextOutput(JSON.stringify({ ok: false, error: 'already_confirmed' }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // ── Reservar presente (apenas se confirmou presença e escolheu um item) ──
    if (presenca === 'sim' && presenteId) {
      var sheetPresentes = ss.getSheetByName(SHEET_PRESENTES);
      var dados = sheetPresentes.getDataRange().getValues();
      var linhaPresente = -1;

      for (var i = 1; i < dados.length; i++) {
        if (String(dados[i][0]) === presenteId) {
          linhaPresente = i + 1; // Planilha é 1-indexed
          presenteNome  = dados[i][1];
          break;
        }
      }

      if (linhaPresente === -1) {
        return ContentService
          .createTextOutput(JSON.stringify({ ok: false, error: 'present_not_found' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // Verificar status DENTRO do lock para evitar duplicidade
      var statusAtual = sheetPresentes.getRange(linhaPresente, 4).getValue();
      if (statusAtual !== 'Disponível') {
        return ContentService
          .createTextOutput(JSON.stringify({ ok: false, error: 'already_taken' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // Reservar: preenche colunas D, E, F, G, H
      sheetPresentes.getRange(linhaPresente, 4).setValue('Escolhido');   // Status
      sheetPresentes.getRange(linhaPresente, 5).setValue(nome);          // Escolhido por
      sheetPresentes.getRange(linhaPresente, 6).setValue(telefone);      // Telefone
      sheetPresentes.getRange(linhaPresente, 7).setValue('Confirmado');  // Presença
      sheetPresentes.getRange(linhaPresente, 8).setValue(new Date());    // Data
    }

    // ── Registrar na aba Confirmacoes ─────────────────────────────────────────
    var sheetConf = ss.getSheetByName(SHEET_CONFIRMACOES);
    if (!sheetConf) {
      var abas = ss.getSheets().map(function(s){ return s.getName(); }).join(', ');
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'Aba "' + SHEET_CONFIRMACOES + '" não encontrada. Abas disponíveis: ' + abas }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    sheetConf.appendRow([
      nome,
      telefone,
      presenca === 'sim' ? 'Confirmado' : 'Não comparecerá',
      presenteNome,
      new Date()
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
