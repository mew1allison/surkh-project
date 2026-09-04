// Ported verbatim from ai/validator.js (AI Ledger module) so the backend
// stays self-contained. Keep both copies in sync until the ai/ package is
// formally shared.

function isValidDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false
  }
  const date = new Date(dateString)
  return !isNaN(date.getTime()) &&
         date.toISOString().startsWith(dateString)
}

function validateEntry(entry) {
  const errors = []

  const validBloodGroups = [
    'A+', 'A-',
    'B+', 'B-',
    'AB+', 'AB-',
    'O+', 'O-',
  ]

  // 1. Check that entry is an object
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return {
      valid: false,
      status: 'MANUAL_CONFIRMATION',
      errors: ['Invalid entry structure'],
    }
  }

  // 2. Check required fields exist
  if (!Object.hasOwn(entry, 'blood_group')) {
    errors.push('Missing blood group')
  }

  if (!Object.hasOwn(entry, 'quantity')) {
    errors.push('Missing quantity')
  }

  if (!Object.hasOwn(entry, 'date')) {
    errors.push('Missing date')
  }

  // 3. Blood group validation
  if (
    typeof entry.blood_group !== 'string' ||
    !validBloodGroups.includes(entry.blood_group)
  ) {
    errors.push('Invalid or unclear blood group')
  }

  // 4. Quantity validation
  if (
    !Number.isInteger(entry.quantity) ||
    entry.quantity < 0
  ) {
    errors.push('Invalid or unclear quantity')
  }

  // 5. Date validation
  if (
    typeof entry.date !== 'string' ||
    !isValidDate(entry.date)
  ) {
    errors.push('Invalid or unclear date')
  }

  // 6. Suspicious quantity
  if (
    Number.isInteger(entry.quantity) &&
    entry.quantity > 20
  ) {
    errors.push('Quantity is unusually high and requires review')
  }

  // Final result
  if (errors.length === 0) {
    return {
      valid: true,
      status: 'VALID',
      errors: [],
    }
  }

  return {
    valid: false,
    status: 'MANUAL_CONFIRMATION',
    errors: errors,
  }
}

export { validateEntry }
