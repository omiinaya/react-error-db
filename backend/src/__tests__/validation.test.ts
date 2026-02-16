import { validateEmail, validatePassword, validateUsername, validateErrorCode, validateSolutionText, sanitizeInput } from '../utils/validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.org')).toBe(true);
      expect(validateEmail('user+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('StrongP@ss123')).toBe(true);
      expect(validatePassword('MyS3cur3P@ssword!')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('short')).toBe(false);
      expect(validatePassword('nodigits')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
      expect(validatePassword('NoSpecialChars1')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('validateUsername', () => {
    it('should validate correct usernames', () => {
      expect(validateUsername('validuser')).toBe(true);
      expect(validateUsername('user_123')).toBe(true);
      expect(validateUsername('user-name')).toBe(true);
    });

    it('should reject invalid usernames', () => {
      expect(validateUsername('ab')).toBe(false); // too short
      expect(validateUsername('a'.repeat(31))).toBe(false); // too long
      expect(validateUsername('user name')).toBe(false); // spaces
      expect(validateUsername('user/name')).toBe(false); // special chars
    });
  });

  describe('validateErrorCode', () => {
    it('should validate correct error codes', () => {
      expect(validateErrorCode('ERR001')).toBe(true);
      expect(validateErrorCode('E001')).toBe(true);
      expect(validateErrorCode('MY_ERROR_CODE')).toBe(true);
    });

    it('should reject invalid error codes', () => {
      expect(validateErrorCode('A')).toBe(false); // too short (less than 2)
      expect(validateErrorCode('a'.repeat(51))).toBe(false); // too long
      expect(validateErrorCode('error code')).toBe(false); // contains space
    });
  });

  describe('validateSolutionText', () => {
    it('should validate correct solution text', () => {
      expect(validateSolutionText('This is a valid solution with enough characters.')).toBe(true);
      expect(validateSolutionText('x'.repeat(100))).toBe(true);
    });

    it('should reject invalid solution text', () => {
      expect(validateSolutionText('short')).toBe(false); // too short
      expect(validateSolutionText('a'.repeat(10001))).toBe(false); // too long
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML special characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(sanitizeInput('Hello & World')).toBe('Hello &amp; World');
      expect(sanitizeInput('A > B && C < D')).toBe('A &gt; B &amp;&amp; C &lt; D');
    });

    it('should handle empty or invalid input', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });

    it('should pass through normal text', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World');
      expect(sanitizeInput('Simple text without special chars')).toBe('Simple text without special chars');
    });
  });
});
