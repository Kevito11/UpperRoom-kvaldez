/**
 * CONFERENCIA DE JÓVENES 2026 - UPPER ROOM IBC
 * Google Apps Script para captura de datos en Google Sheets, actualización de boletas y envío automático de correos.
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Abre tu Google Sheet (https://sheets.google.com)
 * 2. En el menú superior ve a: Extensiones > Apps Script
 * 3. Borra cualquier código existente y pega TODO este archivo.
 * 4. Guarda con Ctrl + S. Al recargar la hoja verás el menú: "🛠️ UPPER ROOM ADMIN".
 * 5. Haz clic en "Implementar" (botón azul arriba a la derecha) > "Administrar implementaciones" o "Nueva implementación".
 * 6. Tipo: Selecciona el ícono de engranaje ⚙️ y elige "Aplicación web".
 * 7. Configuración:
 *    - Descripción: "Webhook Registro y Merch Despierta 2026"
 *    - Ejecutar como: "Yo" (tu cuenta de Google)
 *    - Quién tiene acceso: "Cualquiera" (IMPORTANTE: para permitir peticiones POST desde la web).
 * 8. Haz clic en "Implementar", autoriza los permisos y copia la URL generada.
 * 9. Pega esa URL en tu archivo .env como VITE_GOOGLE_SHEETS_WEBHOOK_URL.
 */

