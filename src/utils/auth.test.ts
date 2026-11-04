import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEmail, validatePassword, authenticateUser } from './auth';
import { User } from '../types';

const testUsers: User[] = [
  { id: 'u1', name: 'Alex Rivera', email: 'alex@splitmate.app', avatar: '' },
  { id: 'u2', name: 'Maya Patel', email: 'maya@splitmate.app', avatar: '' },
];

test('validateEmail validates format correctly', () => {
  assert.equal(validateEmail('alex@splitmate.app'), true);
  assert.equal(validateEmail('user.name+tag@example.co.uk'), true);
  assert.equal(validateEmail('invalid-email'), false);
  assert.equal(validateEmail('@missinguser.com'), false);
  assert.equal(validateEmail(''), false);
});

test('validatePassword enforces minimum length of 6 characters', () => {
  assert.equal(validatePassword('123456').valid, true);
  assert.equal(validatePassword('securePass123').valid, true);
  assert.equal(validatePassword('12345').valid, false);
  assert.equal(validatePassword('').valid, false);
});

test('authenticateUser matches existing users case-insensitively', () => {
  const match = authenticateUser('ALEX@splitmate.app', testUsers);
  assert.ok(match);
  assert.equal(match.id, 'u1');

  const noMatch = authenticateUser('nonexistent@example.com', testUsers);
  assert.equal(noMatch, null);
});
