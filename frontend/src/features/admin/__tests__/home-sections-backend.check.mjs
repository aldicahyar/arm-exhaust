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

const servicePath = 'backend/src/features/admin/content-management.service.ts';
assert(fs.existsSync(servicePath), 'content-management.service.ts must exist');
const serviceContent = fs.readFileSync(servicePath, 'utf-8');

assert(serviceContent.includes('getAllValueProps'), 'Service must have getAllValueProps');
assert(serviceContent.includes('reorderValueProps'), 'Service must have reorderValueProps');
assert(serviceContent.includes('getAllNewArrivals'), 'Service must have getAllNewArrivals');
assert(serviceContent.includes('reorderNewArrivals'), 'Service must have reorderNewArrivals');
assert(serviceContent.includes('getHomeHeaders'), 'Service must have getHomeHeaders');
assert(serviceContent.includes('DEFAULT_HOME_VALUE_PROPS'), 'Service must define DEFAULT_HOME_VALUE_PROPS');
assert(serviceContent.includes('DEFAULT_HOME_NEW_ARRIVALS'), 'Service must define DEFAULT_HOME_NEW_ARRIVALS');

// Verify DTO files
const vpDtoPath = 'backend/src/features/admin/dto/home-value-prop.dto.ts';
assert(fs.existsSync(vpDtoPath), 'home-value-prop.dto.ts must exist');
const vpDtoContent = fs.readFileSync(vpDtoPath, 'utf-8');
assert(vpDtoContent.includes('class CreateHomeValuePropDto'), 'Must export CreateHomeValuePropDto');
assert(vpDtoContent.includes('class UpdateHomeValuePropDto'), 'Must export UpdateHomeValuePropDto');

const naDtoPath = 'backend/src/features/admin/dto/home-new-arrival.dto.ts';
assert(fs.existsSync(naDtoPath), 'home-new-arrival.dto.ts must exist');
const naDtoContent = fs.readFileSync(naDtoPath, 'utf-8');
assert(naDtoContent.includes('class CreateHomeNewArrivalDto'), 'Must export CreateHomeNewArrivalDto');
assert(naDtoContent.includes('class UpdateHomeNewArrivalDto'), 'Must export UpdateHomeNewArrivalDto');

const headerDtoPath = 'backend/src/features/admin/dto/home-header.dto.ts';
assert(fs.existsSync(headerDtoPath), 'home-header.dto.ts must exist');
const headerDtoContent = fs.readFileSync(headerDtoPath, 'utf-8');
assert(headerDtoContent.includes('class HomeHeaderDto'), 'Must export HomeHeaderDto');
assert(headerDtoContent.includes('class UpdateHomeHeadersDto'), 'Must export UpdateHomeHeadersDto');

// Verify step_number auto-sync rule & active cap rule
assert(serviceContent.includes("padStart(2, '0')"), 'Reordering value props must auto-sync step_number with padStart(2, 0)');
assert(serviceContent.includes('validateNewArrivalActiveCap'), 'New arrival must enforce active item cap');

console.log('✅ Task 2 service assertions passed');


