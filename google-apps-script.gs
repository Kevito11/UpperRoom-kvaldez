/**
 * CONFERENCIA DE JÓVENES 2026 - UPPER ROOM IBC
 * Google Apps Script para captura de datos en Google Sheets y envío automático de boletas por correo.
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Abre tu Google Sheet (https://sheets.google.com)
 * 2. En el menú superior ve a: Extensiones > Apps Script
 * 3. Borra cualquier código existente y pega TODO este archivo.
 * 4. Guarda con Ctrl + S. Al recargar la hoja verás un nuevo menú: "📧 Boletas Despierta".
 * 5. Haz clic en "Implementar" (botón azul arriba a la derecha) > "Nueva implementación".
 * 6. Tipo: Selecciona el ícono de engranaje ⚙️ y elige "Aplicación web".
 * 7. Configuración:
 *    - Descripción: "Webhook Registro Despierta 2026"
 *    - Ejecutar como: "Yo" (tu cuenta de Google)
 *    - Quién tiene acceso: "Cualquiera" (IMPORTANTE: para que la web de React pueda enviar datos sin pedir login de Google).
 * 8. Haz clic en "Implementar", autoriza los permisos que te solicite Google y copia la URL generada.
 * 9. Pega esa URL en tu archivo .env como VITE_GOOGLE_SHEETS_WEBHOOK_URL.
 * 
 * CÓMO CREAR EL BOTÓN FÍSICO EN LA HOJA DE CÁLCULO:
 * 1. En tu Google Sheet ve al menú: Insertar > Dibujo.
 * 2. Selecciona una Forma (un rectángulo redondeado), dale color y escribe: "📊 Consultar Correos Restantes".
 * 3. Haz clic en "Guardar y cerrar".
 * 4. Arrastra el botón donde quieras en la hoja (arriba de la tabla).
 * 5. Haz clic en los 3 puntos verticales del botón y selecciona "Asignar secuencia de comandos".
 * 6. Escribe: checkRemainingEmailQuota y pulsa "Aceptar".
 * ¡Listo! Cada vez que pulses ese botón te saldrá una ventana con los correos exactos que te quedan hoy.
 */

// 1. Recibe los datos desde la aplicación web de React
function doPost(e) {
  try {
    // Si se ejecuta manualmente desde el botón "Ejecutar" del editor de Apps Script (sin petición HTTP real)
    if (!e || !e.postData) {
      Logger.log("⚠️ AVISO: 'doPost' fue ejecutado manualmente desde el editor de Apps Script.");
      Logger.log("👉 Para probar el script directamente desde el editor, selecciona la función 'testDoPost' en el menú superior y pulsa 'Ejecutar'.");
      return ContentService.createTextOutput(JSON.stringify({
        status: "notice",
        message: "doPost espera una petición HTTP POST real de la web. Para pruebas dentro del editor usa testDoPost()."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Registros Conferencia");
    
    if (!sheet) {
      sheet = ss.insertSheet("Registros Conferencia");
    }
    
    // Si la hoja está vacía, agregamos los encabezados oficiales
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
        "Asistencia en Puerta"
      ];
      sheet.appendRow(headers);
      
      // Dar formato elegante al encabezado
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#0f0c0a");
      headerRange.setFontColor("#ff8c00");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    
    // Formatear la fecha local
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    
    // Insertar la fila de registro
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
      "NO ASISTIDO"
    ]);
    
    // Enviar el correo con el boleto y el código QR
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

// 2. Respuesta para pruebas desde navegador (GET)
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    service: "Conferencia Despierta 2026 - Upper Room IBC",
    message: "El Webhook de Google Apps Script está activo y listo para recibir registros."
  })).setMimeType(ContentService.MimeType.JSON);
}

