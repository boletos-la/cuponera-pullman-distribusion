export const formatChileanPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  
  let phone = digits;
  if (phone.startsWith('56')) {
    phone = phone.substring(2);
  }

  // Format: 9 1234 5678
  let formatted = '';
  
  if (phone.length > 0) {
    formatted += phone.substring(0, 1); // e.g. 9
  }
  if (phone.length > 1) {
    formatted += ' ' + phone.substring(1, 5); // 1234
  }
  if (phone.length > 5) {
    formatted += ' ' + phone.substring(5, 9); // 5678
  }

  return formatted;
};

export const validateChileanPhone = (value: string): boolean => {
  // A valid mobile phone in Chile is 9 XXXX XXXX
  const regex = /^9 \d{4} \d{4}$/;
  return value === '' || regex.test(value); // Assuming optional if empty, or we handle required in the component
};
