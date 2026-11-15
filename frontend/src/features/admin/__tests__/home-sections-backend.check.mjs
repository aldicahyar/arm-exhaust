import assert from 'node:assert';
import fs from 'node:fs';

const schemaPath = 'backend/prisma/schema.prisma';
assert(fs.existsSync(schemaPath), 'schema.prisma must exist');
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

assert(schemaContent.includes('model HomeValueProp'), 'schema.prisma must define model HomeValueProp');
assert(schemaContent.includes('@@map("t_mtr_home_value_props")'), 'HomeValueProp must map to t_mtr_home_value_props');
assert(schemaContent.includes('model HomeNewArrival'), 'schema.prisma must define model HomeNewArrival');
assert(schemaContent.includes('@@map("t_mtr_home_new_arrivals")'), 'HomeNewArrival must map to t_mtr_home_new_arrivals');
assert(schemaContent.includes('product_id'), 'HomeNewArrival must include product_id column');
console.log('✅ Task 1 schema assertions passed');
