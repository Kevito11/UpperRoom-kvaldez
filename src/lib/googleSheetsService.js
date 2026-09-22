// Service to integrate registration with Google Sheets & Google Apps Script
// This handles capturing form data into Google Sheets and triggering automated ticket emails.

const APPS_SCRIPT_STORAGE_KEY = 'upper_room_apps_script_url';

export const getAppsScriptUrl = () => {
  return import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || 
         import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL ||
         localStorage.getItem(APPS_SCRIPT_STORAGE_KEY) || 
         '';
};

export const setAppsScriptUrl = (url) => {
  if (!url) {
    localStorage.removeItem(APPS_SCRIPT_STORAGE_KEY);
  } else {
    localStorage.setItem(APPS_SCRIPT_STORAGE_KEY, url.trim());
  }
};

export const formatMerchSummary = (merch) => {
  if (!merch) return 'Ninguna';
  const items = [];
  if (merch.hoodie?.quiere) {
    items.push(`Hoodie (${merch.hoodie.talla} - ${merch.hoodie.color})`);
  }
  if (merch.tshirt?.quiere) {
    items.push(`T-Shirt (${merch.tshirt.talla} - ${merch.tshirt.color})`);
  }
  if (merch.gorra?.quiere) {
    items.push(`Gorra (${merch.gorra.color})`);
  }
  return items.length > 0 ? items.join(', ') : 'Ninguna';
};

/**
 * Sends registration data to Google Apps Script Web App.
 * Uses text/plain to bypass CORS preflight while sending valid JSON in the payload.
 */
export const sendRegistrationToGoogleSheets = async (registrationData, qrCodeUrl) => {
  const url = getAppsScriptUrl();
  
  const merchSummary = formatMerchSummary(registrationData.merch);

  const payload = {
    ticketCode: registrationData.ticketCode,
    firstName: registrationData.firstName,
    lastName: registrationData.lastName,
    fullName: `${registrationData.firstName} ${registrationData.lastName}`,
    email: registrationData.email,
    phone: registrationData.phone,
    ageGroup: registrationData.ageGroup,
    church: registrationData.church,
    taller: registrationData.tallerSeleccionado || 'Sin taller',
    tallerColor: registrationData.tallerColorName || 'N/A',
    merch: merchSummary,
    eventName: "Conferencia Despierta 2026 - Upper Room IBC",
    eventDate: "Sábado 31 de Octubre, 2026 (02:00 PM - 08:00 PM)",
    location: "Auditorio Principal IBC, C. Juan Luis Franco Bidó 25, Santo Domingo",
    qrCodeUrl: qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(registrationData.ticketCode)}`,
    createdAt: registrationData.createdAt || new Date().toISOString()
  };

  if (!url) {
    console.warn("⚠️ No se ha configurado la URL de Google Apps Script. Guardando solo localmente.");
    return { success: false, reason: 'NO_URL_CONFIGURED', payload };
  }

  try {
    // Mode 'no-cors' sends the request directly to Apps Script without getting blocked by browser CORS
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    return { success: true, payload };
  } catch (error) {
    console.error("Error sending to Google Apps Script:", error);
    return { success: false, reason: 'FETCH_ERROR', error, payload };
  }
};
