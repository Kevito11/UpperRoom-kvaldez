// Ticket & Registration Management for Upper Room IBC
// Local-first offline-capable storage system

const STORAGE_KEY = 'upper_room_ibc_registrations';

export const isInvalidTicketCode = (code) => {
  if (!code || typeof code !== 'string') return true;
  const upper = code.trim().toUpperCase();
  return (
    upper === 'CONFIRMADO' ||
    upper === 'CONFIRMED' ||
    upper === 'PENDIENTE' ||
    upper === 'ASISTIDO' ||
    upper === 'ATTENDED' ||
    upper === 'NO ASISTIDO' ||
    upper === 'N/A' ||
    upper === 'CANCELLED' ||
    upper === 'SIN CÓDIGO' ||
    upper.length < 3
  );
};

/**
 * Retrieves all registrations stored in localStorage
 */
export const getRegistrations = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const list = JSON.parse(data);
    if (!Array.isArray(list)) return [];
    let hasRepairs = false;
    const cleaned = list.map((item, idx) => {
      let code = item.ticketCode;
      if (isInvalidTicketCode(code)) {
        if (!isInvalidTicketCode(item.id)) {
          code = item.id;
        } else if (!isInvalidTicketCode(item.code)) {
          code = item.code;
        } else if (!isInvalidTicketCode(item.ticket_code)) {
          code = item.ticket_code;
        } else {
          const str = (item.email || item.fullName || item.phone || `UR-${idx}`).toLowerCase();
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
          }
          const num = Math.abs(hash) % 900000 + 100000;
          code = `IBC-UR-${num}`;
        }
        hasRepairs = true;
      }
      return {
        ...item,
        ticketCode: code,
        id: code
      };
    });

    if (hasRepairs) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      } catch (e) {}
    }

    return cleaned;
  } catch (error) {
    console.error('Error reading registrations:', error);
    return [];
  }
};

/**
 * Saves or updates a registration locally
 */
