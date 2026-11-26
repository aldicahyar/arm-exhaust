import assert from 'node:assert';

const { agendaDate } = await import(new URL('../agenda-date.ts', import.meta.url).href);

console.log('Testing agenda-date...');

// agendaDate(raw): big day + short month for the agenda column; anything else is shown as-is
assert.deepStrictEqual(agendaDate('2026-03-15'), { day: '15', month: 'MAR', year: '2026', label: '15 Maret 2026' });
assert.deepStrictEqual(agendaDate('2026-05-02'), { day: '02', month: 'MEI', year: '2026', label: '2 Mei 2026' }, 'Indonesian month, zero-padded day');
assert.deepStrictEqual(agendaDate('2026-12-31T10:00:00Z'), { day: '31', month: 'DES', year: '2026', label: '31 Desember 2026' }, 'ISO timestamp uses the date part');
assert.deepStrictEqual(agendaDate('UPCOMING'), { day: '', month: 'UPCOMING', year: '', label: 'UPCOMING' }, 'non-date text passes through');
assert.deepStrictEqual(agendaDate('2026-13-40'), { day: '', month: '2026-13-40', year: '', label: '2026-13-40' }, 'impossible date passes through');
assert.deepStrictEqual(agendaDate(''), { day: '', month: '', year: '', label: '' });

console.log('PASS: agenda-date');