// =========================================================================
// 1. RECEPTOR PRINCIPAL DE PETICIONES (doPost)
// =========================================================================
function doPost(e) {
  try {
    if (!e || !e.postData) {
      Logger.log("⚠️ AVISO: 'doPost' fue ejecutado manualmente desde el editor de Apps Script.");
      Logger.log("👉 Para probar el script directamente desde el editor, selecciona 'probarCorreoRegistroBoleta' y pulsa 'Ejecutar'.");
      return ContentService.createTextOutput(JSON.stringify({
        status: "notice",
        message: "doPost espera una petición HTTP POST real de la web. Para pruebas dentro del editor usa las funciones de prueba del menú."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Registros Conferencia");
    
    if (!sheet) {
      sheet = ss.insertSheet("Registros Conferencia");
    }
    
    inicializarEncabezadosSiEsNecesario(sheet);

    // ---------------------------------------------------------------------
    // CASO A: Actualización de Ticket Existente (ADD_MERCH)
    // ---------------------------------------------------------------------
    if (data.action === "ADD_MERCH" || data.action === "addMerch") {
      var ticketCode = (data.ticketCode || "").toString().toUpperCase().trim();
      if (!ticketCode) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Se requiere el parámetro ticketCode para vincular la mercancía."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "No se encontraron registros en la hoja para localizar el boleto: " + ticketCode
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var lastCol = Math.max(sheet.getLastColumn(), 14);
      var allRange = sheet.getRange(1, 1, lastRow, lastCol);
      var allData = allRange.getValues();
      var headers = allData[0];

      // Mapeo dinámico de columnas según encabezados
      var colTicket = 1; // Columna B por defecto
      var colFirst = 2;  // Columna C (Nombre)
      var colLast = 3;   // Columna D (Apellidos)
      var colEmail = 4;  // Columna E (Correo)
      var colChurch = 7; // Columna H (Iglesia)
      var colTaller = 8; // Columna I (Taller)
      var colMerch = 9;  // Columna J (Pre-orden Merch)
      var colNotif = 13; // Columna N (Notificación Merch)

      for (var h = 0; h < headers.length; h++) {
        var hName = (headers[h] || "").toString().toLowerCase().trim();
        if (hName.indexOf("código") >= 0 || hName.indexOf("codigo") >= 0 || (hName.indexOf("ticket") >= 0 && hName.indexOf("estado") < 0)) {
          colTicket = h;
        } else if (hName.indexOf("nombre") >= 0 && hName.indexOf("completo") < 0) {
          colFirst = h;
        } else if (hName.indexOf("apellido") >= 0) {
          colLast = h;
        } else if (hName.indexOf("correo") >= 0 || hName.indexOf("email") >= 0) {
          colEmail = h;
        } else if (hName.indexOf("iglesia") >= 0) {
          colChurch = h;
        } else if (hName.indexOf("taller") >= 0) {
          colTaller = h;
        } else if (hName.indexOf("merch") >= 0 && hName.indexOf("notific") < 0) {
          colMerch = h;
        } else if (hName.indexOf("notific") >= 0 && hName.indexOf("merch") >= 0) {
          colNotif = h;
        }
      }

      // Buscar la fila correspondiente al ticketCode
      var targetRowIndex = -1;
      var foundRow = null;
      for (var r = 1; r < allData.length; r++) {
        var rowCode = (allData[r][colTicket] || "").toString().toUpperCase().trim();
        if (rowCode === ticketCode) {
          targetRowIndex = r + 1; // 1-indexed para getRange
          foundRow = allData[r];
          break;
        }
      }

      if (targetRowIndex === -1 || !foundRow) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "No se encontró ningún registro con el código de boleto: " + ticketCode
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // Extraer datos del asistente
      var firstName = data.firstName || foundRow[colFirst] || "Asistente";
      var lastName = data.lastName || foundRow[colLast] || "";
      var email = data.email || foundRow[colEmail] || "";
      var church = foundRow[colChurch] || "Invitado";
      var taller = foundRow[colTaller] || "Sin taller";
      var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");

      var merchSummary = data.merch || "Merch Oficial Seleccionada";
      var merchTotal = data.merchTotal || 0;

      // Actualizar la fila en la hoja de cálculo (Columna Merch y Columna Notificación)
      sheet.getRange(targetRowIndex, colMerch + 1).setValue(merchSummary);
      sheet.getRange(targetRowIndex, colNotif + 1).setValue("MERCH VINCULADA (" + timestamp + ")");

      // Enviar correo con confirmación de Merch e Instrucciones de Pago
      if (email && email.indexOf("@") >= 0) {
        enviarCorreoConfirmacionMerchAgregada({
          ticketCode: ticketCode,
          firstName: firstName,
          lastName: lastName,
          email: email,
          church: church,
          taller: taller,
          merch: merchSummary,
          merchTotal: merchTotal,
          timestamp: timestamp
        });
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Merch vinculada exitosamente al ticket " + ticketCode + " y correo de instrucciones de pago enviado.",
        ticketCode: ticketCode,
        email: email,
        merch: merchSummary,
        merchTotal: merchTotal
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ---------------------------------------------------------------------
    // CASO B: Sincronización Masiva de Asistencias (Check-In)
    // ---------------------------------------------------------------------
    if (data.action === "syncAttendance" || data.action === "batchCheckIn") {
      var checkIns = data.checkIns || [];
      var lastRow = sheet.getLastRow();
      var updatedCount = 0;

      if (lastRow > 1 && checkIns.length > 0) {
        var range = sheet.getRange(2, 1, lastRow - 1, 13);
        var values = range.getValues();
        
        var checkInMap = {};
        for (var c = 0; c < checkIns.length; c++) {
          var item = checkIns[c];
          var code = (typeof item === 'string' ? item : item.ticketCode || '').toUpperCase().trim();
          if (code) {
            checkInMap[code] = {
              attended: item.attended !== false,
              attendedAt: item.attendedAt || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss")
            };
          }
        }

        for (var i = 0; i < values.length; i++) {
          var rowCode = (values[i][1] || "").toString().toUpperCase().trim();
          if (checkInMap[rowCode]) {
            var record = checkInMap[rowCode];
            values[i][11] = record.attended ? "ASISTIDO" : "NO ASISTIDO";
            values[i][12] = record.attended ? record.attendedAt : "";
            updatedCount++;
          }
        }

        range.setValues(values);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Asistencias sincronizadas con éxito",
        updatedCount: updatedCount,
        totalCheckedInSent: checkIns.length
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ---------------------------------------------------------------------
    // CASO C: Registro Rápido en Puerta (Door Walk-in)
    // ---------------------------------------------------------------------
    if (data.action === "quickRegister") {
      var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
      var ticketCode = data.ticketCode || ("IBC-UR-" + Math.floor(100000 + Math.random() * 900000));
      var isAttended = data.attended !== false;
      var checkInTime = data.attendedAt || (isAttended ? timestamp : "");

      sheet.appendRow([
        timestamp,
        ticketCode,
        data.firstName || data.fullName || "Asistente",
        data.lastName || "",
        data.email || "",
        data.phone || "",
        data.ageGroup || "General",
        data.church || "Invitado / IBC",
        data.taller || "Plenaria General",
        data.merch || "Ninguna",
        "CONFIRMADO",
        isAttended ? "ASISTIDO" : "NO ASISTIDO",
        checkInTime,
        ""
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Registro rápido completado con éxito",
        ticketCode: ticketCode,
        attended: isAttended
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ---------------------------------------------------------------------
    // CASO D: Registro Regular Completo de la Conferencia
    // ---------------------------------------------------------------------
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    
    sheet.appendRow([
      timestamp,
      data.ticketCode || "N/A",
      data.firstName || "",
      data.lastName || "",
      data.email || "",
      data.phone || "",
      data.ageGroup || "",
      data.church || "Invitado",
      data.taller || "Sin taller",
      data.merch || "Ninguna",
      "CONFIRMADO",
      data.asistenciaEnPuerta || (data.attended ? "ASISTIDO" : "NO ASISTIDO"),
      data.attendedAt || "",
      data.hasMerch ? "PENDIENTE PAGO" : ""
    ]);
    
    // Enviar el correo oficial con boleto y código QR
    if (data.email) {
      enviarBoletoPorCorreo(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Registro guardado y boleto emitido con éxito",
      ticketCode: data.ticketCode
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log("Error en doPost: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// 2. INICIALIZACIÓN DE ENCABEZADOS
// =========================================================================
function inicializarEncabezadosSiEsNecesario(sheet) {
  if (sheet.getLastRow() === 0) {
    var headers = [
      "Fecha Registro", 
      "Código Ticket", 
      "Nombre", 
      "Apellidos", 
      "Correo Electrónico", 
      "Teléfono", 
      "Rango de Edad", 
      "Iglesia / Procedencia", 
      "Taller Asignado", 
      "Pre-orden Merch", 
      "Estado Ticket", 
      "Asistencia en Puerta",
      "Fecha Check-In",
      "Notificación Merch"
    ];
    sheet.appendRow(headers);
    
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0f0c0a");
    headerRange.setFontColor("#ff8c00");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  } else {
    if (sheet.getLastColumn() < 13) {
      sheet.getRange(1, 13).setValue("Fecha Check-In")
           .setBackground("#0f0c0a")
           .setFontColor("#ff8c00")
           .setFontWeight("bold");
    }
    if (sheet.getLastColumn() < 14) {
      sheet.getRange(1, 14).setValue("Notificación Merch")
           .setBackground("#0f0c0a")
           .setFontColor("#ff8c00")
           .setFontWeight("bold");
    }
  }
}

// =========================================================================
// 3. RESPUESTA A CONSULTAS GET (doGet)
// =========================================================================
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getRegistrations";
    
    if (action === "ping" || action === "status") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "active",
        service: "Conferencia Despierta 2026 - Upper Room IBC",
        message: "El Webhook de Google Apps Script está activo y listo para recibir y sincronizar registros."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Registros Conferencia");
    if (!sheet) {
      var allSheets = ss.getSheets();
      for (var s = 0; s < allSheets.length; s++) {
        var sName = allSheets[s].getName().toLowerCase();
        if (sName.indexOf("registro") >= 0 || sName.indexOf("conferencia") >= 0 || sName.indexOf("respuestas") >= 0) {
          sheet = allSheets[s];
          break;
        }
      }
      if (!sheet && allSheets.length > 0) sheet = allSheets[0];
    }

    if (!sheet || sheet.getLastRow() <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        total: 0,
        sheetName: sheet ? sheet.getName() : "Ninguna",
        registrations: [],
        message: "No hay registros disponibles aún."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var lastRow = sheet.getLastRow();
    var lastCol = Math.max(sheet.getLastColumn(), 14);
    var allValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var headerRow = allValues[0];
    var data = allValues.slice(1);

    var colMap = {
      createdAt: 0,
      ticketCode: 1,
      firstName: 2,
      lastName: 3,
      email: 4,
      phone: 5,
      ageGroup: 6,
      church: 7,
      taller: 8,
      merch: 9,
      ticketStatus: 10,
      puertaStatus: 11,
      checkInTime: 12
    };

    for (var h = 0; h < headerRow.length; h++) {
      var hName = (headerRow[h] || "").toString().toLowerCase().trim();
      if (hName.indexOf("estado") >= 0) {
        colMap.ticketStatus = h;
      } else if (hName.indexOf("código") >= 0 || hName.indexOf("codigo") >= 0 || (hName.indexOf("ticket") >= 0 && hName.indexOf("estado") < 0)) {
        colMap.ticketCode = h;
      } else if (hName.indexOf("apellido") >= 0) {
        colMap.lastName = h;
      } else if (hName.indexOf("nombre") >= 0) {
        colMap.firstName = h;
      } else if (hName.indexOf("correo") >= 0 || hName.indexOf("email") >= 0) {
        colMap.email = h;
      } else if (hName.indexOf("tel") >= 0 || hName.indexOf("celular") >= 0 || hName.indexOf("whatsapp") >= 0) {
        colMap.phone = h;
      } else if (hName.indexOf("edad") >= 0) {
        colMap.ageGroup = h;
      } else if (hName.indexOf("iglesia") >= 0 || hName.indexOf("procedencia") >= 0) {
        colMap.church = h;
      } else if (hName.indexOf("taller") >= 0) {
        colMap.taller = h;
      } else if (hName.indexOf("merch") >= 0 && hName.indexOf("notific") < 0) {
        colMap.merch = h;
      } else if (hName.indexOf("puerta") >= 0 || hName.indexOf("asistencia") >= 0) {
        colMap.puertaStatus = h;
      } else if (hName.indexOf("check") >= 0 || (hName.indexOf("fecha") >= 0 && hName.indexOf("ingreso") >= 0)) {
        colMap.checkInTime = h;
      }
    }

    var registrations = [];
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var rawCode = (row[colMap.ticketCode] || "").toString().trim();
      var firstName = (row[colMap.firstName] || "").toString().trim();
      var lastName = (row[colMap.lastName] || "").toString().trim();
      var fullName = (firstName + " " + lastName).trim() || firstName || "Asistente";
      var email = (row[colMap.email] || "").toString().trim();
      var phone = (row[colMap.phone] || "").toString().trim();

      if (!rawCode && !firstName && !lastName && !email) continue;

      var ticketCode = rawCode;
      if (!ticketCode || ticketCode.toUpperCase() === "CONFIRMADO" || ticketCode.toUpperCase() === "CONFIRMED" || ticketCode.toUpperCase() === "ATTENDED" || ticketCode.toUpperCase() === "ASISTIDO") {
        ticketCode = "IBC-UR-" + (100000 + i);
      }
      var ageGroup = (row[colMap.ageGroup] || "").toString().trim();
      var church = (row[colMap.church] || "Invitado").toString().trim();
      var taller = (row[colMap.taller] || "Sin taller").toString().trim();
      var merch = (row[colMap.merch] || "Ninguna").toString().trim();
      var ticketStatus = (row[colMap.ticketStatus] || "CONFIRMADO").toString().trim();
      
      var rawPuertaVal = row[colMap.puertaStatus];
      var rawPuerta = (rawPuertaVal !== undefined && rawPuertaVal !== null) ? rawPuertaVal.toString().trim().toUpperCase() : "";
      
      var isAttended = Boolean(
        rawPuertaVal === true ||
        rawPuerta === "TRUE" ||
        rawPuerta === "ASISTIDO" || 
        rawPuerta === "ATTENDED" || 
        rawPuerta === "SI" ||
        rawPuerta === "SÍ" ||
        ticketStatus.toUpperCase() === "ATTENDED" ||
        ticketStatus.toUpperCase() === "ASISTIDO"
      );
      var checkInTime = (row[colMap.checkInTime] || "").toString().trim();

      registrations.push({
        id: ticketCode,
        ticketCode: ticketCode,
        firstName: firstName,
        lastName: lastName,
        fullName: fullName,
        email: email,
        phone: phone,
        ageGroup: ageGroup,
        church: church,
        taller: taller,
        tallerSeleccionado: taller,
        merch: merch,
        status: isAttended ? "ATTENDED" : "CONFIRMED",
        attended: isAttended,
        attendedAt: checkInTime,
        createdAt: (row[colMap.createdAt] || "").toString()
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      sheetName: sheet.getName(),
      total: registrations.length,
      registrations: registrations,
      syncedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss")
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Error en doGet: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// 4. PLANTILLA HTML DE CORREO: REGISTRO DE BOLETO
// =========================================================================
function enviarBoletoPorCorreo(data) {
  try {
    var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=" + encodeURIComponent(data.ticketCode);
    var subject = "¡Tu registro a la Conferencia Upper Room está confirmado! 🙌";
    
    var hasMerch = Boolean(
      data.hasMerch === true || 
      (data.merch && 
       data.merch !== 'Ninguna' && 
       data.merch !== 'No' && 
       data.merch !== 'Disponible próximamente')
    );

    var merchPaymentBlockText = "";
    var merchPaymentBlockHtml = "";

    if (hasMerch) {
      merchPaymentBlockText = 
        "\n=======================================================\n" +
        "🛍️ INSTRUCCIONES DE PAGO - RESERVA DE MERCH OFICIAL\n" +
        "=======================================================\n" +
        "Has seleccionado la siguiente mercancía oficial:\n" +
        "• Detalle: " + data.merch + "\n" +
        (data.merchTotal ? "• Monto total a transferir: RD$ " + Number(data.merchTotal).toLocaleString() + "\n" : "") +
        "\nDatos para transferencia bancaria:\n" +
        "• Banco: Popular Dominicano\n" +
        "• Cuenta: Iglesia Bautista Cristiana\n" +
        "• Número de Cuenta: 001-18074-6 (Cuenta Corriente)\n" +
        "• RNC: 401507422\n" +
        "• Correo para comprobante: upperroomibc@gmail.com\n" +
        "• Tiempo de Validación: 32 horas.\n" +
        "• Descripción obligatoria: COMPRA MERCH CONFERENCIA UPPER ROOM 2026\n" +
        "\n⚠️ IMPORTANTE: Dispones de un plazo máximo de 32 horas a partir de este momento para realizar tu transferencia y remitir el comprobante a upperroomibc@gmail.com con tu código de boleto (" + data.ticketCode + "). De no recibir el comprobante en dicho plazo, la reserva de tus prendas será cancelada.\n" +
        "=======================================================\n\n";

      merchPaymentBlockHtml = `
        <div style="background-color: #0e0a08; border: 2px solid #ff6a00; border-radius: 10px; padding: 22px 20px; margin-bottom: 24px; box-shadow: 0 6px 25px rgba(255, 106, 0, 0.2);">
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border-bottom: 1px solid rgba(255, 106, 0, 0.3); padding-bottom: 12px;">
            <tr>
              <td style="width: 38px; vertical-align: top; font-size: 26px;">🛍️</td>
              <td>
                <span style="display: block; font-size: 11px; color: #ff8c00; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                  PASO FINAL REQUERIDO
                </span>
                <h3 style="margin: 2px 0 0; font-size: 17px; color: #ffffff; font-weight: 900; letter-spacing: 0.5px;">
                  Instrucciones de Pago • Merch Oficial
                </h3>
                <span style="display: inline-block; margin-top: 4px; font-size: 12px; color: #fca5a5; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); padding: 2px 8px; border-radius: 4px; font-weight: 700;">
                  ⏱️ Tiempo de Validación: 32 Horas
                </span>
              </td>
            </tr>
          </table>

          <p style="font-size: 14px; color: #e5e7eb; line-height: 1.6; margin: 0 0 14px;">
            ¡Tu entrada a la conferencia ya está confirmada! Para garantizar la confección y entrega de tu Merch oficial, realiza tu transferencia bancaria y remite el comprobante dentro de las próximas <strong>32 horas</strong>:
          </p>

          <div style="background: rgba(255, 106, 0, 0.08); border-radius: 6px; padding: 12px 14px; margin-bottom: 16px; border-left: 3px solid #ff6a00;">
            <p style="margin: 0 0 4px; font-size: 13px; color: #d1d5db;">
              <strong>Prendas solicitadas:</strong> ${data.merch}
            </p>
            ${data.merchTotal ? `
            <p style="margin: 0; font-size: 15px; color: #ffffff; font-weight: 800;">
              Total a transferir: <span style="color: #fbbf24;">RD$ ${Number(data.merchTotal).toLocaleString()}</span>
            </p>` : ''}
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e5e7eb; margin-bottom: 16px; background: rgba(0,0,0,0.45); border-radius: 6px;">
            <tr>
              <td style="padding: 9px 12px; width: 42%; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">🏦 Banco:</td>
              <td style="padding: 9px 12px; font-weight: 700; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.06);">Popular Dominicano</td>
            </tr>
            <tr>
              <td style="padding: 9px 12px; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">👤 Cuenta:</td>
              <td style="padding: 9px 12px; font-weight: 700; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.06);">Iglesia Bautista Cristiana</td>
            </tr>
            <tr>
              <td style="padding: 9px 12px; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">🔢 Número de Cuenta:</td>
              <td style="padding: 9px 12px; font-weight: 800; color: #fbbf24; font-family: monospace; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.06);">
                001-18074-6 <span style="color: #9ca3af; font-size: 11px; font-family: sans-serif; font-weight: normal;">(Cuenta Corriente)</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 9px 12px; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">📄 RNC:</td>
              <td style="padding: 9px 12px; font-weight: 700; color: #ffffff; font-family: monospace; border-bottom: 1px solid rgba(255,255,255,0.06);">401507422</td>
            </tr>
            <tr>
              <td style="padding: 9px 12px; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">📧 Correo para comprobante:</td>
              <td style="padding: 9px 12px; font-weight: 700; color: #ff8c00; border-bottom: 1px solid rgba(255,255,255,0.06);">
                <a href="mailto:upperroomibc@gmail.com" style="color: #ff8c00; text-decoration: none;">upperroomibc@gmail.com</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 9px 12px; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">⏱️ Tiempo de Validación:</td>
              <td style="padding: 9px 12px; font-weight: 700; color: #ef4444; border-bottom: 1px solid rgba(255,255,255,0.06);">32 horas</td>
            </tr>
            <tr>
              <td style="padding: 9px 12px; color: #9ca3af;">📝 Descripción obligatoria:</td>
              <td style="padding: 9px 12px; font-weight: 800; color: #fbbf24; font-family: monospace; font-size: 12px;">
                COMPRA MERCH CONFERENCIA UPPER ROOM 2026
              </td>
            </tr>
          </table>

          <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 6px; padding: 12px 14px;">
            <p style="margin: 0; font-size: 12px; color: #fca5a5; line-height: 1.5;">
              ⚠️ <strong>RECORDATORIO ESTRICTO:</strong> Tras efectuar tu transferencia, envía el comprobante a <strong>upperroomibc@gmail.com</strong> indicando tu nombre y código de boleto: <strong style="color: #ffffff;">${data.ticketCode}</strong> dentro de las próximas <strong>32 horas</strong>. De no remitir el comprobante a tiempo, la confección de tus prendas será cancelada.
            </p>
          </div>

        </div>
      `;
    }
    
    var plainTextBody = 
      "¡Tu registro a la Conferencia Upper Room está confirmado! 🙌\n\n" +
      "Querido Upperamigo" + (data.firstName ? " (" + data.firstName + ")" : "") + ",\n\n" +
      "¡Gracias por registrarte en nuestra Conferencia Upper Room 2026! 🙌 Estamos emocionados de compartir contigo un tiempo especial de crecimiento, aprendizaje y comunión en la presencia de Dios. ✨\n\n" +
      "🎟️ TU CÓDIGO DE ENTRADA: " + data.ticketCode + "\n\n" +
      merchPaymentBlockText +
      "📌 Información importante:\n" +
      "• 📅 Fecha: Sábado 31 de Octubre, 2026\n" +
      "• 📍 Lugar: Auditorio Principal IBC (C. Juan Luis Franco Bidó 25, Santo Domingo)\n" +
      "• ⏰ Horario: 2:00 PM – 8:00 PM (Apertura de puertas desde las 2:00 PM)\n" +
      "• ⛪ Tu Congregación: " + data.church + "\n" +
      (data.taller && data.taller !== 'Sin taller' ? "• 🎯 Taller asignado: " + data.taller + "\n" : "") +
      (data.merch && data.merch !== 'Ninguna' ? "• 🛍️ Merch solicitada: " + data.merch + "\n" : "") + "\n" +
      "¡Gracias por ser parte de Upper Room! 🧡\n\n" +
      "Equipo Ministerio Upper Room IBC ✝️";

    var htmlBody = `
      <div style="background-color: #06080d; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px 20px; border-radius: 14px; border: 1px solid rgba(255, 106, 0, 0.35);">
        
        <div style="text-align: center; padding-bottom: 22px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
          <span style="color: #f59e0b; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
            UPPER ROOM • IGLESIA BAUTISTA CRISTIANA
          </span>
          <h1 style="margin: 10px 0 4px; font-size: 26px; color: #ffffff; font-weight: 900; letter-spacing: 0.5px;">
            DESPIERTA 2026
          </h1>
          <p style="margin: 0; color: #ff8c00; font-size: 13px; font-weight: 700; letter-spacing: 1.5px;">
            «LA LLAMA VUELVE A ENCENDERSE» 🔥
          </p>
        </div>

        <div style="padding: 24px 4px 16px;">
          <p style="font-size: 18px; margin: 0 0 12px; color: #ffffff; font-weight: 700;">
            Querido Upperamigo${data.firstName ? ' (' + data.firstName + ')' : ''}, 👋
          </p>
          <p style="font-size: 15px; margin: 0 0 14px; color: #d1d5db; line-height: 1.65;">
            ¡Gracias por registrarte en nuestra <strong>Conferencia Upper Room 2026</strong>! 🙌 Estamos emocionados de compartir contigo un tiempo especial de crecimiento, aprendizaje y comunión en la presencia de Dios. ✨
          </p>
          <div style="background: rgba(255, 106, 0, 0.1); border: 1px solid rgba(255, 106, 0, 0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
            <p style="font-size: 14px; margin: 0; color: #fbbf24; font-weight: 600; line-height: 1.5;">
              🎉 Tu registro ha sido recibido exitosamente. <strong>¡Ya eres parte de lo que Dios hará en esta conferencia!</strong> 🙌
            </p>
          </div>
        </div>

        <div style="background-color: #0c0f17; border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 10px; padding: 22px 18px; margin-bottom: 24px; text-align: center;">
          <span style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">
            🎟️ TU BOLETO DIGITAL DE ACCESO
          </span>
          <div style="font-size: 26px; font-weight: 800; color: #f59e0b; letter-spacing: 3px; font-family: monospace; margin: 8px 0 14px;">
            ${data.ticketCode}
          </div>

          <div style="background-color: #ffffff; padding: 12px; display: inline-block; border-radius: 8px; box-shadow: 0 8px 25px rgba(0,0,0,0.8); margin-bottom: 12px;">
            <img src="${qrUrl}" alt="QR Ticket" width="170" height="170" style="display: block; border: none;" />
          </div>

          <p style="font-size: 12px; color: #e5e7eb; margin: 0; font-weight: 500;">
            📲 Presenta este código QR desde tu celular al llegar para agilizar tu acceso.
          </p>
        </div>

        ${merchPaymentBlockHtml}

        <div style="background-color: #0c0f17; border-left: 3px solid #f59e0b; border-radius: 8px; padding: 18px 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 14px; font-size: 15px; color: #f59e0b; letter-spacing: 0.5px;">
            📌 Información importante
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e5e7eb;">
            <tr>
              <td style="padding: 7px 0; width: 44%; color: #9ca3af;">📅 Fecha:</td>
              <td style="padding: 7px 0; font-weight: 700; color: #ffffff;">Sábado 31 de Octubre, 2026</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #9ca3af;">📍 Lugar:</td>
              <td style="padding: 7px 0; font-weight: 700; color: #ffffff;">Auditorio Principal IBC</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #9ca3af;">⏰ Horario del Evento:</td>
              <td style="padding: 7px 0; font-weight: 700; color: #fbbf24;">2:00 PM – 8:00 PM</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #9ca3af;">🎟️ Registro en Puerta:</td>
              <td style="padding: 7px 0; font-weight: 600; color: #86efac;">Inicia 2:00 PM</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #9ca3af;">🔥 Actividad:</td>
              <td style="padding: 7px 0; font-weight: 700; color: #ffffff;">Conferencia Upper Room Despierta 2026</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #9ca3af;">⛪ Tu Congregación:</td>
              <td style="padding: 7px 0; font-weight: 600; color: #ffffff;">${data.church}</td>
            </tr>
            ${data.taller && data.taller !== 'Sin taller' ? `
            <tr>
              <td style="padding: 7px 0; color: #9ca3af;">🎯 Taller Asignado:</td>
              <td style="padding: 7px 0; font-weight: 700; color: #ff8c00;">${data.taller}</td>
            </tr>` : ''}
          </table>
        </div>

        <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px;">
          <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af;">
            ¿Tienes dudas o preguntas? Escríbenos en Instagram: 
            <a href="https://www.instagram.com/upperroomibcrd/" style="color: #ff8c00; font-weight: 700; text-decoration: none;">
              @upperroomibcrd 📲
            </a>
          </p>
          <p style="margin: 0; font-size: 11px; color: #4b5563;">
            © 2026 Upper Room IBC • Iglesia Bautista Cristiana (IBC)
          </p>
        </div>

      </div>
    `;

    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: plainTextBody,
      htmlBody: htmlBody
    });
    
  } catch (emailError) {
    Logger.log("Error al enviar email: " + emailError.toString());
  }
}

// =========================================================================
// 5. PLANTILLA HTML DE CORREO: CONFIRMACIÓN DE MERCH AGREGADA A TICKET EXISTENTE
// =========================================================================
function enviarCorreoConfirmacionMerchAgregada(data) {
  try {
    var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=" + encodeURIComponent(data.ticketCode);
    var subject = "🛍️ Merch Oficial Agregada a tu Boleto (" + data.ticketCode + ") • Instrucciones de Pago";
    var nombre = data.firstName ? data.firstName : "Upperamigo";

    var plainText = 
      "¡Hola " + nombre + "! 🙌\n\n" +
      "Tu selección de Merch Oficial ha sido vinculada con éxito a tu boleto de la Conferencia Upper Room 2026 (" + data.ticketCode + ").\n\n" +
      "=======================================================\n" +
      "🛍️ DETALLE DE TU RESERVA DE MERCH:\n" +
      "=======================================================\n" +
      "• Prendas seleccionadas: " + data.merch + "\n" +
      (data.merchTotal ? "• Monto total a transferir: RD$ " + Number(data.merchTotal).toLocaleString() + "\n" : "") +
      "\n💳 DATOS PARA TRANSFERENCIA BANCARIA:\n" +
      "• Banco: Popular Dominicano\n" +
      "• Cuenta: Iglesia Bautista Cristiana\n" +
      "• Número de Cuenta: 001-18074-6 (Cuenta Corriente)\n" +
      "• RNC: 401507422\n" +
      "• Correo para comprobante: upperroomibc@gmail.com\n" +
      "• Tiempo de Validación: 32 horas.\n" +
      "• Descripción obligatoria: COMPRA MERCH CONFERENCIA UPPER ROOM 2026\n\n" +
      "⚠️ IMPORTANTE: Dispones de un plazo máximo de 32 horas para realizar tu transferencia y remitir el comprobante a upperroomibc@gmail.com indicando tu código de boleto: " + data.ticketCode + ".\n\n" +
      "¡Gracias por apoyar el ministerio y prepararte para Despierta 2026!\n\n" +
      "Equipo Ministerio Upper Room IBC ✝️";

    var htmlBody = `
      <div style="background-color: #06080d; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px 20px; border-radius: 14px; border: 1px solid rgba(255, 106, 0, 0.45);">
        
        <!-- Header Oficial -->
        <div style="text-align: center; padding-bottom: 22px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
          <span style="color: #f59e0b; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
            UPPER ROOM • IGLESIA BAUTISTA CRISTIANA
          </span>
          <h1 style="margin: 10px 0 4px; font-size: 26px; color: #ffffff; font-weight: 900; letter-spacing: 0.5px;">
            MERCH AGREGADA A TU BOLETO
          </h1>
          <p style="margin: 0; color: #ff8c00; font-size: 13px; font-weight: 700; letter-spacing: 1.5px;">
            DESPIERTA 2026 🔥
          </p>
        </div>

        <!-- Saludo -->
        <div style="padding: 24px 4px 14px;">
          <p style="font-size: 18px; margin: 0 0 10px; color: #ffffff; font-weight: 700;">
            ¡Hola ${nombre}! 🙌
          </p>
          <p style="font-size: 15px; margin: 0 0 14px; color: #d1d5db; line-height: 1.65;">
            Hemos actualizado tu registro para la <strong>Conferencia Upper Room 2026</strong> y vinculado tu selección de Merch Oficial a tu boleto: <strong style="color: #fbbf24; font-family: monospace; font-size: 17px;">${data.ticketCode}</strong>.
          </p>
        </div>

        <!-- Bloque de Pago e Instrucciones -->
        <div style="background-color: #0e0a08; border: 2px solid #ff6a00; border-radius: 10px; padding: 22px 20px; margin-bottom: 24px; box-shadow: 0 6px 25px rgba(255, 106, 0, 0.2);">
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border-bottom: 1px solid rgba(255, 106, 0, 0.3); padding-bottom: 12px;">
            <tr>
              <td style="width: 38px; vertical-align: top; font-size: 26px;">🛍️</td>
              <td>
                <span style="display: block; font-size: 11px; color: #ff8c00; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                  PASO FINAL • CONFIRMAR RESERVA
                </span>
                <h3 style="margin: 2px 0 0; font-size: 17px; color: #ffffff; font-weight: 900; letter-spacing: 0.5px;">
                  Instrucciones de Pago • Merch Oficial
                </h3>
                <span style="display: inline-block; margin-top: 4px; font-size: 12px; color: #fca5a5; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); padding: 2px 8px; border-radius: 4px; font-weight: 700;">
                  ⏱️ Tiempo de Validación: 32 Horas
                </span>
              </td>
            </tr>
          </table>

          <p style="font-size: 14px; color: #e5e7eb; line-height: 1.6; margin: 0 0 14px;">
            Para garantizar la confección y entrega de tus prendas en la conferencia, realiza tu transferencia bancaria y remite el comprobante dentro de las próximas <strong>32 horas</strong>:
          </p>

          <!-- Resumen de prendas agregadas -->
          <div style="background: rgba(255, 106, 0, 0.08); border-radius: 6px; padding: 12px 14px; margin-bottom: 16px; border-left: 3px solid #ff6a00;">
            <p style="margin: 0 0 4px; font-size: 13px; color: #d1d5db;">
              <strong>Prendas agregadas:</strong> ${data.merch}
            </p>
            ${data.merchTotal ? `
            <p style="margin: 0; font-size: 16px; color: #ffffff; font-weight: 800;">
              Total a transferir: <span style="color: #fbbf24;">RD$ ${Number(data.merchTotal).toLocaleString()}</span>
            </p>` : ''}
          </div>

          <!-- Tabla de Datos Bancarios Oficiales -->
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e5e7eb; margin-bottom: 16px; background: rgba(0,0,0,0.45); border-radius: 6px;">
            <tr>
              <td style="padding: 9px 12px; width: 42%; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">🏦 Banco:</td>
              <td style="padding: 9px 12px; font-weight: 700; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.06);">Popular Dominicano</td>
            </tr>
            <tr>
              <td style="padding: 9px 12px; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">👤 Cuenta:</td>
              <td style="padding: 9px 12px; font-weight: 700; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.06);">Iglesia Bautista Cristiana</td>
            </tr>
            <tr>
              <td style="padding: 9px 12px; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">🔢 Número de Cuenta:</td>
              <td style="padding: 9px 12px; font-weight: 800; color: #fbbf24; font-family: monospace; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.06);">
                001-18074-6 <span style="color: #9ca3af; font-size: 11px; font-family: sans-serif; font-weight: normal;">(Cuenta Corriente)</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 9px 12px; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">📄 RNC:</td>
              <td style="padding: 9px 12px; font-weight: 700; color: #ffffff; font-family: monospace; border-bottom: 1px solid rgba(255,255,255,0.06);">401507422</td>
            </tr>
            <tr>
              <td style="padding: 9px 12px; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">📧 Correo para comprobante:</td>
              <td style="padding: 9px 12px; font-weight: 700; color: #ff8c00; border-bottom: 1px solid rgba(255,255,255,0.06);">
                <a href="mailto:upperroomibc@gmail.com" style="color: #ff8c00; text-decoration: none;">upperroomibc@gmail.com</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 9px 12px; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">⏱️ Tiempo de Validación:</td>
              <td style="padding: 9px 12px; font-weight: 700; color: #ef4444; border-bottom: 1px solid rgba(255,255,255,0.06);">32 horas</td>
            </tr>
            <tr>
              <td style="padding: 9px 12px; color: #9ca3af;">📝 Descripción obligatoria:</td>
              <td style="padding: 9px 12px; font-weight: 800; color: #fbbf24; font-family: monospace; font-size: 12px;">
                COMPRA MERCH CONFERENCIA UPPER ROOM 2026
              </td>
            </tr>
          </table>

          <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 6px; padding: 12px 14px;">
            <p style="margin: 0; font-size: 12px; color: #fca5a5; line-height: 1.5;">
              ⚠️ <strong>RECORDATORIO ESTRICTO:</strong> Tras efectuar tu transferencia, envía el comprobante a <strong>upperroomibc@gmail.com</strong> indicando tu nombre y código de boleto: <strong style="color: #ffffff;">${data.ticketCode}</strong> dentro de las próximas <strong>32 horas</strong>. Pasado ese tiempo sin comprobante, la reserva de tus prendas será cancelada.
            </p>
          </div>

        </div>

        <!-- Credencial con QR -->
        <div style="background-color: #0c0f17; border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 20px; margin-bottom: 22px; text-align: center;">
          <span style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">
            🎟️ TU BOLETO DE ENTRADA
          </span>
          <div style="font-size: 24px; font-weight: 800; color: #f59e0b; letter-spacing: 3px; font-family: monospace; margin: 6px 0 12px;">
            ${data.ticketCode}
          </div>
          <div style="background-color: #ffffff; padding: 10px; display: inline-block; border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.8); margin-bottom: 10px;">
            <img src="${qrUrl}" alt="QR Ticket" width="150" height="150" style="display: block; border: none;" />
          </div>
          <p style="font-size: 12px; color: #e5e7eb; margin: 0;">
            Presenta este código al ingresar el 31 de Octubre para tu acreditación y entrega de Merch.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px;">
          <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af;">
            Instagram oficial: 
            <a href="https://www.instagram.com/upperroomibcrd/" style="color: #ff8c00; font-weight: 700; text-decoration: none;">
              @upperroomibcrd 📲
            </a>
          </p>
          <p style="margin: 0; font-size: 11px; color: #4b5563;">
            © 2026 Upper Room IBC • Iglesia Bautista Cristiana (IBC)
          </p>
        </div>

      </div>
    `;

    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: plainText,
      htmlBody: htmlBody
    });
    
  } catch (emailError) {
    Logger.log("Error al enviar email de confirmación de Merch: " + emailError.toString());
  }
}

// =========================================================================
// 6. PLANTILLA HTML DE CORREO: INVITACIÓN DE DISPONIBILIDAD DE MERCH
// =========================================================================
function enviarCorreoInvitacionMerch(person) {
  var subject = "¡La Merch Oficial de la Conferencia Upper Room ya está disponible! 🔥🛍️";
  var nombre = person.firstName ? person.firstName : "Upperamigo";
  var ticketCode = (person.ticketCode || "").toString().trim().toUpperCase();

  // URL Base oficial de la web (ajustar si tu dominio personalizado cambia)
  var webBaseUrl = (typeof WEB_APP_BASE_URL !== 'undefined' && WEB_APP_BASE_URL) 
    ? WEB_APP_BASE_URL 
    : "https://upperroomibc.netlify.app";
    
  var magicLinkUrl = webBaseUrl.replace(/\/+$/, "") + "/merch?ticket=" + encodeURIComponent(ticketCode);

  var plainText = 
    "¡Hola " + nombre + "! 🔥\n\n" +
    "¡Tenemos una excelente noticia para ti!\n\n" +
    "Como ya te encuentras formalmente registrado para la Conferencia Upper Room 2026 (Boleto: " + ticketCode + "), queremos darte acceso exclusivo para que puedas reservar tus prendas conmemorativas de edición limitada.\n\n" +
    "👉 ENLACE DIRECTO PARA ELEGIR TU MERCH (SIN ESCRIBIR TU CÓDIGO):\n" +
    magicLinkUrl + "\n\n" +
    "🛍️ COLECCIÓN DISPONIBLE:\n" +
    "1. T-Shirt Despierta 2026 • RD$ 1,400 (100% algodón oversize, tallas S a 2XL)\n" +
    "   • Modelos: Cristo Vive en Mí, Con Amor Eterno, 3.16\n" +
    "   • Colores Prenda/Letras: Blanco (Letras Gris), Crema (Letras Marrón), Negro (Letras Blanco), Verde (Letras Verde), Blanco (Letras Azul), Blanco (Letras Negro), Blanco (Letras Rojo)\n" +
    "2. Hoodie Despierta 2026 • RD$ 1,800 (Sudadera pesada con capucha, tallas S a 2XL)\n" +
    "   • Modelo: Chosen en Negro (Letras Blanco) y Blanco (Letras Gris)\n\n" +
    "💳 DATOS PARA TRANSFERENCIA BANCARIA:\n" +
    "• Banco: Popular Dominicano\n" +
    "• Cuenta: Iglesia Bautista Cristiana\n" +
    "• Número de Cuenta: 001-18074-6 (Cuenta Corriente)\n" +
    "• RNC: 401507422\n" +
    "• Correo para comprobante: upperroomibc@gmail.com\n" +
    "• Tiempo de Validación: 32 horas.\n" +
    "• Descripción obligatoria: COMPRA MERCH CONFERENCIA UPPER ROOM 2026\n\n" +
    "📌 CÓMO ORDENAR DIRECTAMENTE:\n" +
    "1. Abre tu enlace exclusivo: " + magicLinkUrl + "\n" +
    "2. Selecciona tus prendas y haz clic en 'Confirmar y Vincular'.\n" +
    "3. Realiza la transferencia bancaria y remite el comprobante en las siguientes 32 horas.\n\n" +
    "¡Nos vemos el Sábado 31 de Octubre, 2026 en el Auditorio IBC! 🔥\n\n" +
    "Equipo Ministerio Upper Room IBC ✝️";

  var htmlBody = `
    <div style="background-color: #06080d; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px 20px; border-radius: 14px; border: 1px solid rgba(255, 106, 0, 0.4);">
      
      <div style="text-align: center; padding-bottom: 22px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
        <span style="color: #f59e0b; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
          UPPER ROOM • IGLESIA BAUTISTA CRISTIANA
        </span>
        <h1 style="margin: 10px 0 4px; font-size: 26px; color: #ffffff; font-weight: 900; letter-spacing: 0.5px;">
          MERCH OFICIAL DISPONIBLE
        </h1>
        <p style="margin: 0; color: #ff8c00; font-size: 13px; font-weight: 700; letter-spacing: 1.5px;">
          CONFERENCIA DESPIERTA 2026 🔥
        </p>
      </div>

      <div style="padding: 24px 4px 14px;">
        <p style="font-size: 18px; margin: 0 0 12px; color: #ffffff; font-weight: 700;">
          ¡Hola ${nombre}! 👋
        </p>
        <p style="font-size: 15px; margin: 0 0 14px; color: #d1d5db; line-height: 1.65;">
          ¡Tenemos una excelente noticia para ti! Como ya tienes tu entrada asegurada para la <strong>Conferencia Upper Room 2026</strong> (Boleto: <strong style="color: #fbbf24; font-family: monospace;">${ticketCode}</strong>), queremos darte prioridad para que reserves la colección de Merch oficial antes de que se agote la preventa.
        </p>
      </div>

      <!-- BOTÓN ENLACE MÁGICO OBSIDIAN FIRE (HERO CTA) -->
      <div style="text-align: center; margin: 0 0 24px; padding: 20px 16px; background: rgba(234, 88, 12, 0.08); border: 1px solid rgba(234, 88, 12, 0.35); border-radius: 12px;">
        <span style="display: block; font-size: 11px; color: #ff8c00; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px;">
          ⚡ ACCESO DIRECTO CON TU BOLETO
        </span>
        <a href="${magicLinkUrl}" target="_blank" style="display: inline-block; background-color: #ea580c; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 14px 28px; border-radius: 8px; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 6px 20px rgba(234, 88, 12, 0.45); border: 1px solid #ea580c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          🛍️ Elegir Mi Merch Directamente
        </a>
        <span style="display: block; font-size: 12px; color: #9ca3af; margin-top: 10px;">
          ✨ Al pulsar el botón, tu boleto <strong style="color: #fbbf24; font-family: monospace;">${ticketCode}</strong> se autocompletará de inmediato.
        </span>
      </div>

      <div style="margin-bottom: 24px;">
        
        <!-- T-Shirt -->
        <div style="background-color: #0c0f17; border: 1px solid rgba(255, 106, 0, 0.3); border-radius: 10px; padding: 18px; margin-bottom: 14px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td>
                <span style="display: inline-block; font-size: 10px; font-weight: 800; color: #fbbf24; background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.35); padding: 2px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                  100% ALGODÓN OVERSIZE
                </span>
                <h3 style="margin: 0 0 4px; font-size: 17px; color: #ffffff; font-weight: 800;">
                  T-Shirt Despierta 2026
                </h3>
                <p style="margin: 0 0 8px; font-size: 13px; color: #9ca3af; line-height: 1.4;">
                  Corte oversize de alta calidad, cuello reforzado y serigrafía exclusiva.
                </p>
                <p style="margin: 0; font-size: 12px; color: #d1d5db;">
                  <strong>Tallas:</strong> S, M, L, XL, 2XL<br/>
                  <strong>Modelos:</strong> Cristo Vive en Mí, Con Amor Eterno, 3.16<br/>
                  <span style="font-size: 11px; color: #fbbf24;">(El primer color indica la prenda y el segundo las letras)</span>
                </p>
              </td>
              <td style="width: 110px; text-align: right; vertical-align: top;">
                <span style="display: inline-block; background: #ff6a00; color: #000000; font-weight: 900; font-size: 15px; padding: 6px 12px; border-radius: 6px; font-family: monospace;">
                  RD$ 1,400
                </span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Hoodie -->
        <div style="background-color: #0c0f17; border: 1px solid rgba(255, 106, 0, 0.3); border-radius: 10px; padding: 18px; margin-bottom: 14px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td>
                <span style="display: inline-block; font-size: 10px; font-weight: 800; color: #f97316; background: rgba(249, 115, 22, 0.15); border: 1px solid rgba(249, 115, 22, 0.35); padding: 2px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                  EDICIÓN OFICIAL CON CAPUCHA
                </span>
                <h3 style="margin: 0 0 4px; font-size: 17px; color: #ffffff; font-weight: 800;">
                  Hoodie Despierta 2026
                </h3>
                <p style="margin: 0 0 8px; font-size: 13px; color: #9ca3af; line-height: 1.4;">
                  Sudadera pesada con capucha ajustable, bolsillo canguro y forro térmico suave.
                </p>
                <p style="margin: 0; font-size: 12px; color: #d1d5db;">
                  <strong>Tallas:</strong> S, M, L, XL, 2XL<br/>
                  <strong>Modelos:</strong> Chosen (Negro / Letras Blanco, Blanco / Letras Gris)
                </p>
              </td>
              <td style="width: 110px; text-align: right; vertical-align: top;">
                <span style="display: inline-block; background: #ff8c00; color: #000000; font-weight: 900; font-size: 15px; padding: 6px 12px; border-radius: 6px; font-family: monospace;">
                  RD$ 1,800
                </span>
              </td>
            </tr>
          </table>
        </div>

      </div>

      <!-- BOTÓN CTA SECUNDARIO -->
      <div style="text-align: center; margin: 10px 0 24px;">
        <a href="${magicLinkUrl}" target="_blank" style="display: inline-block; background-color: #ea580c; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 12px 24px; border-radius: 8px; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(234, 88, 12, 0.35); border: 1px solid #ea580c;">
          Abrir Catálogo y Reservar Prendas
        </a>
      </div>

      <!-- Datos Bancarios -->
      <div style="background-color: #0e0a08; border: 2px solid #ff6a00; border-radius: 10px; padding: 20px; margin-bottom: 22px;">
        <h3 style="margin: 0 0 12px; font-size: 15px; color: #ff8c00; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800;">
          💳 Datos para Transferencia Bancaria
        </h3>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e5e7eb; background: rgba(0,0,0,0.5); border-radius: 6px; margin-bottom: 14px;">
          <tr>
            <td style="padding: 8px 12px; width: 42%; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">🏦 Banco:</td>
            <td style="padding: 8px 12px; font-weight: 700; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.06);">Popular Dominicano</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">👤 Cuenta:</td>
            <td style="padding: 8px 12px; font-weight: 700; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.06);">Iglesia Bautista Cristiana</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">🔢 Número de Cuenta:</td>
            <td style="padding: 8px 12px; font-weight: 800; color: #fbbf24; font-family: monospace; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.06);">
              001-18074-6 <span style="color: #9ca3af; font-size: 11px; font-family: sans-serif; font-weight: normal;">(Cuenta Corriente)</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">📄 RNC:</td>
            <td style="padding: 8px 12px; font-weight: 700; color: #ffffff; font-family: monospace; border-bottom: 1px solid rgba(255,255,255,0.06);">401507422</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">📧 Correo para comprobante:</td>
            <td style="padding: 8px 12px; font-weight: 700; color: #ff8c00; border-bottom: 1px solid rgba(255,255,255,0.06);">
              <a href="mailto:upperroomibc@gmail.com" style="color: #ff8c00; text-decoration: none;">upperroomibc@gmail.com</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #9ca3af; border-bottom: 1px solid rgba(255,255,255,0.06);">⏱️ Tiempo de Validación:</td>
            <td style="padding: 8px 12px; font-weight: 700; color: #ef4444; border-bottom: 1px solid rgba(255,255,255,0.06);">32 horas</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #9ca3af;">📝 Descripción obligatoria:</td>
            <td style="padding: 8px 12px; font-weight: 800; color: #fbbf24; font-family: monospace; font-size: 12px;">
              COMPRA MERCH CONFERENCIA UPPER ROOM 2026
            </td>
          </tr>
        </table>

        <div style="background: rgba(255, 106, 0, 0.1); border-left: 3px solid #ff8c00; padding: 12px 14px; border-radius: 4px;">
          <p style="margin: 0 0 6px; font-size: 13px; color: #fbbf24; font-weight: 800;">
            🚀 ¿Cómo reservar tu prenda?
          </p>
          <ol style="margin: 0; padding-left: 18px; font-size: 12.5px; color: #e5e7eb; line-height: 1.6;">
            <li>Haz clic en el botón superior para seleccionar tu modelo, talla y color en la web.</li>
            <li>Realiza la transferencia por el total exacto indicando la descripción obligatoria.</li>
            <li>Envía el comprobante a <strong>upperroomibc@gmail.com</strong> indicando tu <strong>Boleto (${ticketCode})</strong>.</li>
          </ol>
        </div>
      </div>

      <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af;">
          Instagram oficial: 
          <a href="https://www.instagram.com/upperroomibcrd/" style="color: #ff8c00; font-weight: 700; text-decoration: none;">
            @upperroomibcrd 📲
          </a>
        </p>
        <p style="margin: 0; font-size: 11px; color: #4b5563;">
          © 2026 Upper Room IBC • Iglesia Bautista Cristiana (IBC)
        </p>
      </div>

    </div>
  `;

  MailApp.sendEmail({
    to: person.email,
    subject: subject,
    body: plainText,
    htmlBody: htmlBody
  });
}

// =========================================================================
// 7. MENÚ SUPERIOR PERSONALIZADO Y HERRAMIENTAS DE PRUEBA
// =========================================================================
/**
 * Se ejecuta automáticamente al abrir la hoja de cálculo.
 * Crea el menú personalizado "🛠️ UPPER ROOM ADMIN".
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🛠️ UPPER ROOM ADMIN')
    .addItem('Probar Correo: Registro de Boleta', 'probarCorreoRegistroBoleta')
    .addItem('Probar Correo: Disponibilidad de Merch', 'probarCorreoDisponibilidadMerch')
    .addItem('Probar Correo: Confirmación Merch Agregada', 'probarCorreoMerchAgregada')
    .addSeparator()
    .addItem('📊 Ver cuota de correos restantes', 'checkRemainingEmailQuota')
    .addItem('📢 Notificar Lanzamiento de Merch a Registrados', 'notifyMerchAvailable')
    .addToUi();
}

/**
 * Prueba del correo de Registro de Boleta con Merch.
 * Envío exclusivo a kevito.valdez@gmail.com.
 */
function probarCorreoRegistroBoleta() {
  var testEmail = "kevito.valdez@gmail.com";
  Logger.log("Iniciando prueba de Correo: Registro de Boleta a: " + testEmail);
  
  var mockData = {
    ticketCode: "IBC-UR-778899",
    firstName: "Kevin",
    lastName: "Valdez",
    fullName: "Kevin Valdez",
    email: testEmail,
    phone: "809-555-0199",
    ageGroup: "19 - 25",
    church: "Iglesia Bautista Cristiana (IBC)",
    taller: "¿Dónde quedó el fuego? (Rojo)",
    hasMerch: true,
    merchTotal: 3200,
    merch: 'T-Shirt Oversize "Cristo Vive en Mí" (L - Blanco (Letras Gris)) [RD$ 1,400] + Hoodie "Chosen" (XL - Negro (Letras Blanco)) [RD$ 1,800] • Total: RD$ 3,200',
    eventName: "Conferencia Despierta 2026 - Upper Room IBC",
    eventDate: "Sábado 31 de Octubre, 2026 (02:00 PM - 08:00 PM)",
    location: "Auditorio Principal IBC, C. Juan Luis Franco Bidó 25, Santo Domingo"
  };

  try {
    enviarBoletoPorCorreo(mockData);
    Logger.log("✅ Correo de prueba de Registro enviado con éxito a: " + testEmail);
    SpreadsheetApp.getUi().alert(
      "✅ Prueba Enviada con Éxito",
      "Se ha enviado el correo de prueba de 'Registro de Boleta' a:\n" + testEmail + "\n\nPor favor revisa tu bandeja de entrada o spam.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    Logger.log("❌ Error enviando correo de prueba: " + error.toString());
    SpreadsheetApp.getUi().alert("Error al enviar correo de prueba: " + error.toString());
  }
}

/**
 * Prueba del correo de Disponibilidad / Lanzamiento de Merch.
 * Envío exclusivo a kevito.valdez@gmail.com.
 */
function probarCorreoDisponibilidadMerch() {
  var testEmail = "kevito.valdez@gmail.com";
  Logger.log("Iniciando prueba de Correo: Disponibilidad de Merch a: " + testEmail);
  
  var mockPerson = {
    ticketCode: "IBC-UR-778899",
    firstName: "Kevin",
    lastName: "Valdez",
    email: testEmail
  };

  try {
    enviarCorreoInvitacionMerch(mockPerson);
    Logger.log("✅ Correo de prueba de Disponibilidad de Merch enviado con éxito a: " + testEmail);
    SpreadsheetApp.getUi().alert(
      "✅ Prueba Enviada con Éxito",
      "Se ha enviado el correo de prueba de 'Disponibilidad de Merch' a:\n" + testEmail + "\n\nPor favor revisa tu bandeja de entrada o spam.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    Logger.log("❌ Error enviando correo de prueba: " + error.toString());
    SpreadsheetApp.getUi().alert("Error al enviar correo de prueba: " + error.toString());
  }
}

/**
 * Prueba del correo de Confirmación de Merch Agregada a Ticket Existente.
 * Envío exclusivo a kevito.valdez@gmail.com.
 */
function probarCorreoMerchAgregada() {
  var testEmail = "kevito.valdez@gmail.com";
  Logger.log("Iniciando prueba de Correo: Merch Agregada a Ticket a: " + testEmail);
  
  var mockData = {
    ticketCode: "IBC-UR-778899",
    firstName: "Kevin",
    lastName: "Valdez",
    email: testEmail,
    church: "Iglesia Bautista Cristiana (IBC)",
    taller: "¿Dónde quedó el fuego? (Rojo)",
    merch: 'T-Shirt Oversize "Cristo Vive en Mí" (L - Blanco (Letras Gris)) [RD$ 1,400] + Hoodie "Chosen" (XL - Negro (Letras Blanco)) [RD$ 1,800] • Total: RD$ 3,200',
    merchTotal: 3200,
    timestamp: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss")
  };

  try {
    enviarCorreoConfirmacionMerchAgregada(mockData);
    Logger.log("✅ Correo de prueba de Merch Agregada enviado con éxito a: " + testEmail);
    SpreadsheetApp.getUi().alert(
      "✅ Prueba Enviada con Éxito",
      "Se ha enviado el correo de prueba de 'Merch Agregada a Ticket' a:\n" + testEmail + "\n\nPor favor revisa tu bandeja de entrada o spam.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    Logger.log("❌ Error enviando correo de prueba: " + error.toString());
    SpreadsheetApp.getUi().alert("Error al enviar correo de prueba: " + error.toString());
  }
}

/**
 * Consulta y muestra una ventana emergente con la cuota diaria de correos disponibles.
 */
function checkRemainingEmailQuota() {
  try {
    var quota = MailApp.getRemainingDailyQuota();
    var ui = SpreadsheetApp.getUi();
    
    var mensaje = "Te quedan " + quota + " correos disponibles para enviar en las próximas 24 horas.\n\n" +
                  "ℹ️ Referencias de límites diarios de Google:\n" +
                  "• Cuentas gratuitas (@gmail.com): 100 correos/día.\n" +
                  "• Cuentas Google Workspace: hasta 1,500 correos/día.\n\n" +
                  "La cuota se reinicia gradualmente cada 24 horas.";
                  
    ui.alert("📬 Cuota Diaria de Correos", mensaje, ui.ButtonSet.OK);
    
  } catch (error) {
    SpreadsheetApp.getUi().alert("Error al consultar cuota: " + error.toString());
  }
}

/**
 * Notificación Masiva para invitar a asistentes registrados sin Merch.
 */
function notifyMerchAvailable() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Registros Conferencia");

  if (!sheet) {
    var allSheets = ss.getSheets();
    for (var s = 0; s < allSheets.length; s++) {
      var sName = allSheets[s].getName().toLowerCase();
      if (sName.indexOf("registro") >= 0 || sName.indexOf("conferencia") >= 0) {
        sheet = allSheets[s];
        break;
      }
    }
    if (!sheet && allSheets.length > 0) sheet = allSheets[0];
  }

  if (!sheet || sheet.getLastRow() <= 1) {
    var msgVacia = "No hay registros en la hoja para enviar notificaciones.";
    Logger.log(msgVacia);
    try { SpreadsheetApp.getUi().alert(msgVacia); } catch (e) {}
    return;
  }

  inicializarEncabezadosSiEsNecesario(sheet);

  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 14);
  var range = sheet.getRange(1, 1, lastRow, lastCol);
  var allValues = range.getValues();
  var headerRow = allValues[0];
  var rows = allValues.slice(1);

  var colMap = {
    ticketCode: 1,
    firstName: 2,
    lastName: 3,
    email: 4,
    merch: 9,
    notifStatus: 13
  };

  for (var h = 0; h < headerRow.length; h++) {
    var hName = (headerRow[h] || "").toString().toLowerCase().trim();
    if (hName.indexOf("código") >= 0 || hName.indexOf("codigo") >= 0 || hName.indexOf("ticket") >= 0) {
      colMap.ticketCode = h;
    } else if (hName.indexOf("nombre") >= 0 && hName.indexOf("completo") < 0) {
      colMap.firstName = h;
    } else if (hName.indexOf("apellido") >= 0) {
      colMap.lastName = h;
    } else if (hName.indexOf("correo") >= 0 || hName.indexOf("email") >= 0) {
      colMap.email = h;
    } else if (hName.indexOf("merch") >= 0 && hName.indexOf("notific") < 0) {
      colMap.merch = h;
    } else if (hName.indexOf("notific") >= 0 && hName.indexOf("merch") >= 0) {
      colMap.notifStatus = h;
    }
  }

  var candidates = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var rowIndexInSheet = i + 2;
    var email = (r[colMap.email] || "").toString().trim();
    var merchVal = (r[colMap.merch] || "").toString().trim().toLowerCase();
    var notifVal = (r[colMap.notifStatus] || "").toString().trim().toUpperCase();

    if (!email || email.indexOf("@") === -1) continue;
    if (notifVal.indexOf("ENVIADO") >= 0 || notifVal.indexOf("NOTIFICADO") >= 0 || notifVal.indexOf("MERCH VINCULADA") >= 0) continue;

    var yaTieneMerch = Boolean(
      merchVal && 
      merchVal !== "ninguna" && 
      merchVal !== "no" && 
      merchVal !== "disponible próximamente" && 
      merchVal !== "sin merch" &&
      (merchVal.indexOf("t-shirt") >= 0 || merchVal.indexOf("hoodie") >= 0 || merchVal.indexOf("rd$") >= 0)
    );

    if (!yaTieneMerch) {
      candidates.push({
        rowIndex: rowIndexInSheet,
        ticketCode: (r[colMap.ticketCode] || "N/A").toString().trim(),
        firstName: (r[colMap.firstName] || "").toString().trim(),
        lastName: (r[colMap.lastName] || "").toString().trim(),
        email: email
      });
    }
  }

  if (candidates.length === 0) {
    var msgNinguno = "ℹ️ No se encontraron asistentes pendientes de notificar. Todos los registros ya tienen Merch asignada o ya fueron notificados.";
    Logger.log(msgNinguno);
    try { SpreadsheetApp.getUi().alert("Notificación de Merch", msgNinguno, SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) {}
    return;
  }

  var quota = MailApp.getRemainingDailyQuota();
  if (quota <= 5) {
    var msgQuota = "⚠️ ALERTA: Tu cuota diaria de correos es insuficiente (" + quota + " correos restantes). Espera que Google restablezca la cuota en 24 horas.";
    Logger.log(msgQuota);
    try { SpreadsheetApp.getUi().alert("Cuota Insuficiente", msgQuota, SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) {}
    return;
  }

  try {
    var ui = SpreadsheetApp.getUi();
    var confirmResponse = ui.alert(
      "📢 Confirmar Envío Masivo de Merch",
      "Se encontraron " + candidates.length + " asistentes registrados sin Merch.\n" +
      "Tu cuota de envíos disponibles hoy es de " + quota + " correos.\n\n" +
      "¿Deseas iniciar el envío masivo de la invitación oficial de Merch?",
      ui.ButtonSet.YES_NO
    );
    if (confirmResponse !== ui.Button.YES) {
      Logger.log("Envío cancelado por el usuario.");
      return;
    }
  } catch (uiErr) {
    Logger.log("Ejecución en modo no interactivo (sin diálogo UI).");
  }

  var sentCount = 0;
  var errorCount = 0;
  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");

  Logger.log("Iniciando envío masivo a " + candidates.length + " candidatos...");

  for (var c = 0; c < candidates.length; c++) {
    var person = candidates[c];

    if (MailApp.getRemainingDailyQuota() <= 2) {
      Logger.log("⚠️ Cuota límite alcanzada durante el envío masivo. Deteniendo ejecución de forma segura.");
      break;
    }

    try {
      enviarCorreoInvitacionMerch(person);
      sheet.getRange(person.rowIndex, colMap.notifStatus + 1).setValue("ENVIADO (" + timestamp + ")");
      sentCount++;
      Logger.log("[" + sentCount + "/" + candidates.length + "] Correo enviado a: " + person.email);
      Utilities.sleep(300);
    } catch (err) {
      errorCount++;
      Logger.log("Error enviando a " + person.email + ": " + err.toString());
      sheet.getRange(person.rowIndex, colMap.notifStatus + 1).setValue("ERROR (" + timestamp + ")");
    }
  }

  var msgResumen = "✅ Notificación Masiva Finalizada:\n" +
                   "• Correos enviados con éxito: " + sentCount + "\n" +
                   "• Errores: " + errorCount + "\n" +
                   "• Cuota restante hoy: " + MailApp.getRemainingDailyQuota();
  Logger.log(msgResumen);

  try {
    SpreadsheetApp.getUi().alert("Resultado del Envío Masivo", msgResumen, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {}
}