// 3. Generación y envío del correo con diseño oficial de la conferencia
function enviarBoletoPorCorreo(data) {
  try {
    var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=" + encodeURIComponent(data.ticketCode);
    var subject = "¡Tu registro a la Conferencia Upper Room está confirmado! 🙌";
    
    // Versión en texto plano (Fallback para clientes de correo básicos)
    var plainTextBody = 
      "¡Tu registro a la Conferencia Upper Room está confirmado! 🙌\n\n" +
      "Querido Upperamigo" + (data.firstName ? " (" + data.firstName + ")" : "") + ",\n\n" +
      "¡Gracias por registrarte en nuestra Conferencia Upper Room 2026! 🙌 Estamos emocionados de compartir contigo un tiempo especial de crecimiento, aprendizaje y comunión en la presencia de Dios. ✨\n\n" +
      "Tu registro ha sido recibido exitosamente. 🎉 ¡Ya eres parte de lo que Dios hará en esta conferencia! 🔥\n\n" +
      "🎟️ TU CÓDIGO DE ENTRADA: " + data.ticketCode + "\n\n" +
      "📌 Información importante:\n" +
      "• 📅 Fecha: 31 de Octubre, 2026\n" +
      "• 📍 Lugar: Iglesia Bautista Cristiana (IBC)\n" +
      "• ⏰ Hora de llegada: 2:30 PM - 3:00 PM\n" +
      "• 🎟️ Actividad: Conferencia Upper Room 2026\n" +
      "• ⛪ Tu Congregación: " + data.church + "\n" +
      (data.taller && data.taller !== 'Sin taller' ? "• 🎯 Taller asignado: " + data.taller + "\n" : "") +
      (data.merch && data.merch !== 'Ninguna' ? "• 🛍️ Merch pre-ordenada: " + data.merch + "\n" : "") + "\n" +
      "💡 ¿Qué debes saber?\n" +
      "1. Llega a tiempo para el parqueo, registro y la bienvenida. 🚗💨\n" +
      "2. Mantente atento a nuestras redes sociales para conocer las actualizaciones y detalles de la conferencia. 📱👀\n" +
      "3. Prepárate para recibir, aprender y servir a Dios junto a otros jóvenes. 🙏🔥\n\n" +
      "Esta conferencia ha sido preparada con el deseo de equiparnos como servidores de Cristo y crecer juntos en nuestra relación con Él. 📖🕊️\n\n" +
      "¡Gracias por ser parte de Upper Room! 🧡\n\n" +
      "Con mucho cariño,\n" +
      "Equipo Ministerio Upper Room IBC ✝️\n\n" +
      "Instagram oficial: https://www.instagram.com/upperroomibcrd/";

    // Versión enriquecida en HTML (Diseño oficial Obsidian & Flame)
    var htmlBody = `
      <div style="background-color: #06080d; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px 20px; border-radius: 14px; border: 1px solid rgba(255, 106, 0, 0.35);">
        
        <!-- Header Oficial -->
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

        <!-- Saludo & Confirmación -->
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

        <!-- Tarjeta de Credencial & Código QR -->
        <div style="background-color: #0c0f17; border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 10px; padding: 22px 18px; margin-bottom: 24px; text-align: center;">
          <span style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">
            🎟️ TU BOLETO DIGITAL DE ACCESO
          </span>
          <div style="font-size: 26px; font-weight: 800; color: #f59e0b; letter-spacing: 3px; font-family: monospace; margin: 8px 0 14px;">
            ${data.ticketCode}
          </div>

          <!-- Código QR -->
          <div style="background-color: #ffffff; padding: 12px; display: inline-block; border-radius: 8px; box-shadow: 0 8px 25px rgba(0,0,0,0.8); margin-bottom: 12px;">
            <img src="${qrUrl}" alt="QR Ticket" width="170" height="170" style="display: block; border: none;" />
          </div>

          <p style="font-size: 12px; color: #e5e7eb; margin: 0; font-weight: 500;">
            📲 Presenta este código QR desde tu celular al llegar para agilizar tu acceso.
          </p>
        </div>

        <!-- 📌 Información Importante -->
        <div style="background-color: #0c0f17; border-left: 3px solid #f59e0b; border-radius: 8px; padding: 18px 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 14px; font-size: 15px; color: #f59e0b; letter-spacing: 0.5px;">
            📌 Información importante
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e5e7eb;">
            <tr>
              <td style="padding: 7px 0; width: 44%; color: #9ca3af;">📅 Fecha:</td>
              <td style="padding: 7px 0; font-weight: 700; color: #ffffff;">31 de Octubre, 2026</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #9ca3af;">📍 Lugar:</td>
              <td style="padding: 7px 0; font-weight: 700; color: #ffffff;">Iglesia Bautista Cristiana (IBC)</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #9ca3af;">⏰ Hora de llegada:</td>
              <td style="padding: 7px 0; font-weight: 700; color: #fbbf24;">2:30 PM - 3:00 PM</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #9ca3af;">🎟️ Actividad:</td>
              <td style="padding: 7px 0; font-weight: 700; color: #ffffff;">Conferencia Upper Room 2026</td>
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
            ${data.merch && data.merch !== 'Ninguna' ? `
            <tr>
              <td style="padding: 7px 0; color: #9ca3af;">🛍️ Merch Separada:</td>
              <td style="padding: 7px 0; font-weight: 600; color: #ffffff;">${data.merch}</td>
            </tr>` : ''}
          </table>
        </div>

        <!-- 💡 ¿Qué debes saber? -->
        <div style="background-color: #0c0f17; border-radius: 8px; padding: 18px 20px; margin-bottom: 22px; border: 1px solid rgba(255,255,255,0.06);">
          <h3 style="margin: 0 0 12px; font-size: 15px; color: #fbbf24;">
            💡 ¿Qué debes saber?
          </h3>
          <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #d1d5db; line-height: 1.8;">
            <li style="margin-bottom: 6px;">
              <strong>Llega a tiempo:</strong> Para el parqueo, registro y la bienvenida. 🚗💨
            </li>
            <li style="margin-bottom: 6px;">
              <strong>Mantente atento:</strong> A nuestras redes sociales para conocer las actualizaciones y detalles de la conferencia. 📱👀
            </li>
            <li>
              <strong>Prepárate con fe:</strong> Para recibir, aprender y servir a Dios junto a otros jóvenes. 🙏🔥
            </li>
          </ol>
        </div>

        <!-- Mensaje de Cierre -->
        <div style="padding: 6px 4px 18px;">
          <p style="font-size: 14px; color: #9ca3af; line-height: 1.65; margin: 0 0 14px;">
            Esta conferencia ha sido preparada con el deseo de equiparnos como servidores de Cristo y crecer juntos en nuestra relación con Él. 📖🕊️
          </p>
          <p style="font-size: 16px; color: #ffffff; font-weight: 800; margin: 0 0 18px;">
            ¡Gracias por ser parte de Upper Room! 🧡
          </p>
          <p style="font-size: 14px; color: #e5e7eb; line-height: 1.5; margin: 0;">
            Con mucho cariño,<br/><br/>
            <strong style="color: #f59e0b; font-size: 15px; letter-spacing: 0.5px;">Equipo Ministerio Upper Room IBC</strong> ✝️
          </p>
        </div>

        <!-- Footer -->
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

/**
 * =========================================================================
 * MENÚ Y BOTÓN PARA CONSULTAR CUOTA DE CORREOS RESTANTES
 * =========================================================================
 * 
 * Se ejecuta automáticamente al abrir la hoja de cálculo.
 * Crea un menú superior personalizado en Google Sheets llamado "📧 Boletas Despierta".
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📧 Boletas Despierta')
    .addItem('📊 Ver cuota de correos restantes', 'checkRemainingEmailQuota')
    .addSeparator()
    .addItem('✉️ Enviar correo de prueba a mi email', 'sendTestEmail')
    .addToUi();
}

/**
 * Consulta y muestra una ventana emergente con los correos disponibles hoy.
 * TAMBIÉN PUEDES ASIGNAR ESTA FUNCIÓN A UN BOTÓN DIBUJADO EN LA HOJA:
 * 1. En Google Sheets: Menú Insertar > Dibujo.
 * 2. Dibuja un botón o forma, escribe "📊 Correos Restantes" y haz clic en "Guardar y cerrar".
 * 3. Haz clic en los 3 puntos verticales del dibujo en la hoja > "Asignar secuencia de comandos".
 * 4. Escribe: checkRemainingEmailQuota y dale a Aceptar.
 */
function checkRemainingEmailQuota() {
  try {
    var quota = MailApp.getRemainingDailyQuota();
    var ui = SpreadsheetApp.getUi();
    
    var mensaje = "Te quedan " + quota + " correos disponibles para enviar en las próximas 24 horas.\n\n" +
                  "ℹ️ Referencias de límites diarios de Google:\n" +
                  "• Cuentas gratuitas (@gmail.com): 100 correos/día.\n" +
                  "• Cuentas Google Workspace / Google for Nonprofits: hasta 1,500 correos/día.\n\n" +
                  "La cuota se reinicia automáticamente de forma gradual cada 24 horas.";
                  
    ui.alert("📬 Cuota Diaria de Correos", mensaje, ui.ButtonSet.OK);
    
  } catch (error) {
    SpreadsheetApp.getUi().alert("Error al consultar cuota: " + error.toString());
  }
}

/**
 * Envía un correo de prueba al email del propietario de la hoja para validar el funcionamiento.
 */
function sendTestEmail() {
  var ui = SpreadsheetApp.getUi();
  var myEmail = Session.getActiveUser().getEmail();
  
  if (!myEmail) {
    ui.alert("No se pudo detectar tu dirección de correo electrónico.");
    return;
  }
  
  var response = ui.alert(
    "Enviar correo de prueba",
    "¿Deseas enviar un correo de prueba a tu dirección (" + myEmail + ")?",
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    try {
      enviarBoletoPorCorreo({
        firstName: "Samuel",
        lastName: "Castillo",
        email: myEmail,
        ticketCode: "UR26-DEMO",
        church: "Iglesia Bautista Cristiana (IBC)",
        taller: "¿Dónde quedó el fuego? (Rojo)",
        merch: "Sudadera (M, Negro Obsidian)"
      });
      ui.alert("¡Éxito!", "Correo oficial de prueba enviado a " + myEmail + ".\nRevisa tu bandeja de entrada.", ui.ButtonSet.OK);
    } catch (e) {
      ui.alert("Error al enviar prueba: " + e.toString());
    }
  }
}

/**
 * Función especial para probar todo el flujo directamente desde el editor de Google Apps Script.
 * Selecciona "testDoPost" en el menú de funciones de arriba y pulsa "▷ Ejecutar".
 * Esto simulará un registro web real, insertará la fila en tu Google Sheet y te enviará el correo a ti.
 */
function testDoPost() {
  var myEmail = Session.getActiveUser().getEmail();
  Logger.log("Iniciando prueba simulada con destino: " + myEmail);
  
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        ticketCode: "IBC-UR-" + Math.floor(100000 + Math.random() * 900000),
        firstName: "Usuario",
        lastName: "De Prueba",
        fullName: "Usuario De Prueba",
        email: myEmail,
        phone: "809-555-0123",
        ageGroup: "19 - 25",
        church: "Iglesia Bautista Cristiana (IBC)",
        taller: "¿Dónde quedó el fuego? (Rojo)",
        merch: "Hoodie (M - Negro Obsidian)",
        eventName: "Conferencia Despierta 2026 - Upper Room IBC",
        eventDate: "Sábado 31 de Octubre, 2026 (03:00 PM - 08:30 PM)",
        location: "Auditorio Principal IBC, C. Juan Luis Franco Bidó 25, Santo Domingo",
        createdAt: new Date().toISOString()
      })
    }
  };
  
  var result = doPost(mockEvent);
  Logger.log("✅ Prueba completada con resultado: " + result.getContent());
}
