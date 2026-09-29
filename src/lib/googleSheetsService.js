// Service to integrate registration and check-in with Google Sheets & Google Apps Script
import { 
  getRegistrations, 
  mergeRemoteRegistrations, 
  exportRegistrationsToCSV 
} from './ticketStorage';

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
 * Sends standard registration data to Google Apps Script Web App.
 * Uses text/plain to bypass CORS preflight while sending valid JSON in the payload.
 */
export const sendRegistrationToGoogleSheets = async (registrationData, qrCodeUrl) => {
  const url = getAppsScriptUrl();
  
  const merchSummary = formatMerchSummary(registrationData.merch);

  const payload = {
    action: 'register',
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

/**
 * Sends Quick Door/Walk-in Registration to Google Apps Script
 */
export const sendQuickRegistrationToGoogleSheets = async (quickData) => {
  const url = getAppsScriptUrl();
  if (!url) {
    return { success: false, reason: 'NO_URL_CONFIGURED' };
  }

  const payload = {
    action: 'quickRegister',
    ticketCode: quickData.ticketCode,
    firstName: quickData.firstName,
    lastName: quickData.lastName,
    fullName: quickData.fullName,
    email: quickData.email,
    phone: quickData.phone,
    church: quickData.church || 'Invitado / IBC',
    taller: 'Plenaria General',
    attended: !!quickData.attended,
    attendedAt: quickData.attendedAt || new Date().toISOString(),
    sendEmail: false
  };

  try {
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
    console.error("Error sending quick registration:", error);
    return { success: false, error };
  }
};

/**
 * Fetches the entire registration list from Google Sheets via GET request
 */
export const fetchRegistrationsFromGoogleSheets = async () => {
  const url = getAppsScriptUrl();
  if (!url) {
    console.warn("No Google Apps Script URL configured");
    return { success: false, reason: 'NO_URL_CONFIGURED', registrations: [] };
  }

  try {
    const fetchUrl = `${url}?action=getRegistrations&t=${Date.now()}`;
    const response = await fetch(fetchUrl, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (data && data.status === 'success' && Array.isArray(data.registrations)) {
      return { 
        success: true, 
        registrations: data.registrations, 
        total: data.total !== undefined ? data.total : data.registrations.length 
      };
    } else {
      return { 
        success: false, 
        reason: 'INVALID_RESPONSE', 
        message: data?.message || 'Respuesta no válida de Google Sheets' 
      };
    }
  } catch (error) {
    console.error("Error fetching registrations from Google Sheets:", error);
    return { success: false, reason: 'FETCH_ERROR', message: error.message, error };
  }
};

/**
 * Synchronizes local attendance records (Check-Ins) to Google Sheets
 */
export const syncAttendanceToGoogleSheets = async (checkInsList) => {
  const url = getAppsScriptUrl();
  if (!url) {
    return { success: false, reason: 'NO_URL_CONFIGURED' };
  }

  const payload = {
    action: 'syncAttendance',
    checkIns: checkInsList.map(item => ({
      ticketCode: item.ticketCode,
      attended: item.status === 'ATTENDED' || item.attended,
      attendedAt: item.attendedAt || new Date().toISOString()
    }))
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    return { success: true, count: checkInsList.length };
  } catch (error) {
    console.error("Error syncing attendance to Google Sheets:", error);
    return { success: false, error };
  }
};

/**
 * TWO-WAY SYNC WITH GOOGLE SHEETS:
 * 1. Lee y mantiene en local lo que está actualmente en el documento Google Sheet.
 * 2. Hace que los ingresados localmente se actualicen en el documento Google Sheet.
 * 3. Actualiza el estado actual de los participantes en el móvil/navegador sin descargar archivos.
 */
export const syncWithGoogleSheets = async () => {
  const localItems = getRegistrations();
  const attendedItems = localItems.filter(r => r.status === 'ATTENDED' || r.attended);

  let uploadSuccess = false;
  let downloadSuccess = false;
  let mergedResult = null;
  let errorMsg = null;

  // 1. Actualizar en Google Sheets los ingresados localmente
  try {
    if (attendedItems.length > 0) {
      await syncAttendanceToGoogleSheets(attendedItems);
      uploadSuccess = true;
    } else {
      uploadSuccess = true;
    }
  } catch (err) {
    console.warn("Error enviando check-ins a Google Sheets:", err);
  }

  // 2. Leer lo que está actualmente en el documento Google Sheets y sincronizarlo en local
  try {
    const fetchRes = await fetchRegistrationsFromGoogleSheets();
    if (fetchRes.success && fetchRes.registrations) {
      mergedResult = mergeRemoteRegistrations(fetchRes.registrations);
      downloadSuccess = true;
    } else {
      errorMsg = fetchRes.reason || 'No se pudo conectar con Google Sheets';
    }
  } catch (err) {
    console.warn("Error leyendo de Google Sheets:", err);
    errorMsg = err.message;
  }

  const currentData = getRegistrations();

  return {
    success: uploadSuccess || downloadSuccess,
    cloudSync: uploadSuccess && downloadSuccess,
    uploadedCount: attendedItems.length,
    newRecordsCount: mergedResult ? mergedResult.newCount : 0,
    totalRecords: currentData.length,
    errorMessage: errorMsg
  };
};

// Alias para compatibilidad
export const syncAndDownloadCheckInData = syncWithGoogleSheets;
