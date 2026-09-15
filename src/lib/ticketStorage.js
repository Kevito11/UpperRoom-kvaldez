// Ticket & Registration Management for Upper Room IBC

const STORAGE_KEY = 'upper_room_ibc_registrations';

export const saveRegistration = (data) => {
  try {
    const existing = getRegistrations();
    const newRecord = {
      ...data,
      id: data.ticketCode,
      createdAt: new Date().toISOString(),
      status: 'CONFIRMED' // 'CONFIRMED' | 'ATTENDED' | 'CANCELLED'
    };
    const updated = [newRecord, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  } catch (error) {
    console.error('Error saving registration:', error);
    return null;
  }
};

export const getRegistrations = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading registrations:', error);
    return [];
  }
};

export const findRegistrationByCode = (ticketCode) => {
  if (!ticketCode) return null;
  const registrations = getRegistrations();
  return registrations.find(r => r.ticketCode?.toUpperCase() === ticketCode.toUpperCase()) || null;
};

export const findRegistrationsByContact = (query) => {
  if (!query) return [];
  const cleanQuery = query.trim().toLowerCase();
  const registrations = getRegistrations();
  return registrations.filter(r => 
    r.email?.toLowerCase().includes(cleanQuery) || 
    r.phone?.replace(/\D/g, '').includes(cleanQuery.replace(/\D/g, '')) ||
    r.ticketCode?.toLowerCase().includes(cleanQuery) ||
    `${r.firstName} ${r.lastName}`.toLowerCase().includes(cleanQuery)
  );
};

export const markAttendance = (ticketCode) => {
  try {
    const registrations = getRegistrations();
    let updatedRecord = null;
    const updated = registrations.map(r => {
      if (r.ticketCode?.toUpperCase() === ticketCode.toUpperCase()) {
        updatedRecord = { ...r, status: 'ATTENDED', attendedAt: new Date().toISOString() };
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
