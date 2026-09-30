const assert = require('node:assert/strict');
const dns = require('node:dns');
const test = require('node:test');
const { validateUrl, isPublicAddress } = require('../src/services/urlValidator');
const { publicAddressLookup } = require('../src/services/checker');
const { sequelize } = require('../src/config/db');
const { User, MonitoredSite, Check, AlertLog } = require('../src/models');

test('Sequelize models retain the MySQL API schema', () => {
  assert.equal(sequelize.getDialect(), 'mysql');
  assert.equal(User.primaryKeyAttribute, '_id');
  assert.equal(MonitoredSite.primaryKeyAttribute, '_id');
  assert.equal(Check.primaryKeyAttribute, '_id');
  assert.equal(AlertLog.primaryKeyAttribute, '_id');
  assert.equal(MonitoredSite.tableName, 'monitored_sites');
  assert.equal(Check.tableName, 'checks');
  assert.equal(AlertLog.tableName, 'alert_logs');
  assert.ok(MonitoredSite.options.indexes.some(({ fields }) => fields.includes('owner')));
  assert.ok(Check.options.indexes.some(({ fields }) => fields.join(',') === 'site,timestamp'));
});

test('URL validation rejects private literals and unsupported protocols', () => {
  for (const url of [
    'http://127.0.0.1',
    'http://10.0.0.4',
    'http://192.168.1.2',
    'http://[::1]',
    'http://internal.local',
    'file:///etc/passwd',
  ]) {
    assert.equal(validateUrl(url).valid, false, url);
  }

  assert.equal(validateUrl('https://example.com').valid, true);
});

test('address classification blocks private and special-use ranges', () => {
  for (const address of [
    '127.0.0.1',
    '10.0.0.1',
    '172.20.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '::1',
    'fd00::1',
    '::ffff:127.0.0.1',
  ]) {
    assert.equal(isPublicAddress(address), false, address);
  }

  assert.equal(isPublicAddress('1.1.1.1'), true);
  assert.equal(isPublicAddress('2606:4700:4700::1111'), true);
});

test('DNS resolution refuses a hostname that resolves to a private address', async () => {
  const originalLookup = dns.lookup;
  dns.lookup = (_hostname, _options, callback) => {
    callback(null, [{ address: '169.254.169.254', family: 4 }]);
  };

  try {
    await new Promise((resolve, reject) => {
      publicAddressLookup('rebound.example', {}, (error) => {
        if (!error) return reject(new Error('Expected private DNS result to be blocked'));
        assert.equal(error.code, 'ERR_BLOCKED_ADDRESS');
        resolve();
      });
    });
  } finally {
    dns.lookup = originalLookup;
  }
});