export const saveRegistration = (data) => {
  try {
    const existing = getRegistrations();
    const newRecord = {
      ...data,
      id: data.ticketCode,
      createdAt: data.createdAt || new Date().toISOString(),
      status: data.status || 'CONFIRMED' // 'CONFIRMED' | 'ATTENDED' | 'CANCELLED'
    };
    
    // Check if record already exists, replace or prepend
    const existingIndex = existing.findIndex(
      r => r.ticketCode?.toUpperCase() === data.ticketCode?.toUpperCase()
    );

    let updated;
    if (existingIndex >= 0) {
      updated = [...existing];
      updated[existingIndex] = { ...updated[existingIndex], ...newRecord };
    } else {
      updated = [newRecord, ...existing];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  } catch (error) {
    console.error('Error saving registration:', error);
    return null;
  }
};

/**
 * Fast Registration for door/walk-ins:
 * Only requires Full Name, Email, and Phone.
 */
export const saveQuickRegistration = ({ fullName, email, phone, autoCheckIn = true }) => {
  try {
    const cleanName = (fullName || '').trim();
    const nameParts = cleanName.split(' ');
    const firstName = nameParts[0] || 'Asistente';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Generate unique Upper Room ticket code
    const ticketCode = `IBC-UR-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const timestamp = now.toISOString();

    const quickRecord = {
      id: ticketCode,
      ticketCode,
      firstName,
      lastName,
      fullName: cleanName || `${firstName} ${lastName}`.trim(),
      email: (email || '').trim().toLowerCase(),
      phone: (phone || '').trim(),
      ageGroup: 'General',
      church: 'Invitado / IBC',
      taller: 'Plenaria General',
      tallerSeleccionado: 'Plenaria General',
      merchSummary: 'Ninguna',
      status: autoCheckIn ? 'ATTENDED' : 'CONFIRMED',
      attended: !!autoCheckIn,
      attendedAt: autoCheckIn ? timestamp : null,
      createdAt: timestamp,
      isQuickRegistration: true,
      eventName: "Conferencia Despierta 2026 - Upper Room IBC"
    };

    const existing = getRegistrations();
    const updated = [quickRecord, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return quickRecord;
  } catch (error) {
    console.error('Error creating quick registration:', error);
    return null;
  }
};

/**
 * Finds a single registration by exact ticket code
 */
export const findRegistrationByCode = (ticketCode) => {
  if (!ticketCode) return null;
  const registrations = getRegistrations();
  return registrations.find(r => r.ticketCode?.toUpperCase() === ticketCode.toUpperCase()) || null;
};

/**
 * Searches registrations locally by name, email, phone, or ticket code
 */
export const findRegistrationsByContact = (query) => {
  if (!query) return [];
  const cleanQuery = query.trim().toLowerCase();
  const rawDigits = query.replace(/\D/g, '');
  const registrations = getRegistrations();
  
  return registrations.filter(r => {
    const name = `${r.firstName || ''} ${r.lastName || ''} ${r.fullName || ''}`.toLowerCase();
    const email = (r.email || '').toLowerCase();
    const phone = (r.phone || '').replace(/\D/g, '');
    const code = (r.ticketCode || '').toLowerCase();
    const church = (r.church || '').toLowerCase();

    return (
      name.includes(cleanQuery) ||
      email.includes(cleanQuery) ||
      code.includes(cleanQuery) ||
      church.includes(cleanQuery) ||
      (rawDigits.length >= 3 && phone.includes(rawDigits))
    );
  });
};

/**
 * Marks attendance for an attendee by ticketCode
 */
export const markAttendance = (ticketCode) => {
  try {
    const registrations = getRegistrations();
    let updatedRecord = null;
    const now = new Date().toISOString();

    const updated = registrations.map(r => {
      if (r.ticketCode?.toUpperCase() === ticketCode.toUpperCase()) {
        updatedRecord = { 
          ...r, 
          status: 'ATTENDED', 
          attended: true,
          attendedAt: r.attendedAt || now 
        };
        return updatedRecord;
      }
      return r;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updatedRecord;
  } catch (error) {
    console.error('Error marking attendance:', error);
    return null;
  }
};

/**
 * Unmarks attendance (reverts back to CONFIRMED) in case of accidental click
 */
export const unmarkAttendance = (ticketCode) => {
  try {
    const registrations = getRegistrations();
    let updatedRecord = null;

    const updated = registrations.map(r => {
      if (r.ticketCode?.toUpperCase() === ticketCode.toUpperCase()) {
        updatedRecord = { 
          ...r, 
          status: 'CONFIRMED', 
          attended: false,
          attendedAt: null 
        };
        return updatedRecord;
      }
      return r;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updatedRecord;
  } catch (error) {
    console.error('Error unmarking attendance:', error);
    return null;
  }
};

/**
 * Toggles attendance status between ATTENDED and CONFIRMED
 */
export const toggleAttendance = (ticketCode) => {
  const item = findRegistrationByCode(ticketCode);
  if (!item) return null;
  if (item.status === 'ATTENDED' || item.attended) {
    return unmarkAttendance(ticketCode);
  } else {
    return markAttendance(ticketCode);
  }
};

/**
 * Calculates check-in metrics
 */
export const getCheckInStats = (list = null) => {
  const items = list !== null ? list : getRegistrations();
  const total = items.length;
  const attended = items.filter(r => r.status === 'ATTENDED' || r.attended).length;
  const pending = total - attended;
  const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

  return { total, attended, pending, percentage };
};

/**
 * Replaces local registrations strictly with the records present in Google Sheets.
 * Google Sheets is the source of truth when downloading data.
 */
export const replaceWithRemoteRegistrations = (remoteList = []) => {
  try {
    if (!Array.isArray(remoteList)) {
      return { mergedList: getRegistrations(), total: 0 };
    }

    // Build the list directly from Google Sheets rows
    const cleanList = remoteList
      .filter(item => item && (item.ticketCode || item.id || item.fullName || item.firstName || item.email))
      .map((remoteItem, index) => {
        let rawCode = (remoteItem.ticketCode || remoteItem.id || remoteItem.code || remoteItem.ticket_code || remoteItem.ticket || '').toString().toUpperCase().trim();
        if (isInvalidTicketCode(rawCode)) {
          const str = (remoteItem.email || remoteItem.fullName || `${remoteItem.firstName || ''} ${remoteItem.lastName || ''}` || `UR-${index}`).toLowerCase();
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
          }
          const num = Math.abs(hash) % 900000 + 100000;
          rawCode = `IBC-UR-${num}`;
        }
        const ticketCode = rawCode;

        // Interpret attendance from Google Sheets
        const rawPuerta = String(remoteItem.puertaStatus || '').toUpperCase().trim();
        const rawStatus = String(remoteItem.status || '').toUpperCase().trim();
        const isAttended = Boolean(
          remoteItem.attended === true ||
          remoteItem.attended === 'true' ||
          remoteItem.attended === 'TRUE' ||
          rawPuerta === 'ASISTIDO' ||
          rawPuerta === 'ATTENDED' ||
          rawPuerta === 'TRUE' ||
          rawPuerta === 'SI' ||
          rawPuerta === 'SÍ' ||
          rawStatus === 'ATTENDED' ||
          rawStatus === 'ASISTIDO'
        );

        const firstName = remoteItem.firstName || '';
        const lastName = remoteItem.lastName || '';
        const fullName = remoteItem.fullName || `${firstName} ${lastName}`.trim() || 'Asistente';

        return {
          ...remoteItem,
          id: ticketCode,
          ticketCode: ticketCode,
          firstName: firstName,
          lastName: lastName,
          fullName: fullName,
          email: remoteItem.email || '',
          phone: remoteItem.phone || '',
          church: remoteItem.church || 'Invitado',
          taller: remoteItem.taller || remoteItem.tallerSeleccionado || 'Sin taller',
          tallerSeleccionado: remoteItem.tallerSeleccionado || remoteItem.taller || 'Sin taller',
          merch: remoteItem.merch || remoteItem.merchSummary || 'Ninguna',
          merchSummary: remoteItem.merchSummary || remoteItem.merch || 'Ninguna',
          status: isAttended ? 'ATTENDED' : 'CONFIRMED',
          attended: isAttended,
          attendedAt: remoteItem.attendedAt || (isAttended ? new Date().toISOString() : null),
          createdAt: remoteItem.createdAt || new Date().toISOString()
        };
      });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
    return {
      mergedList: cleanList,
      total: cleanList.length
    };
  } catch (error) {
    console.error('Error synchronizing with remote registrations:', error);
    return { mergedList: getRegistrations(), total: 0 };
  }
};

// Alias para compatibilidad
export const mergeRemoteRegistrations = replaceWithRemoteRegistrations;

/**
 * Exports registrations to a CSV file and triggers a direct browser download.
 * Formatted with UTF-8 BOM so Spanish characters open perfectly in Excel and Google Sheets.
 */
export const exportRegistrationsToCSV = (items = null) => {
  const registrations = items || getRegistrations();
  if (!registrations || registrations.length === 0) {
    return false;
  }

  const headers = [
    "Código Ticket",
    "Nombre",
    "Apellidos",
    "Nombre Completo",
    "Correo Electrónico",
    "Teléfono",
    "Iglesia / Procedencia",
    "Taller Asignado",
    "Pre-orden Merch",
    "Estado Ticket",
    "Asistencia en Puerta",
    "Fecha Check-In",
    "Fecha Registro"
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = registrations.map(r => {
    const isAttended = r.status === 'ATTENDED' || r.attended;
    const fullName = r.fullName || `${r.firstName || ''} ${r.lastName || ''}`.trim();
    return [
      escapeCSV(r.ticketCode || ''),
      escapeCSV(r.firstName || ''),
      escapeCSV(r.lastName || ''),
      escapeCSV(fullName),
      escapeCSV(r.email || ''),
      escapeCSV(r.phone || ''),
      escapeCSV(r.church || 'Invitado'),
      escapeCSV(r.tallerSeleccionado || r.taller || 'Sin taller'),
      escapeCSV(r.merchSummary || r.merch || 'Ninguna'),
      escapeCSV(r.status || 'CONFIRMED'),
      escapeCSV(isAttended ? 'ASISTIDO' : 'NO ASISTIDO'),
      escapeCSV(r.attendedAt || ''),
      escapeCSV(r.createdAt || '')
    ].join(',');
  });

  // UTF-8 BOM for perfect Excel compatibility
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Format filename with current timestamp
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const filename = `CheckIn_UpperRoom_Despierta_${dateStr}.csv`;

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
};
